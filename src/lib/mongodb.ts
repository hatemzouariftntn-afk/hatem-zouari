import { MongoClient, Db, Collection, Document as MongoDocument } from 'mongodb'

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

// نسمح بتصدير الـ promise للاستخدام في NextAuth
export default (async () => {
  const uri = process.env.MONGODB_URI
  if (!uri) return null as any
  if (!clientPromise) {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }
  return clientPromise
})()
