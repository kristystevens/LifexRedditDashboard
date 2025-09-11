import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const ACCOUNTS_FILE = join(process.cwd(), 'data', 'reddit-accounts.json')

interface RedditAccount {
  id: string
  username: string
  email?: string
  passwordHash: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  notes?: string
}

// POST - Reveal password for a Reddit account (for editing purposes)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    
    // Return a message indicating the password is encrypted and cannot be retrieved
    // In a real application, you might want to implement a secure password recovery system
    return NextResponse.json({
      success: true,
      data: {
        message: 'Password is encrypted and cannot be retrieved. You can set a new password by editing the account.',
        canSetNewPassword: true
      }
    })
  } catch (error) {
    console.error('Error revealing password:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reveal password' },
      { status: 500 }
    )
  }
}
