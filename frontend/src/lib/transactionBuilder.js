import { Transaction, BlockfrostProvider } from '@meshsdk/core';

/**
 * Get the appropriate provider based on network
 * @param {string} network - 'preview', 'preprod', or 'mainnet'
 * @returns {BlockfrostProvider} Provider instance
 */
export const getProvider = (network = 'preview') => {
  // IMPORTANT: Replace with your actual Blockfrost Project ID from https://blockfrost.io/
  const blockfrostProjectId = 'YOUR_BLOCKFROST_PROJECT_ID';
  
  if (blockfrostProjectId === 'YOUR_BLOCKFROST_PROJECT_ID') {
    console.error('Please replace YOUR_BLOCKFROST_PROJECT_ID in `getProvider` with your actual Blockfrost Project ID.');
  }

  return new BlockfrostProvider(blockfrostProjectId, network);
};

// HELPER FUNCTION: FORMAT CONTENT
// PURPOSE: CARDANO METADATA STRINGS CANNOT EXCEED 64 BYTES.
// THIS FUNCTION SPLITS THE TEXT INTO CHUNKS OF 64 CHARACTERS.
const formatContent = (content) => {
  if (!content) {
    return [];
  }
  // REGEX SPLITS THE STRING EVERY 64 CHARACTERS
  return content.match(/.{1,64}/g) || [];
};


/**
 * Build a transaction for note operations using Mesh SDK
 * Mesh SDK builds the transaction, then wallet signs and submits it
 * @param {Object} params - Transaction parameters
 * @param {Object} params.wallet - Connected wallet instance
 * @param {string} params.operationType - 'create', 'update', or 'delete'
 * @param {string} params.noteId - Note ID
 * @param {string} params.noteTitle - Note title
 * @param {string} params.noteContent - Note content
 * @param {number} params.feeAmount - Fee amount in ADA (estimated, not used directly)
 * @param {string} params.network - Network ('preview', 'preprod', 'mainnet')
 * @returns {Promise<string>} Transaction hash
 */
export const buildAndSendNoteOperationTransaction = async ({
  wallet,
  operationType,
  noteId,
  noteTitle,
  noteContent,
  noteCategory = 'Uncategorized',
  isPinned = false,
  isStarred = false,
  isArchived = false,
  isDeleted = false,
  timeCreated,
  timeUpdated,
  feeAmount = 0.18,
  network = 'preview'
}) => {
  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  try {
    console.log('Building transaction for note operation:', {
      operationType,
      noteId,
      noteTitle,
      noteCategory,
      isPinned,
      isStarred,
      isArchived,
      isDeleted,
      timeCreated,
      timeUpdated,
      network,
    });
    
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
    // We'll use CIP-20 friendly label 674 for human-readable data
    // and label 1337 for structured app data
    const sanitizeText = (value, maxLength = 64) => {
      if (!value) return '';
      return value.toString().substring(0, maxLength).replace(/[^\x20-\x7E]/g, '');
    };

    const operationTimestamp = new Date().toISOString();
    const createdTimestamp = timeCreated || operationTimestamp;
    const updatedTimestamp = timeUpdated || operationTimestamp;
    const sanitizedTitle = sanitizeText(noteTitle || 'Untitled Note', 50);
    const contentChunks = formatContent(noteContent);
    const metadataLabel = 42819;

    const noteMetadata = {
      [metadataLabel]: {
        map: [
          { k: { string: 'action' }, v: { string: operationType } },
          { k: { string: 'noteId' }, v: { string: noteId?.toString() || '' } },
          { k: { string: 'title' }, v: { string: sanitizedTitle } },
          { k: { string: 'content' }, v: { list: contentChunks.map(c => ({ string: c })) } },
          { k: { string: 'created_at' }, v: { string: createdTimestamp } },
          { k: { string: 'updated_at' }, v: { string: updatedTimestamp } },
          { k: { string: 'app' }, v: { string: 'Quill' } }
        ]
      }
    };

    const metadata = noteMetadata;

    console.log('Transaction metadata prepared:', JSON.stringify(metadata, null, 2));

    // For note operations, we'll send a minimal amount (1 ADA) to ourselves
    // This ensures the transaction is valid and includes our metadata
    // The actual network fee will be calculated automatically
    const minOutputAmount = 1000000; // 1 ADA in Lovelace
    
    console.log('Building transaction using Mesh SDK Transaction class...');
    // Build the transaction using Mesh SDK's Transaction class (higher-level API)
    // This is the correct way to use Mesh SDK
    const tx = new Transaction({ initiator: wallet })
      .sendLovelace(address, minOutputAmount.toString());
    
    // Attach metadata (both labels) if supported by SDK version
    let metadataAttached = false;
    try {
      const txMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(tx));
      console.log('Available transaction metadata methods:', txMethods.filter(m => m.toLowerCase().includes('metadata')));

      const attachWithMethod = (methodName) => {
        tx[methodName](metadataLabel, metadata[metadataLabel]);
        metadataAttached = true;
        console.log(`Metadata attached via ${methodName}`);
      };

      if (typeof tx.sendMetadata === 'function') {
        attachWithMethod('sendMetadata');
      } else if (typeof tx.setMetadata === 'function') {
        attachWithMethod('setMetadata');
      } else if (typeof tx.attachMetadata === 'function') {
        attachWithMethod('attachMetadata');
      } else if (tx.metadata !== undefined) {
        tx.metadata = metadata;
        metadataAttached = true;
        console.log('Metadata set directly on transaction object');
      } else if (tx.txBuilder && typeof tx.txBuilder.attachMetadata === 'function') {
        tx.txBuilder.attachMetadata(metadataLabel, metadata[metadataLabel]);
        metadataAttached = true;
        console.log('Metadata attached via txBuilder.attachMetadata');
      } else {
        console.warn('No metadata method found on Transaction class. Transaction will proceed without metadata.');
      }

      if (metadataAttached) {
        console.log('Metadata labels attached:', Object.keys(metadata));
      }
    } catch (metadataError) {
      console.error('Error attaching metadata:', metadataError);
      console.warn('Continuing without metadata.');
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
    const SIGNING_TIMEOUT = 120000; // 2 minutes to prevent premature timeout

    try {
      // Wrap signing in a Promise with a manual timeout.
      // This prevents the 'TxSignError' from appearing too quickly.
      signedTx = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Transaction signing timed out after 2 minutes. Please try again.'));
        }, SIGNING_TIMEOUT);

        wallet.signTx(unsignedTx, false) // Use partial sign `false`
          .then(signed => {
            clearTimeout(timeoutId);
            resolve(signed);
          })
          .catch(err => {
            clearTimeout(timeoutId);
            // Forward the original error from the wallet (e.g., user rejection)
            reject(err);
          });
      });
      console.log('Transaction signed:', signedTx ? 'Yes' : 'No');
    } catch (signError) {
      console.error('Error signing transaction:', signError);
      // Make error message more user-friendly
      if (signError.message?.includes('timed out')) {
        throw new Error('Transaction signing timed out. Please try again.');
      }
      // Re-throw the original error (like TxSignError for user rejection)
      throw signError;
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
