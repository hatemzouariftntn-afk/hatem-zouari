import { MongoClient, Db, Collection, Document as MongoDocument } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local')
}

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof global & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise

// Database helper functions
export async function getDatabase(): Promise<Db> {
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
