import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import bcrypt from 'bcryptjs'

const ACCOUNTS_FILE = join(process.cwd(), 'data', 'reddit-accounts.json')

interface RedditAccount {
  id: string
  username: string
  passwordHash: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  notes?: string
}

// GET - Fetch a specific Reddit account
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    if (!existsSync(ACCOUNTS_FILE)) {
      return NextResponse.json(
        { success: false, error: 'No accounts found' },
        { status: 404 }
      )
    }
    
    const data = JSON.parse(readFileSync(ACCOUNTS_FILE, 'utf8'))
    const account = data.accounts.find((acc: RedditAccount) => acc.id === id)
    
    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }
    
    // Return account without password hash
    const { passwordHash: _, ...safeAccount } = account
    
    return NextResponse.json({
      success: true,
      data: safeAccount
    })
  } catch (error) {
    console.error('Error fetching Reddit account:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch account' },
      { status: 500 }
    )
  }
}

// PUT - Update a Reddit account
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { username, password, notes, isActive } = await request.json()
    
    if (!existsSync(ACCOUNTS_FILE)) {
      return NextResponse.json(
        { success: false, error: 'No accounts found' },
        { status: 404 }
      )
    }
    
    const data = JSON.parse(readFileSync(ACCOUNTS_FILE, 'utf8'))
    const accountIndex = data.accounts.findIndex((acc: RedditAccount) => acc.id === id)
    
    if (accountIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }
    
    const account = data.accounts[accountIndex]
    
    // Check if username is being changed and if it already exists
    if (username && username !== account.username) {
      const existingAccount = data.accounts.find((acc: RedditAccount) => 
        acc.id !== id && acc.username.toLowerCase() === username.toLowerCase()
      )
      
      if (existingAccount) {
        return NextResponse.json(
          { success: false, error: 'Username already exists' },
          { status: 400 }
        )
      }
    }
    
    // Update account fields
    if (username) account.username = username
    if (password) {
      const saltRounds = 12
      account.passwordHash = await bcrypt.hash(password, saltRounds)
    }
    if (notes !== undefined) account.notes = notes
    if (isActive !== undefined) account.isActive = isActive
    
    account.updatedAt = new Date().toISOString()
    
    data.accounts[accountIndex] = account
    data.lastUpdated = new Date().toISOString()
    
    writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2), 'utf8')
    
    // Return updated account without password hash
    const { passwordHash: _, ...safeAccount } = account
    
    return NextResponse.json({
      success: true,
      data: safeAccount
    })
  } catch (error) {
    console.error('Error updating Reddit account:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update account' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a Reddit account
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    if (!existsSync(ACCOUNTS_FILE)) {
      return NextResponse.json(
        { success: false, error: 'No accounts found' },
        { status: 404 }
      )
    }
    
    const data = JSON.parse(readFileSync(ACCOUNTS_FILE, 'utf8'))
    const accountIndex = data.accounts.findIndex((acc: RedditAccount) => acc.id === id)
    
    if (accountIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }
    
    // Remove the account
    data.accounts.splice(accountIndex, 1)
    data.lastUpdated = new Date().toISOString()
    
    writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2), 'utf8')
    
    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting Reddit account:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
