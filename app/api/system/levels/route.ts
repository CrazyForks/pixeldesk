
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
    try {
        const levels = await (prisma as any).level_definitions.findMany({
            orderBy: { level: 'asc' }
        })

        return NextResponse.json({ success: true, data: levels })
    } catch (error) {
        console.error('Error fetching system levels:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
