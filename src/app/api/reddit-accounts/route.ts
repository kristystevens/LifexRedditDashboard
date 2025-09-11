import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const ACCOUNTS_FILE = join(process.cwd(), 'data', 'reddit-accounts.json')

interface RedditAccount {
  id: string
  username: string
  email?: string
  password: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  notes?: string
}

// Initialize accounts file if it doesn't exist
function initializeAccountsFile() {
  if (!existsSync(ACCOUNTS_FILE)) {
    const initialData = {
      accounts: [],
      lastUpdated: new Date().toISOString()
    }
    writeFileSync(ACCOUNTS_FILE, JSON.stringify(initialData, null, 2), 'utf8')
  }
}

// GET - Fetch all Reddit accounts
export async function GET() {
  try {
    initializeAccountsFile()
    
    const data = JSON.parse(readFileSync(ACCOUNTS_FILE, 'utf8'))
    
    // Return all accounts with passwords visible
    const safeAccounts = data.accounts
    
    return NextResponse.json({
      success: true,
      data: {
        accounts: safeAccounts,
        lastUpdated: data.lastUpdated
      }
    })
  } catch (error) {
    console.error('Error fetching Reddit accounts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}

// POST - Create a new Reddit account
export async function POST(request: NextRequest) {
  try {
    const { username, email, password, notes } = await request.json()
    
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      )
    }
    
    initializeAccountsFile()
    
    const data = JSON.parse(readFileSync(ACCOUNTS_FILE, 'utf8'))
    
    // Check if username already exists
    const existingAccount = data.accounts.find((acc: RedditAccount) => 
      acc.username.toLowerCase() === username.toLowerCase()
    )
    
    if (existingAccount) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 400 }
      )
    }
    
    const newAccount: RedditAccount = {
      id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username,
      email: email || undefined,
      password,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      notes: notes || ''
    }
    
    data.accounts.push(newAccount)
    data.lastUpdated = new Date().toISOString()
    
    writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2), 'utf8')
    
    return NextResponse.json({
      success: true,
      data: newAccount
    })
  } catch (error) {
    console.error('Error creating Reddit account:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
