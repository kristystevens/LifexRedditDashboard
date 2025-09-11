'use client'

import { useState, useEffect } from 'react'
import { Plus, Eye, EyeOff, Edit, Trash2, Save, X, CheckCircle, XCircle } from 'lucide-react'
import Navigation from '@/components/layout/navigation'

interface RedditAccount {
  id: string
  username: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  notes?: string
}

interface AccountFormData {
  username: string
  password: string
  notes: string
}

export default function RedditAccountsPage() {
  const [accounts, setAccounts] = useState<RedditAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<string | null>(null)
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState<AccountFormData>({
    username: '',
    password: '',
    notes: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Fetch accounts on component mount
  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reddit-accounts')
      const data = await response.json()
      
      if (data.success) {
        setAccounts(data.data.accounts)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch accounts')
      }
    } catch (err) {
      setError('Failed to fetch accounts')
      console.error('Error fetching accounts:', err)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required'
    }
    
    if (!editingAccount && !formData.password.trim()) {
      errors.password = 'Password is required'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      const url = editingAccount 
        ? `/api/reddit-accounts/${editingAccount}`
        : '/api/reddit-accounts'
      
      const method = editingAccount ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchAccounts()
        resetForm()
        setError(null)
      } else {
        setError(data.error || 'Failed to save account')
      }
    } catch (err) {
      setError('Failed to save account')
      console.error('Error saving account:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      return
    }
    
    try {
      const response = await fetch(`/api/reddit-accounts/${id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchAccounts()
        setError(null)
      } else {
        setError(data.error || 'Failed to delete account')
      }
    } catch (err) {
      setError('Failed to delete account')
      console.error('Error deleting account:', err)
    }
  }

  const handleEdit = (account: RedditAccount) => {
    setEditingAccount(account.id)
    setFormData({
      username: account.username,
      password: '',
      notes: account.notes || ''
    })
    setFormErrors({})
  }

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      notes: ''
    })
    setFormErrors({})
    setShowAddForm(false)
    setEditingAccount(null)
  }

  const togglePasswordVisibility = (accountId: string) => {
    const newVisible = new Set(visiblePasswords)
    if (newVisible.has(accountId)) {
      newVisible.delete(accountId)
    } else {
      newVisible.add(accountId)
    }
    setVisiblePasswords(newVisible)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading accounts...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="lg:pl-64">
        <main className="pt-2 pb-6">
          <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reddit Accounts</h1>
          <p className="text-gray-600">Manage your Reddit account credentials securely</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Add Account Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Reddit Account
          </button>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingAccount) && (
          <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">
              {editingAccount ? 'Edit Account' : 'Add New Account'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter Reddit username"
                />
                {formErrors.username && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingAccount && <span className="text-gray-500">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={editingAccount ? "Enter new password (optional)" : "Enter Reddit password"}
                />
                {formErrors.password && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Add any notes about this account..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingAccount ? 'Update Account' : 'Add Account'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Accounts List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Your Reddit Accounts</h2>
            <p className="text-gray-600 text-sm mt-1">
              {accounts.length} account{accounts.length !== 1 ? 's' : ''} stored
            </p>
          </div>

          {accounts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <p className="text-lg font-medium mb-2">No Reddit accounts yet</p>
              <p className="text-sm">Add your first Reddit account to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {accounts.map((account) => (
                <div key={account.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          u/{account.username}
                        </h3>
                        <div className="flex items-center gap-2">
                          {account.isActive ? (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                              <XCircle className="w-3 h-3" />
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {account.notes && (
                        <p className="text-gray-600 text-sm mb-2">{account.notes}</p>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        Created: {formatDate(account.createdAt)}
                        {account.updatedAt !== account.createdAt && (
                          <span className="ml-4">Updated: {formatDate(account.updatedAt)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => togglePasswordVisibility(account.id)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title={visiblePasswords.has(account.id) ? 'Hide password' : 'Show password'}
                      >
                        {visiblePasswords.has(account.id) ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleEdit(account)}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit account"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {visiblePasswords.has(account.id) && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Password:</strong> [Hidden for security - use edit to change]
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
          </div>
        </main>
      </div>
    </div>
  )
}
