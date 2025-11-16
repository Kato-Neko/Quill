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

  // Load saved wallet address and transactions on mount (only once)
  useEffect(() => {
    const savedAddress = localStorage.getItem('connectedWallet');
    if (savedAddress && !address) {
      // If we have a saved address but no wallet instance, it might be view-only
      setAddress(savedAddress);
      setIsViewOnly(true);
    }
    
    // Load transactions from localStorage
    const savedTransactions = localStorage.getItem('walletTransactions');
    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions));
      } catch (error) {
        console.error('Failed to load transactions:', error);
      }
    }
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
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect wallet: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const connectManualAddress = (addr) => {
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
    setBalance('0'); // Can't get balance without wallet connection
    setWallet(null);
    setIsViewOnly(true);
    localStorage.setItem('connectedWallet', addr);
  };

  const disconnectWallet = () => {
    setWallet(null);
    setAddress('');
    setBalance('0');
    setIsViewOnly(false);
    localStorage.removeItem('connectedWallet');
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

  // Save transactions to localStorage
  const saveTransactions = (txs) => {
    setTransactions(txs);
    localStorage.setItem('walletTransactions', JSON.stringify(txs));
  };

  // Create a note automatically for received transactions
  const createNoteForTransaction = async (transaction) => {
    if (transaction.type !== 'received') return null;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
      const noteTitle = `Received ${transaction.amount} ADA`;
      const noteContent = `Transaction Details:
- Amount: ${transaction.amount} ADA
- From: ${transaction.senderAddress || 'Unknown'}
- Category: ${transaction.category}
- Date: ${new Date(transaction.date).toLocaleString()}
${transaction.txHash ? `- Transaction Hash: ${transaction.txHash}` : ''}
${transaction.note ? `\nNote: ${transaction.note}` : ''}`;

      const noteData = {
        title: noteTitle,
        content: noteContent,
        category: transaction.category || 'Income',
      };

      const response = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData)
      });

      if (response.ok) {
        const createdNote = await response.json();
        // Link the note to the transaction
        return createdNote.id;
      }
    } catch (error) {
      console.error('Failed to create note for transaction:', error);
    }
    return null;
  };

  // Add a transaction to the ledger
  const addTransaction = async (transactionData) => {
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
      linkedNoteId: null, // Will be set if note is created
    };
    
    // Automatically create a note for received transactions
    if (newTransaction.type === 'received') {
      const noteId = await createNoteForTransaction(newTransaction);
      if (noteId) {
        newTransaction.linkedNoteId = noteId;
      }
    }
    
    const updated = [newTransaction, ...transactions];
    saveTransactions(updated);
    return newTransaction;
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
      deleteTransaction
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);