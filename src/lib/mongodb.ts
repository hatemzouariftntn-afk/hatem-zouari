import { MongoClient, Db, Collection, Document as MongoDocument, ObjectId } from 'mongodb'
export type { MongoDocument }

const options = {}

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

export async function getDatabase(): Promise<Db> {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in environment variables')
    throw new Error('MONGODB_URI is not defined')
  }

  try {
    if (!clientPromise) {
      console.log('📡 Attempting to connect to MongoDB...')
      client = new MongoClient(uri, {
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000,
      })
      clientPromise = client.connect()
    }

    const connectedClient = await clientPromise
    console.log('✅ MongoDB connected successfully')
    return connectedClient.db(process.env.MONGODB_DB || 'document-archiver')
  } catch (error: any) {
    console.error('❌ MongoDB Connection Error:', error.message)
    // Reset promise to allow retry on next request
    clientPromise = null
    client = null
    throw error
  }
}

export async function getCollection<T extends MongoDocument>(name: string): Promise<Collection<T>> {
  const db = await getDatabase()
  return db.collection<T>(name)
}

// Interfaces for MongoDB documents
export interface UserDocument extends MongoDocument {
  _id?: ObjectId
  email: string
  password: string
  name: string
  role: string
  createdAt: Date
}

export interface DocumentDocument extends MongoDocument {
  _id?: ObjectId
  title: string
  content: string
  tags: string[] | null
  category: string
  userId: string
  createdAt: Date
  updatedAt: Date
  mimeType: string | null
  originalFileName: string | null
  // Workflow Management
  deadline: Date | null
  linkedDocumentIds: string[] | null
  status: 'pending' | 'in_progress' | 'done' | null
}

export interface CategoryDocument extends MongoDocument {
  _id?: ObjectId
  name: string
  userId: string | null
  createdAt: Date
}

export interface BackupDocument extends MongoDocument {
  _id?: ObjectId
  userId: string
  data: any
  backupType: 'full' | 'incremental'
  createdAt: Date
  size: number
}

// Export the client promise for NextAuth adapter
export default (async () => {
  const uri = process.env.MONGODB_URI
  if (!uri) return null as any
  if (!clientPromise) {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }
  return clientPromise
})()
