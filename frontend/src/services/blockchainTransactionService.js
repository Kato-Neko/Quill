/**
 * Service for syncing blockchain transaction metadata with backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/**
 * Save transaction metadata to backend database
 * @param {Object} transactionData - Transaction data from wallet context
 * @returns {Promise<Object>} Saved transaction from backend
 */
const buildTransactionPayload = (transactionData) => ({
  txHash: transactionData.txHash,
  operationType: transactionData.operation,
  noteId: transactionData.noteId ? parseInt(transactionData.noteId, 10) : null,
  walletAddress: transactionData.senderAddress,
  amount: transactionData.amount !== undefined && transactionData.amount !== null
    ? parseFloat(transactionData.amount)
    : null,
  fee: transactionData.amount !== undefined && transactionData.amount !== null
    ? parseFloat(transactionData.amount)
    : null,
  network: transactionData.network || 'preview',
  status: transactionData.status || 'confirmed',
  metadata: transactionData.metadata ? JSON.stringify(transactionData.metadata) : null,
  noteTitle: transactionData.noteTitle || extractNoteTitleFromNote(transactionData.note),
  description: transactionData.note,
  errorMessage: transactionData.errorMessage || null,
});

const fetchTransactionByHash = async (txHash) => {
  if (!txHash) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/blockchain-transactions/hash/${txHash}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching transaction by hash:', error);
    return null;
  }
};

const updateTransactionInBackend = async (transactionId, transactionData) => {
  if (!transactionId) return null;
  try {
    const payload = {
      ...buildTransactionPayload(transactionData),
      id: transactionId,
    };
    const response = await fetch(`${API_BASE_URL}/blockchain-transactions/${transactionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to update transaction: ${response.status}`);
    }

    const updatedTransaction = await response.json();
    console.log('Transaction updated in backend:', updatedTransaction);
    return updatedTransaction;
  } catch (error) {
    console.error('Error updating transaction in backend:', error);
    return null;
  }
};

export const saveTransactionToBackend = async (transactionData) => {
  if (!transactionData?.txHash) return null;
  const payload = buildTransactionPayload(transactionData);

  try {
    const response = await fetch(`${API_BASE_URL}/blockchain-transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 409) {
        console.log('Transaction already exists in database, attempting update:', transactionData.txHash);
        const existing = await fetchTransactionByHash(transactionData.txHash);
        if (existing?.id) {
          return await updateTransactionInBackend(existing.id, {
            ...transactionData,
            id: existing.id,
          });
        }
        return null;
      }
      throw new Error(`Failed to save transaction: ${response.status}`);
    }

    const savedTransaction = await response.json();
    console.log('Transaction saved to backend:', savedTransaction);
    return savedTransaction;
  } catch (error) {
    console.error('Error saving transaction to backend:', error);
    return null;
  }
};

/**
 * Fetch transactions from backend for a wallet
 * @param {string} walletAddress - Wallet address
 * @param {Object} filters - Optional filters (operationType, status, network)
 * @param {number} page - Page number (0-indexed)
 * @param {number} size - Page size
 * @returns {Promise<Object>} Page of transactions
 */
export const fetchTransactionsFromBackend = async (
  walletAddress,
  filters = {},
  page = 0,
  size = 50
) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (walletAddress) {
      params.append('walletAddress', walletAddress);
    }

    if (filters.operationType) {
      params.append('operationType', filters.operationType);
    }

    if (filters.status) {
      params.append('status', filters.status);
    }

    if (filters.network) {
      params.append('network', filters.network);
    }

    const response = await fetch(`${API_BASE_URL}/blockchain-transactions?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status}`);
    }

    const data = await response.json();
    console.log('Transactions fetched from backend:', data);
    return data;
  } catch (error) {
    console.error('Error fetching transactions from backend:', error);
    return null;
  }
};

/**
 * Fetch transactions for a specific note
 * @param {number} noteId - Note ID
 * @param {number} page - Page number (0-indexed)
 * @param {number} size - Page size
 * @returns {Promise<Object>} Page of transactions
 */
export const fetchNoteTransactions = async (noteId, page = 0, size = 10) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/blockchain-transactions/note/${noteId}?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch note transactions: ${response.status}`);
    }

    const data = await response.json();
    console.log('Note transactions fetched from backend:', data);
    return data;
  } catch (error) {
    console.error('Error fetching note transactions from backend:', error);
    return null;
  }
};

/**
 * Fetch transaction statistics
 * @param {string} walletAddress - Wallet address (optional)
 * @returns {Promise<Object>} Transaction statistics
 */
export const fetchTransactionStats = async (walletAddress = null) => {
  try {
    const params = new URLSearchParams();
    if (walletAddress) {
      params.append('walletAddress', walletAddress);
    }

    const response = await fetch(
      `${API_BASE_URL}/blockchain-transactions/stats?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.status}`);
    }

    const data = await response.json();
    console.log('Transaction stats fetched from backend:', data);
    return data;
  } catch (error) {
    console.error('Error fetching transaction stats from backend:', error);
    return null;
  }
};

/**
 * Update transaction status in backend
 * @param {number} transactionId - Transaction ID in backend
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated transaction
 */
export const updateTransactionStatus = async (transactionId, status) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/blockchain-transactions/${transactionId}/status?status=${status}`,
      {
        method: 'PATCH',
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update transaction status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Transaction status updated in backend:', data);
    return data;
  } catch (error) {
    console.error('Error updating transaction status in backend:', error);
    return null;
  }
};

/**
 * Fetch recent transactions for a wallet (last 10)
 * @param {string} walletAddress - Wallet address
 * @returns {Promise<Array>} Recent transactions
 */
export const fetchRecentTransactions = async (walletAddress) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/blockchain-transactions/wallet/${walletAddress}/recent`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch recent transactions: ${response.status}`);
    }

    const data = await response.json();
    console.log('Recent transactions fetched from backend:', data);
    return data;
  } catch (error) {
    console.error('Error fetching recent transactions from backend:', error);
    return [];
  }
};

/**
 * Sync localStorage transactions to backend
 * @param {Array} transactions - Transactions from localStorage
 * @returns {Promise<void>}
 */
export const syncTransactionsToBackend = async (transactions) => {
  console.log('Syncing transactions to backend:', transactions.length);
  
  for (const transaction of transactions) {
    // Only sync transactions that have a txHash (confirmed blockchain transactions)
    if (
      transaction.txHash &&
      transaction.status === 'confirmed' &&
      transaction.feeSource === 'blockchain' &&
      transaction.amount !== null &&
      transaction.amount !== undefined
    ) {
      await saveTransactionToBackend(transaction);
      // Small delay to avoid overwhelming the backend
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('Transaction sync complete');
};

/**
 * Extract note title from transaction note field
 * @param {string} note - Transaction note
 * @returns {string|null} Extracted title
 */
const extractNoteTitleFromNote = (note) => {
  if (!note) return null;
  
  // Pattern: "Note created: \"Title\"" or "Note updated: \"Title\"" or "Note deleted: \"Title\""
  const match = note.match(/"([^"]+)"/);
  return match ? match[1] : null;
};

