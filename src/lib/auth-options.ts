import type { NextAuthOptions } from 'next-auth'
import { MongoDBAdapter } from '@next-auth/mongodb-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { MongoClient } from 'mongodb'
import { z } from 'zod'

const mongoUri = process.env.MONGODB_URI;
const client = mongoUri ? new MongoClient(mongoUri) : null;
const clientPromise = client ? client.connect() : Promise.resolve(null as any);

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'البريد الإلكتروني', type: 'email' },
        password: { label: 'كلمة المرور', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('🔐 Auth attempt for email:', credentials?.email)
          const { email, password } = credentialsSchema.parse(credentials)

          const client = await clientPromise
          if (!client) {
            console.error('❌ MongoDB client not initialized in Auth')
            return null
          }

          const db = client.db(process.env.MONGODB_DB || 'document-archiver')
          console.log('📡 Checking user in database...')
          
          const user = await db.collection('users').findOne({ email })

          if (!user) {
            console.log('👤 User not found, checking if registration is allowed...')
            const newUser = {
              email,
              password: Buffer.from(password).toString('base64'),
              name: email.split('@')[0],
              createdAt: new Date(),
              role: 'user',
            }

            const result = await db.collection('users').insertOne(newUser)
            console.log('👤 New user created with ID:', result.insertedId)

            return {
              id: result.insertedId.toString(),
              email: newUser.email,
              name: newUser.name,
              role: newUser.role,
            } as any
          }

          const storedPassword = Buffer.from(user.password, 'base64').toString()
          if (storedPassword === password) {
            console.log('✅ User authenticated successfully:', user.email)

            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              role: user.role,
            } as any
          }

          console.warn('⚠️ Invalid password for user:', email)
          return null
        } catch (error: any) {
          console.error('❌ Auth error detail:', error.message)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        ; (token as any).id = (user as any).id
          ; (token as any).role = (user as any).role
        console.log('🔐 JWT callback - user:', user)
        console.log('🔐 JWT callback - token after update:', token)
      }
      return token
    },
    async session({ session, token }) {
      console.log('🔐 Session callback - token:', token)
      console.log('🔐 Session callback - session before:', session)

      const id = (token as any)?.id
      if (id) {
        ; (session.user as any).id = id
          ; (session.user as any).role = (token as any)?.role
        console.log('🔐 Session callback - session after:', session)
      }

      return session
    },
  },
}
