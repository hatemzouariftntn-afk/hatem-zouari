import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()
  let dbStatus = 'disconnected'

  try {
    const db = await getDatabase()
    await db.command({ ping: 1 })
    dbStatus = 'connected'
  } catch (error: any) {
    dbStatus = `error: ${error.message}`
  }

  const durationMs = Date.now() - startTime

  return NextResponse.json({
    status: 'ok',
    message: 'Server is alive',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    responseTimeMs: durationMs,
  }, { status: 200 })
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
