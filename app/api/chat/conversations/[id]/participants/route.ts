import { NextRequest, NextResponse } from 'next/server'
import { ConversationManager } from '@/lib/conversationManager'
import { ApiResponse } from '@/types/chat'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const { userIds } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID required' 
      } as ApiResponse<null>, { status: 400 })
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'User IDs array required' 
      } as ApiResponse<null>, { status: 400 })
    }

    const newParticipants = await ConversationManager.addParticipants(
      conversationId,
      userIds,
      userId
    )

    return NextResponse.json({ 
      success: true, 
      data: newParticipants 
    } as ApiResponse<typeof newParticipants>, { status: 201 })

  } catch (error) {
    console.error('Error adding participants:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message.includes('not authorized') ? 403 : 500
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    } as ApiResponse<null>, { status })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const targetUserId = searchParams.get('targetUserId') || userId
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID required' 
      } as ApiResponse<null>, { status: 400 })
    }

    const removed = await ConversationManager.removeParticipant(
      conversationId,
      targetUserId!,
      userId
    )

    if (removed) {
      return NextResponse.json({ 
        success: true, 
        data: { removed: true } 
      } as ApiResponse<{ removed: boolean }>)
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Participant not found or already removed' 
      } as ApiResponse<null>, { status: 404 })
    }

  } catch (error) {
    console.error('Error removing participant:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message.includes('not authorized') ? 403 : 500
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    } as ApiResponse<null>, { status })
  }
}