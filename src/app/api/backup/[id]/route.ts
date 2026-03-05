import { NextRequest, NextResponse } from 'next/server'
import { mongoDB } from '@/lib/mongodb-db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await mongoDB.restoreBackup(params.id)
    return NextResponse.json({ message: 'Backup restored successfully' })
  } catch (error) {
    console.error('Error restoring backup:', error)
    return NextResponse.json({ error: 'Failed to restore backup' }, { status: 500 })
  }
}
