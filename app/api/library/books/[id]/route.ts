import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getBasicUserFromRequest } from '@/lib/serverAuth'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const book = await prisma.libraryBook.findUnique({
            where: { id: params.id }
        })

        if (!book) {
            return NextResponse.json(
                { success: false, error: 'Book not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true, data: book })
    } catch (error) {
        console.error('Error fetching book:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch book' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getBasicUserFromRequest(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { title, author, description, coverUrl, content, bookcaseId } = body

        const updatedBook = await prisma.libraryBook.update({
            where: { id: params.id },
            data: {
                title,
                author,
                description,
                coverUrl,
                content,
                bookcaseId
            }
        })

        return NextResponse.json({ success: true, data: updatedBook })
    } catch (error) {
        console.error('Error updating book:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update book' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getBasicUserFromRequest(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await prisma.libraryBook.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting book:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete book' },
            { status: 500 }
        )
    }
}
