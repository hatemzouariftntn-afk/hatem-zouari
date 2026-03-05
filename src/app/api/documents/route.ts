import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

export async function GET() {
    try {
        const collection = await getCollection('documents')
        const documents = await collection.find({}).sort({ createdAt: -1 }).toArray()
        return NextResponse.json(documents)
    } catch (error) {
        console.error('Failed to fetch documents:', error)
        return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const collection = await getCollection('documents')

        const newDocument = {
            ...body,
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        const result = await collection.insertOne(newDocument)
        return NextResponse.json({ ...newDocument, _id: result.insertedId })
    } catch (error) {
        console.error('Failed to create document:', error)
        return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
    }
}
