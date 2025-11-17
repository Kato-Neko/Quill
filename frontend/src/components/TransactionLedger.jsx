import { useState, useMemo } from "react"
import { useWallet } from "../contexts/WalletContext"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { ArrowUpRight, ArrowDownLeft, FileText, Calendar, Search, ExternalLink, Plus, Save, X, Info, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"

const TRANSACTION_CATEGORIES = [
  "All",
  "Income",
  "Expense",
  "Transfer",
  "Payment",
  "Refund",
  "Other"
]

export default function TransactionLedger() {
  const { address, transactions, balance, refreshBalance, network, setNetwork, deleteTransaction } = useWallet()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [feeDialogOpen, setFeeDialogOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Don't show if wallet is not connected
  if (!address) {
    return null
  }

  const feeInfo = {
    note_create: {
      operation: "Create Note",
      fee: "0.10 ADA",
      description: "A real blockchain transaction is sent each time you create a new note. This fee covers the Cardano network transaction costs and includes metadata about your note operation."
    },
    note_update: {
      operation: "Update Note",
      fee: "0.17 ADA",
      description: "Each time you save changes to an existing note, a real blockchain transaction is sent. This includes auto-saves that occur after 5 seconds of inactivity. The transaction includes metadata about the update."
    },
    note_delete: {
      operation: "Delete Note",
      fee: "0.12 ADA",
      description: "When you delete a note, a real blockchain transaction is sent to record the deletion on the Cardano blockchain. The transaction includes metadata about the deleted note."
    }
  }

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(tx => tx.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(tx => 
        tx.note?.toLowerCase().includes(query) ||
        tx.recipientAddress?.toLowerCase().includes(query) ||
        tx.senderAddress?.toLowerCase().includes(query) ||
        tx.txHash?.toLowerCase().includes(query) ||
        tx.amount.toString().includes(query) ||
        tx.operation?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [transactions, searchQuery, selectedCategory])

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) {
      return 'Fee pending'
    }
    return parseFloat(amount).toFixed(6)
  }


  const totalSent = useMemo(() => {
    return filteredTransactions
      .filter(tx => tx.type === 'sent' && tx.status !== 'failed' && tx.amount !== null && tx.amount !== undefined)
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
  }, [filteredTransactions])

  // Use actual wallet balance (real blockchain balance) instead of calculating from transactions
  // Transactions are just a record of activity, but the balance is the actual wallet state
  const netBalance = balance ? parseFloat(balance) : 0

  const getCardanoscanTxUrl = (txHash, txNetwork) => {
    if (!txHash) return null
    const resolvedNetwork = txNetwork || network
    switch (resolvedNetwork) {
      case "preview":
        return `https://preview.cardanoscan.io/transaction/${txHash}`
      case "preprod":
        return `https://preprod.cardanoscan.io/transaction/${txHash}`
      default:
        return `https://cardanoscan.io/transaction/${txHash}`
    }
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Transaction Ledger</h2>
          <div className="flex items-center gap-2">
            <Select value={network} onValueChange={setNetwork}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preview">Preview Testnet</SelectItem>
                <SelectItem value="preprod">Preprod Testnet</SelectItem>
                <SelectItem value="mainnet">Mainnet</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setIsRefreshing(true);
                try {
                  await refreshBalance();
                } catch (error) {
                  console.error('Failed to refresh balance:', error);
                } finally {
                  setIsRefreshing(false);
                }
              }}
              disabled={isRefreshing}
              className="h-8"
              title="Refresh balance"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          All transactions are automatically recorded when you create, update, or delete notes. Each operation incurs a fee.{" "}
          <button
            onClick={() => setFeeDialogOpen(true)}
            className="text-primary hover:underline inline-flex ml-1 items-center gap-1"
          >
            Learn more
            <Info className="h-3 w-3" />
          </button>
        </p>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Recorded Sent</div>
              <div className="text-lg font-bold text-red-600">-{formatAmount(totalSent)} ADA</div>
              <div className="text-[10px] text-muted-foreground mt-1">From recorded transactions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Wallet Balance</div>
              <div className={`text-lg font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netBalance >= 0 ? '+' : ''}{formatAmount(netBalance)} ADA
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">Total ADA in wallet</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[160px] h-9">
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
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-medium mb-1">No transactions found</h3>
          <p className="text-sm text-muted-foreground">
            {transactions.length === 0 
              ? "Transactions are automatically recorded when you create, update, or delete notes."
              : "Try adjusting your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((transaction) => {
            const isOutgoing = transaction.type === 'sent'
            const isIncoming = transaction.type === 'received'

            return (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isOutgoing ? (
                          <ArrowUpRight className="h-4 w-4 text-red-500" />
                        ) : isIncoming ? (
                          <ArrowDownLeft className="h-4 w-4 text-green-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-gray-500" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-base">
                              {transaction.amount === null || transaction.amount === undefined ? (
                                <span className="text-xs text-muted-foreground">Fee pending…</span>
                              ) : (
                                <>
                                  {isOutgoing ? '-' : '+'}{formatAmount(transaction.amount)} ADA
                                </>
                              )}
                            </h3>
                            {transaction.operation && (
                              <Badge variant="outline" className="text-xs">
                                {transaction.operation === 'note_create' && <Plus className="h-3 w-3 mr-1" />}
                                {transaction.operation === 'note_update' && <Save className="h-3 w-3 mr-1" />}
                                {transaction.operation === 'note_delete' && <X className="h-3 w-3 mr-1" />}
                                {transaction.operation.replace('note_', '')}
                              </Badge>
                            )}
                          </div>
                          {transaction.recipientAddress && (
                            <p className="text-xs text-muted-foreground font-mono">
                              To: {transaction.recipientAddress.slice(0, 30)}...
                            </p>
                          )}
                          {transaction.senderAddress && (
                            <p className="text-xs text-muted-foreground font-mono">
                              From: {transaction.senderAddress.slice(0, 30)}...
                            </p>
                          )}
                        </div>
                      </div>

                      {transaction.note && (
                        <p className="text-xs text-foreground mb-1">
                          {transaction.note}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(transaction.date || transaction.createdAt)}
                        </div>
                        {transaction.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                              Pending
                            </Badge>
                            <button
                              onClick={() => deleteTransaction(transaction.id)}
                              className="text-xs text-yellow-600 hover:text-yellow-700 hover:underline"
                              title="Remove pending transaction"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                        {transaction.status === 'failed' && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-500/20">
                              Failed
                            </Badge>
                            <button
                              onClick={() => deleteTransaction(transaction.id)}
                              className="text-xs text-red-500 hover:text-red-700 hover:underline"
                              title="Remove failed transaction"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                        {transaction.status === 'confirmed' && transaction.txHash && (
                          (() => {
                            const url = getCardanoscanTxUrl(transaction.txHash, transaction.network)
                            if (!url) return null
                            return (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View on Cardanoscan
                              </a>
                            )
                          })()
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Fee Information Dialog */}
      <Dialog open={feeDialogOpen} onOpenChange={setFeeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Fees</DialogTitle>
            <DialogDescription>
              Transparent fee structure for all note operations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {Object.entries(feeInfo).map(([key, info]) => (
              <div key={key} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {key === 'note_create' && <Plus className="h-4 w-4 text-muted-foreground" />}
                    {key === 'note_update' && <Save className="h-4 w-4 text-muted-foreground" />}
                    {key === 'note_delete' && <X className="h-4 w-4 text-muted-foreground" />}
                    <h3 className="font-semibold text-sm">{info.operation}</h3>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {info.fee}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {info.description}
                </p>
              </div>
            ))}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> All fees are automatically recorded in your transaction ledger. 
                These fees are standard Cardano network transaction costs required to process operations on the blockchain.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

