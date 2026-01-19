
import { NextResponse } from 'next/server'
import { LevelingService } from '@/lib/services/leveling'

export async function POST(request: Request) {
    try {
        const { userId, level } = await request.json()

        if (!userId || level === undefined) {
            return NextResponse.json({ error: 'UserId and level are required' }, { status: 400 })
        }

        const result = await LevelingService.markLevelAsNotified(userId, level)

        if (result) {
            return NextResponse.json({ success: true })
        } else {
            return NextResponse.json({ success: false, error: 'Failed to update notification status' }, { status: 500 })
        }
    } catch (error) {
        console.error('Error in level notify API:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
