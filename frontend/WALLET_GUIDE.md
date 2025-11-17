# Cardano Wallet Integration Guide

## Building Transactions

This app uses **Mesh SDK** to build and send Cardano transactions. The transaction building functionality is available in the `WalletContext`.

### Basic Usage

```javascript
import { useWallet } from '../contexts/WalletContext';

function MyComponent() {
  const { sendTransaction, wallet, isViewOnly } = useWallet();

  const handleSend = async () => {
    if (!wallet || isViewOnly) {
      alert('Please connect a wallet');
      return;
    }

    try {
      const txHash = await sendTransaction(
        'addr1...', // recipient address
        10.5        // amount in ADA
      );
      console.log('Transaction hash:', txHash);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };
}
```

### Transaction Building Process

1. **Initialize Transaction Builder**: Uses `MeshTxBuilder` from `@meshsdk/core`
2. **Build Transaction**: Creates a transaction with recipient and amount
3. **Sign Transaction**: Wallet extension signs the transaction
4. **Submit Transaction**: Transaction is submitted to the Cardano network

## Testnet Faucets

To get test ADA (tADA) for testing transactions, use the Cardano Testnet Faucets:

### Preview Testnet Faucet
- **URL**: https://docs.cardano.org/cardano-testnet/tools/faucet
- **Network**: Preview Testnet
- **Use Case**: Latest features and testing

### Preprod Testnet Faucet
- **URL**: https://docs.cardano.org/cardano-testnet/tools/faucet
- **Network**: Preprod Testnet
- **Use Case**: Production-like environment testing

### How to Use Faucets

1. **Switch your wallet to testnet**:
   - In Lace: Settings → Network → Preview or Preprod
   - In Eternl: Settings → Network → Preview or Preprod
   - In Nami: Settings → Network → Preview or Preprod

2. **Get your testnet address**:
   - Connect your wallet to the app
   - Copy your address (starts with `addr_test1...`)

3. **Request test ADA**:
   - Go to the faucet website
   - Select the network (Preview or Preprod)
   - Enter your testnet address
   - Complete the captcha
   - Click "Request funds"

4. **Wait for confirmation**:
   - Test ADA usually arrives within a few seconds
   - Check your wallet balance

## Network Configuration

The app supports three networks:

- **Preview**: Testnet with latest features
- **Preprod**: Production-like testnet
- **Mainnet**: Real Cardano network (use real ADA)

Switch networks using the `setNetwork` function:

```javascript
const { setNetwork, network } = useWallet();

// Switch to preview testnet
setNetwork('preview');

// Switch to mainnet
setNetwork('mainnet');
```

## Important Notes

⚠️ **Always use testnet for development!**

- Never use mainnet with real ADA during development
- Test all transactions on testnet first
- Mainnet transactions are permanent and irreversible

## Transaction Fees

Cardano transactions include:
- **Base fee**: ~0.17 ADA (fixed)
- **Per-byte fee**: ~0.000044 ADA per byte
- **Total**: Usually 0.17-0.20 ADA for simple transactions

The transaction builder automatically calculates and includes fees.

## Example: Complete Send Transaction Flow

```javascript
import { useWallet } from '../contexts/WalletContext';

function SendExample() {
  const { 
    wallet, 
    address, 
    balance, 
    sendTransaction, 
    isSending,
    network,
    setNetwork 
  } = useWallet();

  const send = async () => {
    // 1. Make sure we're on testnet
    setNetwork('preview');
    
    // 2. Wait a moment for network switch
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Send transaction
    try {
      const txHash = await sendTransaction(
        'addr_test1q...', // recipient
        5.0                // amount in ADA
      );
      console.log('Success!', txHash);
    } catch (error) {
      console.error('Failed:', error);
    }
  };

  return (
    <div>
      <p>Network: {network}</p>
      <p>Balance: {balance} ADA</p>
      <button onClick={send} disabled={isSending}>
        {isSending ? 'Sending...' : 'Send 5 ADA'}
      </button>
    </div>
  );
}
```

## Troubleshooting

### "Transaction failed: Insufficient funds"
- Make sure you have enough ADA for the amount + fees
- Check that you're on the correct network
- Request more test ADA from the faucet

### "Please connect a wallet"
- Make sure your wallet extension is installed
- Connect your wallet in the app
- Ensure you're not in view-only mode

### Transaction not appearing
- Check the transaction hash on a Cardano explorer
- Verify you're on the correct network
- Wait a few minutes for confirmation

## Resources

- [Mesh SDK Documentation](https://meshjs.dev/)
- [Cardano Testnet Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet)
- [Cardano Developer Portal](https://developers.cardano.org/)

