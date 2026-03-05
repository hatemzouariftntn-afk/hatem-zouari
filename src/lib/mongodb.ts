import { MongoClient, Db, Collection, Document as MongoDocument, ObjectId } from 'mongodb'

const options = {}

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

export async function getDatabase(): Promise<Db> {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not defined')
  }

  if (!clientPromise) {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }

  const connectedClient = await clientPromise
  return connectedClient.db(process.env.MONGODB_DB || 'document-archiver')
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
