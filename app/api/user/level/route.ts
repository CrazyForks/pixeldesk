
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { LevelingService } from '@/lib/services/leveling'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'UserId is required' }, { status: 400 })
        }

        const progress = await LevelingService.getUserLevelProgress(userId)

        if (!progress) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: progress })
    } catch (error) {
        console.error('Error fetching user level:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
