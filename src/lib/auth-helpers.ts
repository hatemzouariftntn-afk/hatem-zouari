import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions)
    console.log('🔑 Session from auth-helpers:', session)
    const userId = (session as any)?.user?.id || null
    console.log('👤 User ID from auth-helpers:', userId)
    return userId
  } catch (error) {
    console.error('❌ Error getting session from auth-helpers:', error)
    return null
  }
}
