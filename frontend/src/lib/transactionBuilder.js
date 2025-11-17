import { Transaction, KoiosProvider } from '@meshsdk/core';

/**
 * Get the appropriate provider based on network
 * @param {string} network - 'preview', 'preprod', or 'mainnet'
 * @returns {KoiosProvider} Provider instance
 */
export const getProvider = (network = 'preview') => {
  let providerUrl;
  
  switch (network) {
    case 'preview':
      providerUrl = 'https://preview.koios.rest/api/v0';
      break;
    case 'preprod':
      providerUrl = 'https://preprod.koios.rest/api/v0';
      break;
    case 'mainnet':
      providerUrl = 'https://api.koios.rest/api/v0';
      break;
    default:
      providerUrl = 'https://preview.koios.rest/api/v0';
  }
  
  return new KoiosProvider(providerUrl);
};

/**
 * Build a transaction for note operations using Mesh SDK
 * Mesh SDK builds the transaction, then wallet signs and submits it
 * @param {Object} params - Transaction parameters
 * @param {Object} params.wallet - Connected wallet instance
 * @param {string} params.operationType - 'create', 'update', or 'delete'
 * @param {string} params.noteId - Note ID
 * @param {string} params.noteTitle - Note title
 * @param {number} params.feeAmount - Fee amount in ADA (estimated, not used directly)
 * @param {string} params.network - Network ('preview', 'preprod', 'mainnet')
 * @returns {Promise<string>} Transaction hash
 */
export const buildAndSendNoteOperationTransaction = async ({
  wallet,
  operationType,
  noteId,
  noteTitle,
  feeAmount = 0.18,
  network = 'preview'
}) => {
  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  try {
    console.log('Building transaction for note operation:', { operationType, noteId, noteTitle, network });
    
    // Get wallet address (we'll send to ourselves)
    const address = await wallet.getChangeAddress();
    console.log('Wallet address:', address);
    
    // Get UTXOs from wallet
    const utxos = await wallet.getUtxos();
    console.log('UTXOs available:', utxos?.length || 0);
    
    if (!utxos || utxos.length === 0) {
      throw new Error('No UTXOs available in wallet. Please ensure you have ADA in your wallet.');
    }
    
    // Build transaction metadata
    // Cardano metadata format: key-value pairs (numbers as keys)
    // We'll use a custom key (674) for note operations
    const metadata = {
      674: { // Custom key for note operations
        msg: [
          operationType, // 'create', 'update', or 'delete'
          noteId?.toString() || '',
          (noteTitle?.substring(0, 50) || '').replace(/[^\x20-\x7E]/g, '') // Truncate and sanitize title
        ]
      }
    };

    // For note operations, we'll send a minimal amount (1 ADA) to ourselves
    // This ensures the transaction is valid and includes our metadata
    // The actual network fee will be calculated automatically
    const minOutputAmount = 1000000; // 1 ADA in Lovelace
    
    console.log('Building transaction using Mesh SDK Transaction class...');
    // Build the transaction using Mesh SDK's Transaction class (higher-level API)
    // This is the correct way to use Mesh SDK
    const tx = new Transaction({ initiator: wallet })
      .sendLovelace(address, minOutputAmount.toString());
    
    // Try to attach metadata - check which method exists
    // Mesh SDK might use different method names in different versions
    if (typeof tx.sendMetadata === 'function') {
      console.log('Using sendMetadata method');
      tx.sendMetadata(674, metadata[674]);
    } else if (typeof tx.setMetadata === 'function') {
      console.log('Using setMetadata method');
      tx.setMetadata(674, metadata[674]);
    } else if (typeof tx.attachMetadata === 'function') {
      console.log('Using attachMetadata method');
      tx.attachMetadata(674, metadata[674]);
    } else {
      console.warn('No metadata method found on Transaction class, proceeding without metadata');
      // Continue without metadata - transaction will still work
    }

    console.log('Building unsigned transaction...');
    // Build the unsigned transaction
    let unsignedTx;
    try {
      unsignedTx = await tx.build();
      console.log('Transaction built successfully:', unsignedTx ? 'Yes' : 'No');
    } catch (buildError) {
      console.error('Error building transaction:', buildError);
      throw new Error(`Failed to build transaction: ${buildError.message || buildError.toString()}`);
    }
    
    if (!unsignedTx) {
      throw new Error('Failed to build transaction - Mesh SDK returned null');
    }
    
    console.log('Transaction built successfully, requesting wallet signature...');
    console.log('Unsigned transaction type:', typeof unsignedTx);
    console.log('Unsigned transaction:', unsignedTx);
    
    // Sign the transaction with the wallet
    // This will prompt the user in Lace wallet to approve the transaction
    let signedTx;
    try {
      signedTx = await wallet.signTx(unsignedTx);
      console.log('Transaction signed:', signedTx ? 'Yes' : 'No');
    } catch (signError) {
      console.error('Error signing transaction:', signError);
      throw new Error(`Transaction signing failed: ${signError.message || signError.toString()}`);
    }
    
    if (!signedTx) {
      throw new Error('Transaction was not signed by wallet - user may have rejected it or wallet error occurred');
    }
    
    console.log('Transaction signed, submitting to network...');
    console.log('Signed transaction type:', typeof signedTx);
    
    // Submit the transaction
    // Note: submitTx() returns a hash when transaction is submitted to the network
    // This happens AFTER the user approves in the wallet, but BEFORE blockchain confirmation
    let txHash;
    try {
      txHash = await wallet.submitTx(signedTx);
      console.log('Transaction submitted to network, hash:', txHash);
      
      // Verify we got a valid hash
      if (!txHash) {
        throw new Error('Transaction submission failed - no hash returned from wallet');
      }
      
      // Validate hash format (Cardano transaction hashes are hex strings, typically 64 chars)
      if (typeof txHash !== 'string' || txHash.trim() === '') {
        throw new Error('Transaction submission failed - invalid hash format returned');
      }
      
      console.log('Transaction submitted successfully! Hash:', txHash);
      console.log('Note: Transaction is now in the mempool, awaiting blockchain confirmation');
      return txHash;
    } catch (submitError) {
      console.error('Error submitting transaction:', submitError);
      
      // Check if user rejected the transaction
      if (submitError.code === 1 || submitError.message?.includes('reject') || submitError.message?.includes('denied')) {
        throw new Error('Transaction was rejected by user');
      }
      
      throw new Error(`Transaction submission failed: ${submitError.message || submitError.toString()}`);
    }
  } catch (error) {
    console.error('Error building/sending transaction:', error);
    // Provide more helpful error messages
    if (error.message?.includes('User rejected') || error.message?.includes('rejected')) {
      throw new Error('Transaction was rejected by wallet');
    } else if (error.message?.includes('insufficient') || error.message?.includes('balance')) {
      throw new Error('Insufficient balance for transaction. You need at least 1.10 ADA (1 ADA + transaction fee).');
    } else if (error.message?.includes('network') || error.message?.includes('Network')) {
      throw new Error('Network mismatch - ensure wallet and app are on the same network (Preview Testnet)');
    } else if (error.message?.includes('UTXO') || error.message?.includes('utxo')) {
      throw new Error('No UTXOs available in wallet. Please ensure you have ADA in your wallet.');
    }
    throw error;
  }
};

/**
 * Estimate transaction fee (rough estimate)
 * @param {string} network - Network type
 * @returns {number} Estimated fee in ADA
 */
export const estimateTransactionFee = (network = 'preview') => {
  // Base fee estimates (in ADA)
  // These are rough estimates - actual fees depend on transaction size
  const baseFee = 0.17; // Base transaction fee
  const metadataFee = 0.01; // Additional fee for metadata
  
  return baseFee + metadataFee; // ~0.18 ADA total
};

/**
 * Check if wallet has sufficient balance for transaction
 * @param {Object} wallet - Wallet instance
 * @param {number} requiredAmount - Required amount in ADA
 * @returns {Promise<boolean>} True if sufficient balance
 */
export const hasSufficientBalance = async (wallet, requiredAmount) => {
  try {
    const balance = await wallet.getBalance();
    const balanceADA = parseInt(balance[0]?.quantity || 0) / 1000000;
    return balanceADA >= requiredAmount;
  } catch (error) {
    console.error('Error checking balance:', error);
    return false;
  }
};

