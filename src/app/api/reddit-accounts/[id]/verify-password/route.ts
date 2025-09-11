import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
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

// POST - Verify password for a Reddit account
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { password } = await request.json()
    
    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      )
    }
    
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
    
    // Verify the password
    const isValid = await bcrypt.compare(password, account.passwordHash)
    
    return NextResponse.json({
      success: true,
      data: {
        isValid,
        message: isValid ? 'Password is correct' : 'Password is incorrect'
      }
    })
  } catch (error) {
    console.error('Error verifying password:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify password' },
      { status: 500 }
    )
  }
}
