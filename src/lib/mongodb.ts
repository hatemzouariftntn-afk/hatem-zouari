import { MongoClient, Db, Collection, Document as MongoDocument } from 'mongodb'

const uri = process.env.MONGODB_URI || ''
const options = {}

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

if (!uri) {
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    console.warn('⚠️ MONGODB_URI is missing. Database features will be unavailable.')
  }
} else {
  if (process.env.NODE_ENV === 'development') {
    let globalWithMongo = global as typeof global & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromise = globalWithMongo._mongoClientPromise
  } else {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }
}

export async function getDatabase(): Promise<Db> {
  if (!clientPromise) {
    throw new Error('MONGODB_URI is not defined')
  }
  const client = await clientPromise
  return client.db(process.env.MONGODB_DB || 'document-archiver')
}

export async function getCollection<T extends MongoDocument>(name: string): Promise<Collection<T>> {
  const db = await getDatabase()
  return db.collection<T>(name)
}

// Types for MongoDB documents
export interface UserDocument {
  _id?: any
  email: string
  name: string
  password: string
  role: 'user' | 'admin'
  createdAt: Date
  updatedAt: Date
}

export interface DocumentDocument {
  _id?: any
  title: string
  content: string
  tags: string[] | null
  category: string
  userId: string
  createdAt: Date
  updatedAt: Date
  mimeType?: string | null
  originalFileName?: string | null
}

export interface CategoryDocument {
  _id?: any
  name: string
  userId?: string | null
  createdAt: Date
}

export interface BackupDocument {
  _id?: any
  userId: string
  data: any
  backupType: 'full' | 'incremental'
  createdAt: Date
  size: number
}
