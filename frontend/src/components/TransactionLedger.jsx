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
import { ArrowUpRight, ArrowDownLeft, FileText, Calendar, Search, ExternalLink, Plus, Save, X } from "lucide-react"

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
  const { address, transactions } = useWallet()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  // Don't show if wallet is not connected
  if (!address) {
    return null
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

  const netBalance = totalReceived - totalSent

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2">Transaction Ledger</h2>
        <p className="text-xs text-muted-foreground mb-4">
          All transactions are automatically recorded when you create, update, or delete notes. Each operation incurs a fee.
        </p>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Total Received</div>
              <div className="text-lg font-bold text-green-600">+{formatAmount(totalReceived)} ADA</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Total Sent</div>
              <div className="text-lg font-bold text-red-600">-{formatAmount(totalSent)} ADA</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Net Balance</div>
              <div className={`text-lg font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netBalance >= 0 ? '+' : ''}{formatAmount(netBalance)} ADA
              </div>
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
    </div>
  )
}

