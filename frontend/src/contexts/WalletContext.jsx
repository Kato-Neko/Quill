import { createContext, useState, useContext, useEffect } from 'react';
import { BrowserWallet } from '@meshsdk/core';

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
      // Try Koios API first (public, no API key needed for testnet)
      let apiUrl;
      if (network === 'preview') {
        apiUrl = 'https://preview.koios.rest/api/v0/address_info';
      } else if (network === 'preprod') {
        apiUrl = 'https://preprod.koios.rest/api/v0/address_info';
      } else {
        // Mainnet - would need API key for Blockfrost
        // For now, return 0 if mainnet
        return '0';
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _addresses: [addr]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
          // Koios returns balance in Lovelace
          const balanceLovelace = data[0].balance || data[0].balance_total || '0';
          const balanceADA = (parseInt(balanceLovelace) / 1000000).toFixed(2);
          return balanceADA;
        }
      } else {
        console.warn('Koios API returned non-OK status:', response.status);
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
            const walletTransactions = loadedTransactions.filter(tx => 
              tx.senderAddress === savedAddress || 
              tx.recipientAddress === savedAddress ||
              (!tx.senderAddress && !tx.recipientAddress) // Legacy transactions without address
            );
            // Also filter out fake initial balance transactions
            const filteredTransactions = walletTransactions.filter(tx => 
              !tx.note?.toLowerCase().includes('initial wallet balance')
            );
            
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
          // Filter to only transactions for this wallet address
          const walletTransactions = loadedTransactions.filter(tx => 
            tx.senderAddress === addr || 
            tx.recipientAddress === addr ||
            (!tx.senderAddress && !tx.recipientAddress) // Legacy transactions without address
          );
          // Also filter out fake initial balance transactions
          const filteredTransactions = walletTransactions.filter(tx => 
            !tx.note?.toLowerCase().includes('initial wallet balance')
          );
          
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
        // Filter to only transactions for this wallet address
        const walletTransactions = loadedTransactions.filter(tx => 
          tx.senderAddress === addr || 
          tx.recipientAddress === addr ||
          (!tx.senderAddress && !tx.recipientAddress) // Legacy transactions without address
        );
        // Also filter out fake initial balance transactions
        const filteredTransactions = walletTransactions.filter(tx => 
          !tx.note?.toLowerCase().includes('initial wallet balance')
        );
        
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
  const saveTransactions = (txs, addr = address) => {
    setTransactions(txs);
    if (addr) {
      localStorage.setItem(getTransactionsKey(addr), JSON.stringify(txs));
    }
  };

  // Add a transaction to the ledger
  const addTransaction = (transactionData) => {
    const newTransaction = {
      id: transactionData.id || Date.now().toString(),
      type: transactionData.type || 'sent',
      amount: parseFloat(transactionData.amount),
      recipientAddress: transactionData.recipientAddress || null,
      senderAddress: transactionData.senderAddress || address,
      category: transactionData.category || 'Other',
      note: transactionData.note || null,
      date: transactionData.date || new Date().toISOString(),
      txHash: transactionData.txHash || null,
      status: transactionData.status || 'recorded',
      createdAt: transactionData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      operation: transactionData.operation || null, // 'note_create', 'note_update', 'note_delete'
      noteId: transactionData.noteId || null,
    };
    
    const updated = [newTransaction, ...transactions];
    saveTransactions(updated);
    return newTransaction;
  };

  // Record transaction for note creation
  const recordNoteCreate = (noteId, noteTitle, fee = 0.10) => {
    if (!address) return; // Only record if wallet is connected
    
    addTransaction({
      type: 'sent',
      amount: fee,
      category: 'Expense',
      note: `Note created: "${noteTitle}"`,
      operation: 'note_create',
      noteId: noteId.toString(),
      status: 'confirmed',
    });
  };

  // Record transaction for note update
  const recordNoteUpdate = (noteId, noteTitle, fee = 0.17) => {
    if (!address) return; // Only record if wallet is connected
    
    addTransaction({
      type: 'sent',
      amount: fee,
      category: 'Expense',
      note: `Note updated: "${noteTitle}"`,
      operation: 'note_update',
      noteId: noteId.toString(),
      status: 'confirmed',
    });
  };

  // Record transaction for note deletion
  const recordNoteDelete = (noteId, noteTitle, fee = 0.12) => {
    if (!address) return; // Only record if wallet is connected
    
    addTransaction({
      type: 'sent',
      amount: fee,
      category: 'Expense',
      note: `Note deleted: "${noteTitle}"`,
      operation: 'note_delete',
      noteId: noteId.toString(),
      status: 'confirmed',
    });
  };

  // Update a transaction
  const updateTransaction = (id, updates) => {
    const updated = transactions.map(tx => 
      tx.id === id 
        ? { ...tx, ...updates, updatedAt: new Date().toISOString() }
        : tx
    );
    saveTransactions(updated);
  };

  // Delete a transaction
  const deleteTransaction = (id) => {
    const updated = transactions.filter(tx => tx.id !== id);
    saveTransactions(updated);
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
    if (!wallet || isViewOnly) return;

    try {
      const bal = await wallet.getBalance();
      const balanceADA = (parseInt(bal[0].quantity) / 1000000).toFixed(2);
      setBalance(balanceADA);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
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
      deleteTransaction,
      recordNoteCreate,
      recordNoteUpdate,
      recordNoteDelete
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);