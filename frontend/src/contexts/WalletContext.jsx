import { createContext, useState, useContext, useEffect, useRef } from 'react';
import { BrowserWallet } from '@meshsdk/core';
import { 
  buildAndSendNoteOperationTransaction, 
  estimateTransactionFee,
  hasSufficientBalance 
} from '../lib/transactionBuilder';
import { saveTransactionToBackend, syncTransactionsToBackend } from '../services/blockchainTransactionService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null);
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [network, setNetwork] = useState('preview'); // 'preview', 'preprod', or 'mainnet'
  const [isSending, setIsSending] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const pendingFeeUpdatesRef = useRef(new Set());

  const callKoiosProxy = async (targetNetwork, endpoint, payload) => {
    const response = await fetch(`${API_BASE_URL}/koios/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        network: targetNetwork,
        ...payload,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Koios proxy call failed (${endpoint})`);
    }

    return response.json();
  };

  // Get the provider URL based on network
  const getProviderUrl = () => {
    switch (network) {
      case 'preview':
        return 'https://preview.cardano.org/api/v1';
      case 'preprod':
        return 'https://preprod.cardano.org/api/v1';
      case 'mainnet':
        return 'https://cardano-mainnet.blockfrost.io/api/v0';
      default:
        return 'https://preview.cardano.org/api/v1';
    }
  };

  // Get localStorage key for transactions based on wallet address
  const getTransactionsKey = (addr) => {
    return addr ? `walletTransactions_${addr}` : 'walletTransactions';
  };

  // Calculate balance from transaction ledger
  const calculateBalanceFromTransactions = (txs = transactions) => {
    if (!txs || txs.length === 0) return '0';
    const totalReceived = txs
      .filter(tx => tx.type === 'received')
      .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
    const totalSent = txs
      .filter(tx => tx.type === 'sent')
      .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
    const netBalance = totalReceived - totalSent;
    return netBalance.toFixed(2);
  };

  // Fetch balance from blockchain API for a given address
  const fetchBalanceFromAPI = async (addr) => {
    try {
      const data = await callKoiosProxy(network, 'address-info', {
        addresses: [addr],
      });

      if (data && Array.isArray(data) && data.length > 0) {
        const balanceLovelace = data[0].balance || data[0].balance_total || '0';
        const balanceADA = (parseInt(balanceLovelace) / 1000000).toFixed(2);
        return balanceADA;
      }
    } catch (error) {
      console.error('Failed to fetch balance from Koios API:', error);
      
      // Fallback: Try Cardano Explorer API for preview testnet
      if (network === 'preview') {
        try {
          const explorerResponse = await fetch(
            `https://preview.cardanoscan.io/api/address/${addr}`,
            {
              headers: {
                'Accept': 'application/json',
              }
            }
          );
          
          if (explorerResponse.ok) {
            const explorerData = await explorerResponse.json();
            if (explorerData.balance) {
              const balanceADA = (parseInt(explorerData.balance) / 1000000).toFixed(2);
              return balanceADA;
            }
          }
        } catch (explorerError) {
          console.error('Failed to fetch balance from Cardano Explorer:', explorerError);
        }
      }
    }
    // Return '0' if all API calls fail - only show real blockchain balance
    return '0';
  };

  // Load saved wallet address and transactions on mount (only once)
  useEffect(() => {
    const loadSavedWallet = async () => {
      const savedAddress = localStorage.getItem('connectedWallet');
      
      if (savedAddress && !address) {
        // Try to reconnect to wallet extension first (if available)
        const availableWallets = BrowserWallet.getInstalledWallets();
        let reconnected = false;
        
        if (availableWallets.length > 0) {
          // Try to reconnect to the first available wallet
          // If the address matches, we'll have full access
          try {
            const walletInstance = await BrowserWallet.enable(availableWallets[0].name);
            const addr = await walletInstance.getChangeAddress();
            
            // If the address matches, we successfully reconnected!
            if (addr === savedAddress) {
              const bal = await walletInstance.getBalance();
              const balanceADA = (parseInt(bal[0].quantity) / 1000000).toFixed(2);
              
              setWallet(walletInstance);
              setAddress(addr);
              setBalance(balanceADA);
              setIsViewOnly(false);
              reconnected = true;
              
              // Sync transactions to backend after successful reconnection
              const transactionsKey = getTransactionsKey(addr);
              const savedTransactions = localStorage.getItem(transactionsKey);
              if (savedTransactions) {
                try {
                  const txs = JSON.parse(savedTransactions);
                  syncTransactionsToBackend(txs).catch(err => 
                    console.error('Failed to sync transactions on reconnect:', err)
                  );
                } catch (e) {
                  console.error('Failed to parse transactions for sync:', e);
                }
              }
            } else {
              // Address doesn't match, try other wallets
              for (let i = 1; i < availableWallets.length; i++) {
                try {
                  const otherWallet = await BrowserWallet.enable(availableWallets[i].name);
                  const otherAddr = await otherWallet.getChangeAddress();
                  
                  if (otherAddr === savedAddress) {
                    const bal = await otherWallet.getBalance();
                    const balanceADA = (parseInt(bal[0].quantity) / 1000000).toFixed(2);
                    
                    setWallet(otherWallet);
                    setAddress(otherAddr);
                    setBalance(balanceADA);
                    setIsViewOnly(false);
                    reconnected = true;
                    break;
                  }
                } catch (err) {
                  // Continue to next wallet
                  continue;
                }
              }
            }
          } catch (error) {
            // Wallet connection failed, will fall back to view-only
            console.log('Could not reconnect to wallet extension:', error);
          }
        }
        
        // Load transactions ONLY for this specific wallet address
        const transactionsKey = getTransactionsKey(savedAddress);
        const savedTransactions = localStorage.getItem(transactionsKey);
        
        if (savedTransactions) {
          try {
            const loadedTransactions = JSON.parse(savedTransactions);
            // Filter to only transactions for this wallet address
            const walletTransactions = loadedTransactions
              .filter(tx => 
                tx.senderAddress === savedAddress || 
                tx.recipientAddress === savedAddress ||
                (!tx.senderAddress && !tx.recipientAddress) // Legacy transactions without address
              )
              .map(tx => ({
                ...tx,
                feeSource: tx.feeSource || (tx.txHash ? 'estimated' : 'local'),
                backendSynced: Boolean(tx.backendSynced),
              }));
            // Filter out old mock transactions:
            // 1. Fake initial balance transactions
            // 2. Transactions with status 'confirmed' but no txHash (old mock data)
            const filteredTransactions = walletTransactions.filter(tx => {
              if (tx.note?.toLowerCase().includes('initial wallet balance')) {
                return false;
              }
              if (tx.status === 'confirmed' && !tx.txHash) {
                return false;
              }
              return true;
            });
            
            if (filteredTransactions.length !== loadedTransactions.length) {
              // Save filtered transactions back if we removed any
              setTransactions(filteredTransactions);
              localStorage.setItem(transactionsKey, JSON.stringify(filteredTransactions));
            } else {
              setTransactions(filteredTransactions);
            }
          } catch (error) {
            console.error('Failed to load transactions:', error);
          }
        } else {
          // No transactions for this wallet, start fresh
          setTransactions([]);
        }
        
        // If we couldn't reconnect to wallet extension, use view-only mode
        if (!reconnected) {
          setAddress(savedAddress);
          setIsViewOnly(true);
          // Fetch real balance from blockchain API only
          const fetchedBalance = await fetchBalanceFromAPI(savedAddress);
          setBalance(fetchedBalance);
        }
      } else {
        // No saved wallet, clear transactions
        setTransactions([]);
      }
    };
    
    loadSavedWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const getAvailableWallets = () => {
    return BrowserWallet.getInstalledWallets();
  };

  const connectWallet = async (walletName = null) => {
    setIsConnecting(true);
    try {
      const availableWallets = BrowserWallet.getInstalledWallets();
      if (availableWallets.length === 0) {
        alert('No Cardano wallet found. Please install Lace, Eternl, or Nami.');
        setIsConnecting(false);
        return;
      }

      // Use provided wallet name or default to first available
      const walletToUse = walletName || availableWallets[0].name;
      const walletInstance = await BrowserWallet.enable(walletToUse);
      const addr = await walletInstance.getChangeAddress();
      const bal = await walletInstance.getBalance();
      const balanceADA = (parseInt(bal[0].quantity) / 1000000).toFixed(2);

      setWallet(walletInstance);
      setAddress(addr);
      setBalance(balanceADA);
      setIsViewOnly(false);
      
      localStorage.setItem('connectedWallet', addr);
      
      // Load transactions ONLY for this specific wallet address
      const transactionsKey = getTransactionsKey(addr);
      const savedTransactions = localStorage.getItem(transactionsKey);
      
      if (savedTransactions) {
        try {
          const loadedTransactions = JSON.parse(savedTransactions);
          const walletTransactions = loadedTransactions
            .filter(tx => 
              tx.senderAddress === addr || 
              tx.recipientAddress === addr ||
              (!tx.senderAddress && !tx.recipientAddress)
            )
            .map(tx => ({
              ...tx,
              feeSource: tx.feeSource || (tx.txHash ? 'estimated' : 'local'),
              backendSynced: Boolean(tx.backendSynced),
            }));
          const filteredTransactions = walletTransactions.filter(tx => {
            if (tx.note?.toLowerCase().includes('initial wallet balance')) {
              return false;
            }
            if (tx.status === 'confirmed' && !tx.txHash) {
              return false;
            }
            return true;
          });
          
          if (filteredTransactions.length !== loadedTransactions.length) {
            setTransactions(filteredTransactions);
            localStorage.setItem(transactionsKey, JSON.stringify(filteredTransactions));
          } else {
            setTransactions(filteredTransactions);
          }
          
          // Sync transactions to backend after loading
          syncTransactionsToBackend(filteredTransactions).catch(err => 
            console.error('Failed to sync transactions on connect:', err)
          );
        } catch (error) {
          console.error('Failed to load transactions:', error);
          setTransactions([]);
        }
      } else {
        // No transactions for this wallet, start fresh
        setTransactions([]);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect wallet: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const connectManualAddress = async (addr) => {
    if (!addr || addr.trim() === '') {
      alert('Please enter a valid Cardano address');
      return;
    }

    // Basic validation - Cardano addresses start with 'addr' or 'addr1'
    if (!addr.startsWith('addr')) {
      alert('Invalid Cardano address format');
      return;
    }

    setAddress(addr);
    setWallet(null);
    setIsViewOnly(true);
    localStorage.setItem('connectedWallet', addr);
    
    // Load transactions ONLY for this specific wallet address
    const transactionsKey = getTransactionsKey(addr);
    const savedTransactions = localStorage.getItem(transactionsKey);
    
    if (savedTransactions) {
      try {
        const loadedTransactions = JSON.parse(savedTransactions);
        const walletTransactions = loadedTransactions
          .filter(tx => 
            tx.senderAddress === addr || 
            tx.recipientAddress === addr ||
            (!tx.senderAddress && !tx.recipientAddress)
          )
          .map(tx => ({
            ...tx,
            feeSource: tx.feeSource || (tx.txHash ? 'estimated' : 'local'),
            backendSynced: Boolean(tx.backendSynced),
          }));
        const filteredTransactions = walletTransactions.filter(tx => {
          if (tx.note?.toLowerCase().includes('initial wallet balance')) {
            return false;
          }
          if (tx.status === 'confirmed' && !tx.txHash) {
            return false;
          }
          return true;
        });
        
        if (filteredTransactions.length !== loadedTransactions.length) {
          setTransactions(filteredTransactions);
          localStorage.setItem(transactionsKey, JSON.stringify(filteredTransactions));
        } else {
          setTransactions(filteredTransactions);
        }
      } catch (error) {
        console.error('Failed to load transactions:', error);
        setTransactions([]);
      }
    } else {
      // No transactions for this wallet, start fresh
      setTransactions([]);
    }
    
    // Fetch real balance from blockchain API only
    const fetchedBalance = await fetchBalanceFromAPI(addr);
    setBalance(fetchedBalance);
  };

  const disconnectWallet = () => {
    setWallet(null);
    setAddress('');
    setBalance('0');
    setIsViewOnly(false);
    setTransactions([]); // Clear transactions when disconnecting
    localStorage.removeItem('connectedWallet');
  };

  // Save transactions to localStorage (per wallet address)
  const saveTransactions = (txsOrUpdater, addr = address) => {
    if (typeof txsOrUpdater === 'function') {
      setTransactions((prev = []) => {
        const next = txsOrUpdater(prev);
        if (addr) {
          localStorage.setItem(getTransactionsKey(addr), JSON.stringify(next));
        }
        return next;
      });
    } else {
      setTransactions(txsOrUpdater);
      if (addr) {
        localStorage.setItem(getTransactionsKey(addr), JSON.stringify(txsOrUpdater));
      }
    }
  };

  const updateTransaction = (id, updates) => {
    if (!id) return null;
    let updatedTransaction = null;
    saveTransactions((prev = []) => {
      const next = prev.map(tx => {
        if (tx.id === id) {
          updatedTransaction = {
            ...tx,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          return updatedTransaction;
        }
        return tx;
      });
      return next;
    });
    return updatedTransaction;
  };

  // Attach a real noteId to a transaction once the backend note is created
  const linkNoteIdToTx = (txHash, noteId) => {
    if (!txHash || !noteId) return;
    saveTransactions((prev = []) =>
      prev.map((tx) =>
        normalizeTxHash(tx.txHash) === normalizeTxHash(txHash)
          ? { ...tx, noteId: noteId.toString(), updatedAt: new Date().toISOString() }
          : tx
      )
    );
  };

  const normalizeTxHash = (hash) => (typeof hash === 'string' ? hash.trim() : hash);

  const updateNoteStatusBackend = async (noteId, status, txHash, txNetwork, walletAddr) => {
    if (!noteId) return;
    try {
      const params = new URLSearchParams();
      params.append('status', status);
      if (txHash) params.append('txHash', txHash);
      if (txNetwork) params.append('network', txNetwork);
      if (walletAddr) params.append('walletAddress', walletAddr);

      await fetch(`${API_BASE_URL}/notes/${noteId}/status?${params.toString()}`, {
        method: 'PATCH',
      });
    } catch (error) {
      console.error('Failed to update note status in backend:', error);
    }
  };

  /**
   * Background check: fetch tx info for pending transactions and mark confirmed when found.
   */
  const checkPendingTransactions = async () => {
    const pendingTxs = transactions.filter(
      (tx) => tx.status === 'pending' && tx.txHash && !tx.backendSynced
    );
    if (!pendingTxs.length) return;

    const txHashes = pendingTxs.map((tx) => normalizeTxHash(tx.txHash));
    try {
      const data = await callKoiosProxy(network, 'tx-info', { txHashes });
      if (!Array.isArray(data)) return;

      for (const txInfo of data) {
        const txHash = normalizeTxHash(txInfo?.tx_hash);
        if (!txHash) continue;
        const matched = pendingTxs.find((tx) => normalizeTxHash(tx.txHash) === txHash);
        if (!matched) continue;

        const feeADA = txInfo?.fee ? parseInt(txInfo.fee, 10) / 1_000_000 : null;

        const updatedTx = updateTransaction(matched.id, {
          status: 'confirmed',
          amount: feeADA !== null ? feeADA : matched.amount,
          feeSource: feeADA !== null ? 'blockchain' : matched.feeSource,
          backendSynced: false,
        });

        if (updatedTx) {
          persistTransactionToBackend(updatedTx);
        }

        // Update related note status if available
        if (matched.noteId) {
          updateNoteStatusBackend(
            matched.noteId,
            'confirmed',
            txHash,
            matched.network || network,
            matched.senderAddress || address
          );
        }
      }
    } catch (error) {
      console.error('Failed to check pending transactions:', error);
    }
  };

  const persistTransactionToBackend = async (transaction) => {
    if (!transaction?.txHash || transaction.status !== 'confirmed') return;
    if (transaction.feeSource !== 'blockchain') return;
    if (transaction.backendSynced) return;

    try {
      const result = await saveTransactionToBackend(transaction);
      if (result !== null) {
        updateTransaction(transaction.id, { backendSynced: true });
      }
    } catch (error) {
      console.error('Failed to sync transaction to backend:', error);
    }
  };

  // Add a transaction to the ledger
  const addTransaction = (transactionData) => {
    const newTransaction = {
      id: transactionData.id || Date.now().toString(),
      type: transactionData.type || 'sent',
      amount: transactionData.amount !== undefined && transactionData.amount !== null
        ? parseFloat(transactionData.amount)
        : null,
      recipientAddress: transactionData.recipientAddress || null,
      senderAddress: transactionData.senderAddress || address,
      category: transactionData.category || 'Other',
      note: transactionData.note || null,
      date: transactionData.date || new Date().toISOString(),
      txHash: normalizeTxHash(transactionData.txHash) || null,
      status: transactionData.status || 'recorded',
      createdAt: transactionData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      operation: transactionData.operation || null, // 'note_create', 'note_update', 'note_delete'
      noteId: transactionData.noteId || null,
      network: transactionData.network || network,
      noteTitle: transactionData.noteTitle || null,
      feeSource: transactionData.feeSource || 'estimated',
      backendSynced: transactionData.backendSynced || false,
    };
    
    saveTransactions((prev = []) => [newTransaction, ...prev]);
    
    if (
      newTransaction.txHash &&
      newTransaction.status === 'confirmed' &&
      newTransaction.feeSource === 'blockchain' &&
      newTransaction.amount !== null
    ) {
      persistTransactionToBackend(newTransaction);
    }
    
    return newTransaction;
  };

  // Helper to normalize metadata inputs
  const normalizeNoteMetadata = ({ 
    category, 
    createdAt, 
    updatedAt,
    isPinned, 
    isStarred, 
    isArchived, 
    isDeleted 
  }) => {
    return {
      category: category || 'Uncategorized',
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: updatedAt || new Date().toISOString(),
      isPinned: Boolean(isPinned),
      isStarred: Boolean(isStarred),
      isArchived: Boolean(isArchived),
      isDeleted: Boolean(isDeleted),
    };
  };

  // Send real blockchain transaction for note creation
// === FIXED: recordNoteCreate ===
const recordNoteCreate = async ({
  noteId,
  noteTitle,
  noteContent,
  category,
  createdAt,
  updatedAt,
  isPinned,
  isStarred,
  isArchived,
  isDeleted,
  fee = 0.10,
} = {}) => {
  if (!wallet) {
    if (!address || isViewOnly) {
      throw new Error('Wallet not connected. Please connect your wallet to create notes.');
    }
    // Wallet object might be null during re-hydration, but if we have an address and are not view-only, we can proceed.
  }

  if (!noteId || !noteTitle) {
    throw new Error('Missing noteId or noteTitle');
  }

  try {
    const metadata = normalizeNoteMetadata({ 
      category, createdAt, updatedAt, isPinned, isStarred, isArchived, isDeleted 
    });

    // The hasSufficientBalance check is now inside buildAndSendNoteOperationTransaction
    // to ensure it uses the most up-to-date wallet instance.

    // We now await the result of the entire transaction process.
    // The user will be prompted to sign, and we wait for that to complete.
    const txHash = await buildAndSendNoteOperationTransaction({ 
      wallet,
      operationType: 'create',
      noteId,
      noteTitle,
      noteCategory: metadata.category,
      noteContent,
      isPinned: metadata.isPinned,
      isStarred: metadata.isStarred,
      isArchived: metadata.isArchived,
      isDeleted: metadata.isDeleted,
      timeCreated: metadata.createdAt,
      timeUpdated: metadata.updatedAt,
      feeAmount: fee,
      network,
      signingTimeout: 90000, // 90-second timeout for signing
    });

    if (!txHash) {
      throw new Error('Transaction was not signed or failed to submit.');
    }

    const ledgerEntry = addTransaction({
      type: 'sent',
      amount: null, // Initially null - will be updated with actual fee from blockchain
      category: 'Expense',
      note: `Note created: "${noteTitle}" (${metadata.category})`,
      operation: 'note_create',
      noteId: noteId.toString(),
      noteTitle,
      status: 'pending',
      txHash,
      network,
      feeSource: 'estimated',
    });
    
    // Update with actual fee from blockchain
    updateTransactionWithActualFee(ledgerEntry.id, txHash, network).catch((err) => {
      console.error('Failed to update ledger with actual fee (create):', err);
    });

    await refreshBalance();
    return txHash;
  } catch (error) {
    console.error('Create transaction failed:', error);
    throw error; // Let UI show error
  }
};

  // Send real blockchain transaction for note update
// === FIXED: recordNoteUpdate ===
const recordNoteUpdate = async ({
  noteId,
  noteTitle,
  noteContent,
  category,
  createdAt,
  updatedAt,
  isPinned,
  isStarred,
  isArchived,
  isDeleted,
  fee = 0.17,
} = {}) => {
  if (!wallet && !isViewOnly) {
    throw new Error('Wallet not connected. Please connect your wallet to update notes.');
  }

  if (!noteId || !noteTitle) {
    throw new Error('Missing noteId or noteTitle');
  }

  try {
    const metadata = normalizeNoteMetadata({ category, createdAt, updatedAt, isPinned, isStarred, isArchived, isDeleted });

    const txHash = await buildAndSendNoteOperationTransaction({
      wallet,
      operationType: 'update',
      noteId,
      noteTitle,
      noteCategory: metadata.category,
      noteContent,
      isPinned: metadata.isPinned,
      isStarred: metadata.isStarred,
      isArchived: metadata.isArchived,
      isDeleted: metadata.isDeleted,
      timeCreated: metadata.createdAt,
      timeUpdated: metadata.updatedAt,
      feeAmount: fee,
      network,
      signingTimeout: 90000, // 90-second timeout for signing
    });

    if (!txHash) {
      throw new Error('Update transaction was not signed or failed to submit.');
    }

    const ledgerEntry = addTransaction({
      type: 'sent',
      amount: null, // Initially null - will be updated with actual fee from blockchain
      category: 'Expense',
      note: `Note updated: "${noteTitle}" (${metadata.category})`,
      operation: 'note_update',
      noteId: noteId.toString(),
      noteTitle,
      status: 'pending',
      txHash,
      network,
      feeSource: 'estimated',
    });
    
    // Update with actual fee from blockchain
    updateTransactionWithActualFee(ledgerEntry.id, txHash, network).catch((err) => {
      console.error('Failed to update ledger with actual fee (update):', err);
    });

    await refreshBalance();
    return txHash;
  } catch (error) {
    console.error('Update transaction failed:', error);
    throw error;
  }
};

  // Send real blockchain transaction for note deletion
// === FIXED: recordNoteDelete ===
const recordNoteDelete = async ({
  noteId,
  noteTitle,
  noteContent,
  category,
  createdAt,
  updatedAt,
  isPinned,
  isStarred,
  isArchived,
  isDeleted,
  fee = 0.12,
} = {}) => {
  if (!wallet && !isViewOnly) {
    throw new Error('Wallet not connected. Please connect your wallet to delete notes.');
  }

  if (!noteId || !noteTitle) {
    throw new Error('Missing noteId or noteTitle');
  }

  try {
    const metadata = normalizeNoteMetadata({ 
      category, createdAt, updatedAt, isPinned, isStarred, isArchived, isDeleted: true 
    });

    const txHash = await buildAndSendNoteOperationTransaction({
      wallet,
      operationType: 'delete',
      noteId,
      noteTitle,
      noteCategory: metadata.category,
      noteContent,
      isPinned: metadata.isPinned,
      isStarred: metadata.isStarred,
      isArchived: metadata.isArchived,
      isDeleted: true,
      timeCreated: metadata.createdAt,
      timeUpdated: metadata.updatedAt,
      feeAmount: fee,
      network,
      signingTimeout: 90000, // 90-second timeout for signing
    });

    if (!txHash) {
      throw new Error('Delete transaction was not signed or failed to submit.');
    }

    const ledgerEntry = addTransaction({
      type: 'sent',
      amount: null, // Initially null - will be updated with actual fee from blockchain
      category: 'Expense',
      note: `Note deleted: "${noteTitle}" (${metadata.category})`,
      operation: 'note_delete',
      noteId: noteId.toString(),
      noteTitle,
      status: 'pending',
      txHash,
      network,
      feeSource: 'estimated',
    });
    
    // Update with actual fee from blockchain
    updateTransactionWithActualFee(ledgerEntry.id, txHash, network).catch((err) => {
      console.error('Failed to update ledger with actual fee (delete):', err);
    });

    await refreshBalance();
    return txHash;
  } catch (error) {
    console.error('Delete transaction failed:', error);
    throw error;
  }
};

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const MAX_FEE_FETCH_ATTEMPTS = 12; // try for up to ~60s (12 * 5s)
  const FEE_FETCH_DELAY_MS = 5000;
  const fetchTransactionFeeFromBlockchain = async (txHash, txNetwork = network, attempt = 0) => {
    if (!txHash) return null;

    try {
      const data = await callKoiosProxy(txNetwork, 'tx-info', {
        txHashes: [txHash],
      });

      if (Array.isArray(data) && data.length > 0 && data[0].fee) {
        const feeADA = (parseInt(data[0].fee, 10) / 1000000).toFixed(6);
        return feeADA;
      }
    } catch (error) {
      console.error('Failed to fetch transaction fee from blockchain:', error);
    }

    if (attempt < MAX_FEE_FETCH_ATTEMPTS) {
      await sleep(FEE_FETCH_DELAY_MS);
      return fetchTransactionFeeFromBlockchain(txHash, attempt + 1);
    }

    return null;
  };

  const updateTransactionWithActualFee = async (ledgerTransactionId, txHash, txNetwork = network) => {
    if (!ledgerTransactionId || !txHash) return;
    const actualFee = await fetchTransactionFeeFromBlockchain(normalizeTxHash(txHash), txNetwork);
    if (actualFee !== null) {
      const updatedTx = updateTransaction(ledgerTransactionId, {
        amount: parseFloat(actualFee),
        feeSource: 'blockchain',
        backendSynced: false,
      });
      if (updatedTx) {
        persistTransactionToBackend(updatedTx);
      }
    }
  };

  // Refresh any recorded transactions whose fees are still estimated
  useEffect(() => {
    const refreshPendingFees = async () => {
      if (!address || !transactions.length) return;

      for (const tx of transactions) {
        if (tx.txHash && tx.feeSource !== 'blockchain') {
          const key = `${tx.id || tx.txHash}`;
          if (pendingFeeUpdatesRef.current.has(key)) continue;
          pendingFeeUpdatesRef.current.add(key);
          updateTransactionWithActualFee(tx.id, tx.txHash, tx.network || network)
            .catch((err) => console.error('Fee update failed', err))
            .finally(() => {
              pendingFeeUpdatesRef.current.delete(key);
            });
          await sleep(500); // small delay to avoid spamming API
        } else if (tx.txHash && tx.feeSource === 'blockchain' && !tx.backendSynced) {
          await persistTransactionToBackend(tx);
          await sleep(200);
        }
      }
    };

    refreshPendingFees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, transactions]);

  // Background worker: poll Koios for pending tx confirmations every 20s
  useEffect(() => {
    const intervalId = setInterval(() => {
      checkPendingTransactions();
    }, 20000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, network]);

  // Delete a transaction
  const deleteTransaction = (id) => {
    const updated = transactions.filter(tx => tx.id !== id);
    saveTransactions(updated);
  };

  /**
   * Restore notes from on-chain metadata for the current wallet.
   * Uses Koios address_txs to list hashes, then tx_info to fetch metadata (label 1337).
   * Returns a list of reconstructed notes; caller can decide how to persist.
   */
  const restoreNotesFromChain = async () => {
    if (!address) return [];

    try {
      // Step 1: fetch tx hashes for this address
      const txList = await callKoiosProxy(network, 'address-txs', {
        addresses: [address],
        limit: 50, // fetch recent 50; can be increased if needed
      });
      const txHashes = Array.isArray(txList)
        ? txList.map((tx) => normalizeTxHash(tx?.tx_hash)).filter(Boolean)
        : [];

      if (!txHashes.length) return [];

      // Step 2: fetch tx info for those hashes
      const data = await callKoiosProxy(network, 'tx-info', { txHashes });
      if (!Array.isArray(data)) return [];

      const restored = [];
      for (const txInfo of data) {
        const metadata = txInfo?.metadata;
        const label1337 = metadata && metadata['1337'];
        if (!label1337?.map) continue;

        const asObj = {};
        for (const entry of label1337.map) {
          const key = entry?.k?.string;
          const value = entry?.v;
          if (!key || !value) continue;
          if (value.string !== undefined) {
            asObj[key] = value.string;
          } else if (Array.isArray(value.list)) {
            asObj[key] = value.list.map((v) => v?.string || '').join('');
          }
        }

        if (asObj.noteId || asObj.noteTitle) {
          restored.push({
            noteId: asObj.noteId,
            title: asObj.noteTitle || 'Untitled',
            content: asObj.noteContent || '',
            category: asObj.category || 'Uncategorized',
            isPinned: asObj.isPinned === 'true',
            isStarred: asObj.isStarred === 'true',
            isArchived: asObj.isArchived === 'true',
            isDeleted: asObj.isDeleted === 'true',
            createdAt: asObj.createdAt,
            updatedAt: asObj.updatedAt,
            txHash: txInfo?.tx_hash,
          });
        }
      }
      return restored;
    } catch (error) {
      console.error('Failed to restore notes from chain:', error);
      return [];
    }
  };

  // Build and send a transaction using wallet's built-in transaction building
  const sendTransaction = async (recipientAddress, amountInADA, note = null, category = 'Payment') => {
    if (!wallet || isViewOnly) {
      alert('Please connect a wallet to send transactions');
      return;
    }

    if (!recipientAddress || !amountInADA) {
      alert('Please provide recipient address and amount');
      return;
    }

    setIsSending(true);
    try {
      // Convert ADA to Lovelace (1 ADA = 1,000,000 Lovelace)
      const amountInLovelace = (parseFloat(amountInADA) * 1000000).toString();

      // Use the wallet's transaction building API
      // Most Cardano wallets (Lace, Eternl, Nami) support this pattern
      const tx = {
        inputs: [], // Will be populated by wallet
        outputs: [
          {
            address: recipientAddress,
            amount: amountInLovelace,
          }
        ],
      };

      // Build the unsigned transaction using wallet API
      // Note: Different wallets may have slightly different APIs
      let unsignedTx;
      if (wallet.buildTx) {
        // If wallet has buildTx method
        unsignedTx = await wallet.buildTx(tx);
      } else if (wallet.createTx) {
        // Alternative method name
        unsignedTx = await wallet.createTx(tx);
      } else {
        // Fallback: use wallet's transaction building
        // This is a simplified approach - in production, you'd use Mesh SDK's transaction builder
        throw new Error('Wallet does not support transaction building. Please use Mesh SDK transaction builder.');
      }

      // Sign the transaction with the wallet
      const signedTx = await wallet.signTx(unsignedTx);

      // Submit the transaction
      const txHash = await wallet.submitTx(signedTx);

      // Refresh balance
      const bal = await wallet.getBalance();
      const balanceADA = (parseInt(bal[0].quantity) / 1000000).toFixed(2);
      setBalance(balanceADA);

      // Record transaction in ledger
      addTransaction({
        type: 'sent',
        amount: amountInADA,
        recipientAddress,
        category,
        note,
        txHash,
        status: 'confirmed',
      });

      alert(`Transaction successful! Hash: ${txHash}`);
      return txHash;
    } catch (error) {
      console.error('Transaction failed:', error);
      alert('Transaction failed: ' + (error.message || error.toString()));
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  // Refresh balance
  const refreshBalance = async () => {
    console.log('Refreshing balance...', { isViewOnly, hasAddress: !!address, hasWallet: !!wallet });
    
    if (isViewOnly && address) {
      // For view-only mode, fetch from blockchain API
      try {
        console.log('Fetching balance from API for view-only address:', address);
        const fetchedBalance = await fetchBalanceFromAPI(address);
        console.log('Balance fetched from API:', fetchedBalance);
        setBalance(fetchedBalance);
        return;
      } catch (error) {
        console.error('Failed to refresh balance from API:', error);
        throw error;
      }
    }

    if (!wallet) {
      console.warn('Cannot refresh balance: no wallet connected');
      return;
    }

    try {
      console.log('Fetching balance from wallet...');
      const bal = await wallet.getBalance();
      console.log('Raw balance from wallet:', bal);
      const balanceADA = (parseInt(bal[0]?.quantity || 0) / 1000000).toFixed(2);
      console.log('Balance in ADA:', balanceADA);
      setBalance(balanceADA);
    } catch (error) {
      console.error('Failed to refresh balance from wallet:', error);
      // Fallback to API if wallet method fails
      if (address) {
        try {
          console.log('Falling back to API for balance...');
          const fetchedBalance = await fetchBalanceFromAPI(address);
          console.log('Balance fetched from API (fallback):', fetchedBalance);
          setBalance(fetchedBalance);
        } catch (apiError) {
          console.error('Failed to refresh balance from API (fallback):', apiError);
          throw apiError;
        }
      } else {
        throw error;
      }
    }
  };

  return (
    <WalletContext.Provider value={{
      wallet,
      address,
      balance,
      isConnecting,
      isSending,
      isViewOnly,
      network,
      transactions,
      connectWallet,
      connectManualAddress,
      disconnectWallet,
      getAvailableWallets,
      sendTransaction,
      refreshBalance,
      setNetwork,
      addTransaction,
      updateTransaction,
      linkNoteIdToTx,
      deleteTransaction,
      restoreNotesFromChain,
      recordNoteCreate,
      recordNoteUpdate,
      recordNoteDelete
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);