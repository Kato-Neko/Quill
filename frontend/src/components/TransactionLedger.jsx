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
      description: "A real blockchain transaction is sent each time you create a new note. This fee covers the Cardano network transaction costs and includes metadata about your note operation."
    },
    note_update: {
      operation: "Update Note",
      description: "Each time you save changes to an existing note, a real blockchain transaction is sent. This includes auto-saves that occur after 5 seconds of inactivity. The transaction includes metadata about the update."
    },
    note_delete: {
      operation: "Delete Note",
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
        (tx.amount !== null && tx.amount !== undefined && tx.amount.toString().includes(query)) ||
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

  const formatDateMinimal = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${month} ${day} ${year} ${hours}:${minutes}`
  }

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) {
      return 'Fee pending'
    }
    return parseFloat(amount).toFixed(6)
  }

  const cleanNoteText = (note) => {
    if (!note) return null
    // Remove redundant prefixes like "Note created:", "Note updated:", "Note deleted:", "Created note:", "Updated note:"
    return note
      .replace(/^(Note\s+(created|updated|deleted):\s*)/i, '')
      .replace(/^((Created|Updated|Deleted)\s+note:\s*)/i, '')
      .trim()
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
      <div className="mb-3">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <div>
            <h2 className="text-xl font-bold mb-1">Transaction Ledger</h2>
            <p className="text-xs text-muted-foreground">
              All transactions are automatically recorded when you create, update, or delete notes.{" "}
              <button
                onClick={() => setFeeDialogOpen(true)}
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Learn more
                <Info className="h-3 w-3" />
              </button>
            </p>
          </div>
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
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
          <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="p-2.5">
              <div className="text-xs text-muted-foreground mb-0.5">Recorded Sent</div>
              <div className="text-lg font-semibold">
                -{formatAmount(totalSent)} <span className="text-sm font-normal text-muted-foreground">ADA</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">From recorded transactions</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="p-2.5">
              <div className="text-xs text-muted-foreground mb-0.5">Wallet Balance</div>
              <div className="text-lg font-semibold">
                {netBalance >= 0 ? '+' : ''}{formatAmount(netBalance)} <span className="text-sm font-normal text-muted-foreground">ADA</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Total ADA in wallet</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
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
        <Card className="border-dashed">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {transactions.length === 0 
                  ? "Transactions are automatically recorded when you create, update, or delete notes. Your transaction history will appear here."
                  : "No transactions match your current filters. Try adjusting your search or category filter."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5 group/list">
          {filteredTransactions.map((transaction) => {
            const isOutgoing = transaction.type === 'sent'
            const isIncoming = transaction.type === 'received'
            const hasAmount = transaction.amount !== null && transaction.amount !== undefined
            const txUrl = transaction.txHash ? getCardanoscanTxUrl(transaction.txHash, transaction.network) : null

            return (
              <Card 
                key={transaction.id} 
                className="group/item transition-all duration-300 relative hover:z-20 group/list:hover:blur-sm group-hover/item:blur-none group-hover/item:scale-[1.03] group-hover/item:shadow-xl"
              >
                <CardContent className="px-10 py-2">
                  <div className="grid grid-cols-1 md:grid-cols-[auto_auto_1fr_auto] gap-2 md:gap-3 items-center">
                    {/* Column 1: Transaction Hash (as link) */}
                    <div className="min-w-[100px] order-1 md:order-1">
                      {transaction.txHash ? (
                        txUrl ? (
                          <a
                            href={txUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-foreground hover:text-primary hover:underline break-all inline-block"
                          >
                            {transaction.txHash.slice(0, 16)}...
                          </a>
                        ) : (
                          <span className="text-xs font-mono text-muted-foreground break-all">
                            {transaction.txHash.slice(0, 16)}...
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">No hash</span>
                      )}
                    </div>

                    {/* Column 2: Method/Action Badge */}
                    <div className="flex-shrink-0 order-2 md:order-2 mx-2 md:mx-3 min-w-[90px]">
                      {transaction.operation ? (
                        <Badge 
                          variant="outline" 
                          className={`text-xs font-normal px-10 py-1.5 border-2 whitespace-nowrap ${
                            transaction.operation === 'note_create' 
                              ? 'border-green-500 text-green-700 dark:text-green-400 dark:border-green-400 bg-green-50 dark:bg-green-950/20' 
                              : transaction.operation === 'note_update'
                              ? 'border-blue-500 text-blue-700 dark:text-blue-400 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/20'
                              : 'border-red-500 text-red-700 dark:text-red-400 dark:border-red-400 bg-red-50 dark:bg-red-950/20'
                          }`}
                        >
                          {transaction.operation === 'note_create' && <Plus className="h-3.5 w-3.5 mr-1" />}
                          {transaction.operation === 'note_update' && <Save className="h-3.5 w-3.5 mr-1" />}
                          {transaction.operation === 'note_delete' && <X className="h-3.5 w-3.5 mr-1" />}
                          {transaction.operation.replace('note_', '')}
                        </Badge>
                      ) : transaction.status === 'pending' ? (
                        <Badge variant="outline" className="text-xs font-normal px-10 py-1.5 whitespace-nowrap">
                          Pending
                        </Badge>
                      ) : transaction.status === 'failed' ? (
                        <Badge variant="outline" className="text-xs font-normal px-10 py-1.5 whitespace-nowrap">
                          Failed
                        </Badge>
                      ) : null}
                    </div>

                    {/* Column 3: Note Information (Middle) */}
                    <div className="min-w-0 order-4 md:order-3">
                      {transaction.note ? (
                        <p className="text-sm text-foreground line-clamp-1">
                          {cleanNoteText(transaction.note)}
                        </p>
                      ) : (
                        <span className="text-xs text-muted-foreground">No note</span>
                      )}
                      {transaction.status === 'pending' && (
                        <button
                          onClick={() => deleteTransaction(transaction.id)}
                          className="text-xs text-muted-foreground hover:underline mt-0.5 block"
                          title="Remove pending transaction"
                        >
                          Remove
                        </button>
                      )}
                      {transaction.status === 'failed' && (
                        <button
                          onClick={() => deleteTransaction(transaction.id)}
                          className="text-xs text-muted-foreground hover:underline mt-0.5 block"
                          title="Remove failed transaction"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Column 4: Amount (top) and Date/Time (bottom) - Right side */}
                    <div className="flex-shrink-0 text-right min-w-[160px] order-3 md:order-4">
                      <div className="mb-0.5">
                        {!hasAmount ? (
                          <span className="text-sm text-muted-foreground">Fee pending…</span>
                        ) : (
                          <div className="text-xl font-semibold">
                            {isOutgoing ? '-' : '+'}{formatAmount(transaction.amount)} <span className="text-sm font-normal text-muted-foreground">ADA</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-light leading-tight tracking-tight">
                        {formatDateMinimal(transaction.date || transaction.createdAt)}
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
              How transaction fees work for note operations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {Object.entries(feeInfo).map(([key, info]) => (
              <div key={key} className="border rounded-lg p-4">
                <div className="flex items-start mb-2">
                  <div className="flex items-center gap-2">
                    {key === 'note_create' && <Plus className="h-4 w-4 text-muted-foreground" />}
                    {key === 'note_update' && <Save className="h-4 w-4 text-muted-foreground" />}
                    {key === 'note_delete' && <X className="h-4 w-4 text-muted-foreground" />}
                    <h3 className="font-semibold text-sm">{info.operation}</h3>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {info.description}
                </p>
              </div>
            ))}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Transaction fees are determined by the Cardano network and vary based on network conditions. 
                Fees are automatically fetched from the blockchain and recorded in your transaction ledger once the transaction is confirmed. 
                While fees are pending, transactions will show "Fee pending..." in the ledger.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

