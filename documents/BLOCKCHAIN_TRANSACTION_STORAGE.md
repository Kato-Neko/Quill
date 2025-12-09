# Blockchain Transaction Metadata Storage

## Overview

This document explains how blockchain transaction metadata from Cardano wallet operations is stored in the backend database. This provides a permanent, queryable record of all note operations (create, update, delete) that incur blockchain transaction fees.

## Architecture

### Frontend (React)
- **WalletContext**: Manages wallet connection and transaction recording
- **blockchainTransactionService**: API client for syncing transactions to backend
- **Auto-sync**: Transactions are automatically saved to backend when:
  - A new transaction is created (after blockchain confirmation)
  - Wallet connects (syncs all localStorage transactions)
  - Wallet reconnects (syncs existing transactions)

### Backend (Spring Boot + MySQL)
- **BlockchainTransaction Entity**: Database model for transaction metadata
- **BlockchainTransactionRepository**: JPA repository with custom queries
- **BlockchainTransactionService**: Business logic for transaction management
- **BlockchainTransactionController**: REST API endpoints

## Database Schema

### Table: `blockchain_transactions`

```sql
CREATE TABLE blockchain_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tx_hash VARCHAR(128) NOT NULL UNIQUE,        -- Cardano transaction hash
    operation_type VARCHAR(20) NOT NULL,          -- 'note_create', 'note_update', 'note_delete'
    note_id BIGINT,                               -- Foreign key to notes table
    wallet_address VARCHAR(255) NOT NULL,         -- User's Cardano wallet address
    amount DECIMAL(20, 6),                        -- Transaction amount in ADA
    fee DECIMAL(20, 6),                           -- Transaction fee in ADA
    network VARCHAR(20),                          -- 'preview', 'preprod', 'mainnet'
    status VARCHAR(20) NOT NULL,                  -- 'pending', 'confirmed', 'failed'
    metadata TEXT,                                -- JSON blockchain metadata
    note_title VARCHAR(255),                      -- Title of the note (for reference)
    description TEXT,                             -- Human-readable description
    error_message TEXT,                           -- Error message if failed
    created_at TIMESTAMP NOT NULL,                -- When transaction was created
    updated_at TIMESTAMP NOT NULL,                -- Last update timestamp
    confirmed_at TIMESTAMP NULL,                  -- When transaction was confirmed
    
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL,
    INDEX idx_tx_hash (tx_hash),
    INDEX idx_wallet_address (wallet_address),
    INDEX idx_note_id (note_id),
    INDEX idx_operation_type (operation_type),
    INDEX idx_status (status)
);
```

## API Endpoints

### 1. Create Transaction
```http
POST /api/blockchain-transactions
Content-Type: application/json

{
  "txHash": "abc123...",
  "operationType": "note_create",
  "noteId": 42,
  "walletAddress": "addr1...",
  "amount": 0.18,
  "fee": 0.18,
  "network": "preview",
  "status": "confirmed",
  "metadata": "{...}",
  "noteTitle": "My Note",
  "description": "Note created: \"My Note\""
}
```

**Response**: `201 Created` with transaction object

### 2. Get Transactions (with filters)
```http
GET /api/blockchain-transactions?walletAddress=addr1...&operationType=note_create&page=0&size=20
```

**Response**: Page of transactions

### 3. Get Transaction by Hash
```http
GET /api/blockchain-transactions/hash/{txHash}
```

**Response**: Transaction object or `404 Not Found`

### 4. Get Transactions for a Note
```http
GET /api/blockchain-transactions/note/{noteId}?page=0&size=10
```

**Response**: Page of transactions for the specified note

### 5. Get Recent Transactions
```http
GET /api/blockchain-transactions/wallet/{walletAddress}/recent
```

**Response**: Last 10 transactions for the wallet

### 6. Update Transaction Status
```http
PATCH /api/blockchain-transactions/{id}/status?status=confirmed
```

**Response**: Updated transaction

### 7. Get Transaction Statistics
```http
GET /api/blockchain-transactions/stats?walletAddress=addr1...
```

**Response**:
```json
{
  "totalTransactions": 150,
  "noteCreateCount": 50,
  "noteUpdateCount": 80,
  "noteDeleteCount": 20
}
```

## Frontend Integration

### 1. WalletContext Changes

The `WalletContext` now automatically syncs transactions to backend:

```javascript
// In addTransaction function
if (newTransaction.txHash && newTransaction.status === 'confirmed') {
  saveTransactionToBackend(newTransaction).catch(err => {
    console.error('Failed to sync transaction to backend:', err);
    // Non-blocking - transaction still saved in localStorage
  });
}
```

### 2. Auto-Sync on Wallet Connect

When a wallet connects, all localStorage transactions are synced:

```javascript
// After successful wallet connection
syncTransactionsToBackend(filteredTransactions).catch(err => 
  console.error('Failed to sync transactions on connect:', err)
);
```

### 3. Blockchain Transaction Service

New service file: `frontend/src/services/blockchainTransactionService.js`

**Key Functions**:
- `saveTransactionToBackend(transactionData)` - Save single transaction
- `fetchTransactionsFromBackend(walletAddress, filters, page, size)` - Fetch with filters
- `fetchNoteTransactions(noteId, page, size)` - Get transactions for a note
- `fetchTransactionStats(walletAddress)` - Get statistics
- `syncTransactionsToBackend(transactions)` - Batch sync from localStorage

## Data Flow

### Create Note Operation

```
1. User saves note
   ↓
2. Note saved to backend DB (NoteController)
   ↓
3. Frontend calls recordNoteCreate()
   ↓
4. Blockchain transaction sent via Mesh SDK
   ↓
5. Transaction confirmed on Cardano
   ↓
6. addTransaction() adds to localStorage
   ↓
7. saveTransactionToBackend() saves to backend DB
   ↓
8. Transaction visible in ledger AND queryable via API
```

### Update/Delete Operations

Similar flow - each operation triggers:
1. Backend database update (note change)
2. Blockchain transaction (Cardano)
3. Frontend localStorage update
4. Backend transaction metadata storage

## Benefits

### 1. **Permanent Record**
- Transactions survive localStorage clearing
- Backup of transaction history
- Audit trail for compliance

### 2. **Cross-Device Access**
- Same wallet on different devices sees same transaction history
- Query transactions from any client

### 3. **Analytics & Reporting**
- Query total fees spent
- Track operations over time
- Identify usage patterns

### 4. **Data Integrity**
- Foreign key to notes table
- Blockchain hash verification
- Status tracking (pending → confirmed)

### 5. **Performance**
- Indexed queries for fast lookups
- Pagination support for large datasets
- Filter by wallet, note, operation type, network

## Usage Examples

### Get all transactions for a wallet

```javascript
import { fetchTransactionsFromBackend } from '@/services/blockchainTransactionService';

const transactions = await fetchTransactionsFromBackend(
  'addr1qy...', // wallet address
  { operationType: 'note_create', network: 'preview' }, // filters
  0, // page
  50 // size
);
```

### Get transaction history for a specific note

```javascript
import { fetchNoteTransactions } from '@/services/blockchainTransactionService';

const noteTransactions = await fetchNoteTransactions(42, 0, 10);
// Returns all blockchain transactions for note ID 42
```

### Get transaction statistics

```javascript
import { fetchTransactionStats } from '@/services/blockchainTransactionService';

const stats = await fetchTransactionStats('addr1qy...');
console.log(`Total transactions: ${stats.totalTransactions}`);
console.log(`Note creates: ${stats.noteCreateCount}`);
console.log(`Note updates: ${stats.noteUpdateCount}`);
console.log(`Note deletes: ${stats.noteDeleteCount}`);
```

## Error Handling

### Duplicate Transaction Prevention

The backend checks for duplicate `tx_hash` and returns `409 Conflict` if transaction already exists. The frontend handles this gracefully:

```javascript
if (response.status === 409) {
  console.log('Transaction already exists in database');
  return null; // Not an error
}
```

### Failed Backend Sync

If backend save fails, transaction is still recorded in localStorage:

```javascript
saveTransactionToBackend(newTransaction).catch(err => {
  console.error('Failed to sync transaction to backend:', err);
  // Non-blocking error - user experience not affected
});
```

### Missing Transactions

On wallet reconnect, all localStorage transactions are synced to ensure database is up-to-date.

## Migration Guide

### For Existing Users

1. **Database Schema**: Run the SQL script or let Hibernate create the table automatically
2. **No Frontend Changes Required**: Syncing happens automatically
3. **Existing localStorage Data**: Will be synced on next wallet connection

### Setup Steps

1. **Backend**:
   ```bash
   # The table will be created automatically by Hibernate
   # Or run the SQL script manually:
   mysql -u root -p quill_db < src/main/resources/db/migration/create_blockchain_transactions_table.sql
   ```

2. **Frontend**:
   ```bash
   # No additional dependencies needed
   # Service is automatically imported in WalletContext
   ```

3. **Testing**:
   - Connect wallet
   - Create/update/delete a note
   - Check database: `SELECT * FROM blockchain_transactions;`
   - Verify transaction appears in both localStorage AND database

## Future Enhancements

1. **Transaction Confirmation Polling**: Periodically check Cardano blockchain to update `confirmed_at`
2. **Transaction Recovery**: Fetch missing transactions from blockchain by wallet address
3. **Cost Analytics Dashboard**: Visualize spending over time
4. **Export Functionality**: Export transaction history to CSV/PDF
5. **Multi-Wallet Support**: Track transactions across multiple wallets
6. **Notification System**: Alert users when transactions are confirmed
7. **Transaction Tags**: Add custom tags for organization

## Security Considerations

1. **Wallet Address Privacy**: Wallet addresses are stored - consider privacy implications
2. **CORS Configuration**: Backend restricts access to localhost:5173
3. **Input Validation**: All inputs validated with Jakarta validation
4. **SQL Injection Prevention**: JPA/Hibernate parameterized queries
5. **Unique Constraint**: `tx_hash` must be unique - prevents duplicates

## Performance Considerations

1. **Indexes**: Key columns indexed for fast queries
2. **Pagination**: All list endpoints support pagination
3. **Async Sync**: Backend syncing is non-blocking
4. **Batch Operations**: Sync multiple transactions with delays
5. **Query Optimization**: Efficient JPA queries with proper joins

## Monitoring & Debugging

### Backend Logs

```bash
# Enable SQL logging in application.properties
spring.jpa.show-sql=true
logging.level.org.hibernate.SQL=DEBUG
```

### Frontend Console Logs

- `"Transaction saved to backend:"` - Successful save
- `"Transaction already exists in database:"` - Duplicate (OK)
- `"Failed to sync transaction to backend:"` - Error (check backend)

### Database Queries

```sql
-- Check recent transactions
SELECT * FROM blockchain_transactions 
ORDER BY created_at DESC LIMIT 10;

-- Count transactions by operation
SELECT operation_type, COUNT(*) 
FROM blockchain_transactions 
GROUP BY operation_type;

-- Find transactions for a wallet
SELECT * FROM blockchain_transactions 
WHERE wallet_address = 'addr1...' 
ORDER BY created_at DESC;

-- Calculate total fees
SELECT SUM(fee) as total_fees 
FROM blockchain_transactions 
WHERE status = 'confirmed';
```

## Conclusion

The blockchain transaction metadata storage system provides a robust, permanent record of all note operations that incur blockchain fees. It seamlessly integrates with the existing frontend localStorage system while adding backend persistence, analytics capabilities, and cross-device synchronization.


