import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Send, ExternalLink, ArrowUpRight, ArrowDownLeft, FileText } from 'lucide-react';

const TRANSACTION_CATEGORIES = [
  "Income",
  "Expense",
  "Transfer",
  "Payment",
  "Refund",
  "Other"
];

export default function SendTransaction() {
  const { 
    wallet, 
    address, 
    balance, 
    isSending, 
    isViewOnly,
    network,
    sendTransaction,
    setNetwork,
    addTransaction
  } = useWallet();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState('sent'); // 'sent', 'received', 'record'
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Payment');
  const [note, setNote] = useState('');
  const [sendOnChain, setSendOnChain] = useState(false);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (transactionType === 'sent' && sendOnChain) {
      if (!recipientAddress.trim()) {
        alert('Please enter a recipient address');
        return;
      }
      if (parseFloat(amount) > parseFloat(balance)) {
        alert('Insufficient balance');
        return;
      }
    }

    if ((transactionType === 'sent' || transactionType === 'received') && !recipientAddress.trim()) {
      alert('Please enter an address');
      return;
    }

    try {
      let txHash = null;

      // If sending on-chain, execute the transaction
      if (sendOnChain && transactionType === 'sent' && wallet) {
        try {
          txHash = await sendTransaction(recipientAddress.trim(), amount, note, category);
        } catch (error) {
          // Transaction failed, but we'll still record it
          console.error('On-chain transaction failed:', error);
        }
      } else {
        // Just record the transaction
        addTransaction({
          type: transactionType,
          amount,
          recipientAddress: transactionType === 'sent' ? recipientAddress.trim() : null,
          senderAddress: transactionType === 'received' ? recipientAddress.trim() : address,
          category,
          note,
          txHash,
          status: txHash ? 'pending' : 'recorded',
        });
      }

      setDialogOpen(false);
      setRecipientAddress('');
      setAmount('');
      setCategory('Payment');
      setNote('');
      setSendOnChain(false);
      setTransactionType('sent');
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  if (!address || isViewOnly) {
    return null; // Don't show send button for view-only or disconnected wallets
  }

  return (
    <>
      <Button 
        onClick={() => setDialogOpen(true)} 
        variant="outline"
        disabled={isSending}
      >
        <Send className="mr-2" size={18} />
        Record Transaction
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Transaction</DialogTitle>
            <DialogDescription>
              Record transactions in your ledger. 
              <br />
              <strong>Sent:</strong> Money you sent to someone (you can optionally send on-chain)
              <br />
              <strong>Received:</strong> Money you received (automatically creates an editable note)
              <br />
              <strong>Record Only:</strong> Just document a transaction without addresses
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Transaction Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Transaction Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={transactionType === 'sent' ? 'default' : 'outline'}
                  onClick={() => setTransactionType('sent')}
                  className="flex items-center gap-2"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Sent
                </Button>
                <Button
                  type="button"
                  variant={transactionType === 'received' ? 'default' : 'outline'}
                  onClick={() => setTransactionType('received')}
                  className="flex items-center gap-2"
                >
                  <ArrowDownLeft className="h-4 w-4" />
                  Received
                </Button>
                <Button
                  type="button"
                  variant={transactionType === 'record' ? 'default' : 'outline'}
                  onClick={() => setTransactionType('record')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Record Only
                </Button>
              </div>
            </div>
            {/* Network Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Network
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={network === 'preview' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNetwork('preview')}
                >
                  Preview (Testnet)
                </Button>
                <Button
                  type="button"
                  variant={network === 'preprod' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNetwork('preprod')}
                >
                  Preprod (Testnet)
                </Button>
                <Button
                  type="button"
                  variant={network === 'mainnet' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNetwork('mainnet')}
                >
                  Mainnet
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Current network: <strong>{network}</strong>
              </p>
            </div>

            {/* Address */}
            {(transactionType === 'sent' || transactionType === 'received') && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {transactionType === 'sent' ? 'Recipient Address' : 'Sender Address'}
                  {transactionType === 'sent' && sendOnChain && ' *'}
                </label>
                <Input
                  placeholder="addr1..."
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                />
              </div>
            )}

            {/* Send On-Chain (only for sent transactions) */}
            {transactionType === 'sent' && wallet && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sendOnChain"
                  checked={sendOnChain}
                  onChange={(e) => setSendOnChain(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="sendOnChain" className="text-sm">
                  Send on-chain transaction (requires wallet connection)
                </label>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Note */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Note
              </label>
              <Textarea
                placeholder="Add a note about this transaction..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
              />
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Amount (ADA)
              </label>
              <Input
                type="number"
                step="0.000001"
                min="0"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available: {balance} ADA
              </p>
            </div>

            {/* Faucet Link for Testnet */}
            {(network === 'preview' || network === 'preprod') && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                  <strong>Need test ADA?</strong>
                </p>
                <a
                  href="https://docs.cardano.org/cardano-testnet/tools/faucet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  Get test ADA from Cardano Faucet
                  <ExternalLink size={14} />
                </a>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDialogOpen(false);
              setRecipientAddress('');
              setAmount('');
              setCategory('Payment');
              setNote('');
              setSendOnChain(false);
              setTransactionType('sent');
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSending}>
              {isSending ? 'Sending...' : 'Save Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

