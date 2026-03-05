import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

export async function GET() {
    try {
        const collection = await getCollection('categories')
        const categories = await collection.find({}).sort({ createdAt: -1 }).toArray()
        return NextResponse.json(categories)
    } catch (error) {
        console.error('Failed to fetch categories:', error)
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const collection = await getCollection('categories')

        const newCategory = {
            ...body,
            createdAt: new Date(),
        }

        const result = await collection.insertOne(newCategory)
        return NextResponse.json({ ...newCategory, _id: result.insertedId })
    } catch (error) {
        console.error('Failed to create category:', error)
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }
}
