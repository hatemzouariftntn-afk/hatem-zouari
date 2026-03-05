import { NextRequest, NextResponse } from 'next/server'
import { mongoDB } from '@/lib/mongodb-db'

export async function GET() {
  try {
    const backups = await mongoDB.getBackups()
    return NextResponse.json(backups)
  } catch (error) {
    console.error('Error fetching backups:', error)
    return NextResponse.json({ error: 'Failed to fetch backups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json()
    await mongoDB.createBackup(type || 'full')
    return NextResponse.json({ message: 'Backup created successfully' })
  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 })
  }
}
