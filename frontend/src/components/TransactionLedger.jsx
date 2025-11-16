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
import { ArrowUpRight, ArrowDownLeft, FileText, Calendar, Search, ExternalLink, Plus, Save, X, Info } from "lucide-react"
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
  const { address, transactions, balance } = useWallet()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [feeDialogOpen, setFeeDialogOpen] = useState(false)

  // Don't show if wallet is not connected
  if (!address) {
    return null
  }

  const feeInfo = {
    note_create: {
      operation: "Create Note",
      fee: "0.10 ADA",
      description: "A transaction fee is charged each time you create a new note. This fee covers the blockchain transaction costs for storing your note data."
    },
    note_update: {
      operation: "Update Note",
      fee: "0.17 ADA",
      description: "Each time you save changes to an existing note, a transaction fee is charged. This includes auto-saves that occur after 5 seconds of inactivity."
    },
    note_delete: {
      operation: "Delete Note",
      fee: "0.12 ADA",
      description: "When you delete a note, a transaction fee is charged to process the deletion on the blockchain."
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
    return parseFloat(amount).toFixed(6)
  }


  const totalReceived = useMemo(() => {
    return filteredTransactions
      .filter(tx => tx.type === 'received')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
  }, [filteredTransactions])

  const totalSent = useMemo(() => {
    return filteredTransactions
      .filter(tx => tx.type === 'sent')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
  }, [filteredTransactions])

  // Use actual wallet balance (real blockchain balance) instead of calculating from transactions
  // Transactions are just a record of activity, but the balance is the actual wallet state
  const netBalance = balance ? parseFloat(balance) : (totalReceived - totalSent)

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2">Transaction Ledger</h2>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Recorded Received</div>
              <div className="text-lg font-bold text-green-600">+{formatAmount(totalReceived)} ADA</div>
              <div className="text-[10px] text-muted-foreground mt-1">From recorded transactions</div>
            </CardContent>
          </Card>
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
                              {isOutgoing ? '-' : '+'}{formatAmount(transaction.amount)} ADA
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
                        {transaction.txHash && (
                          <a
                            href={`https://cardanoscan.io/transaction/${transaction.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View on Cardanoscan
                          </a>
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

