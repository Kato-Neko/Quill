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
import { ArrowUpRight, ArrowDownLeft, FileText, Calendar, Tag, Search, ExternalLink, Edit, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog"

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
  const { transactions, deleteTransaction, updateTransaction } = useWallet()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState(null)
  const [editingTransaction, setEditingTransaction] = useState(null)

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
        tx.amount.toString().includes(query)
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

  const getCategoryColor = (category) => {
    const colors = {
      'Income': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Expense': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Transfer': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Payment': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Refund': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    }
    return colors[category] || colors['Other']
  }

  const handleDelete = (transaction) => {
    setTransactionToDelete(transaction)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete.id)
      setDeleteDialogOpen(false)
      setTransactionToDelete(null)
    }
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Transaction Ledger</h2>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Received</div>
              <div className="text-2xl font-bold text-green-600">+{formatAmount(totalReceived)} ADA</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Sent</div>
              <div className="text-2xl font-bold text-red-600">-{formatAmount(totalSent)} ADA</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Net Balance</div>
              <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netBalance >= 0 ? '+' : ''}{formatAmount(netBalance)} ADA
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
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
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No transactions found</h3>
          <p className="text-muted-foreground">
            {transactions.length === 0 
              ? "Start recording transactions to see them here."
              : "Try adjusting your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => {
            const isOutgoing = transaction.type === 'sent'
            const isIncoming = transaction.type === 'received'

            return (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {isOutgoing ? (
                          <ArrowUpRight className="h-5 w-5 text-red-500" />
                        ) : isIncoming ? (
                          <ArrowDownLeft className="h-5 w-5 text-green-500" />
                        ) : (
                          <FileText className="h-5 w-5 text-gray-500" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">
                              {isOutgoing ? '-' : '+'}{formatAmount(transaction.amount)} ADA
                            </h3>
                            {transaction.status && (
                              <Badge variant={transaction.status === 'confirmed' ? 'default' : 'secondary'}>
                                {transaction.status}
                              </Badge>
                            )}
                            {transaction.linkedNoteId && (
                              <Link to={`/note/${transaction.linkedNoteId}`}>
                                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                                  View Note
                                </Badge>
                              </Link>
                            )}
                          </div>
                          {transaction.recipientAddress && (
                            <p className="text-sm text-muted-foreground font-mono">
                              To: {transaction.recipientAddress.slice(0, 30)}...
                            </p>
                          )}
                          {transaction.senderAddress && (
                            <p className="text-sm text-muted-foreground font-mono">
                              From: {transaction.senderAddress.slice(0, 30)}...
                            </p>
                          )}
                        </div>
                      </div>

                      {transaction.note && (
                        <p className="text-sm text-foreground mb-2">
                          {transaction.note}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        {transaction.category && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            <Badge className={getCategoryColor(transaction.category)}>
                              {transaction.category}
                            </Badge>
                          </div>
                        )}
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

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(transaction)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

