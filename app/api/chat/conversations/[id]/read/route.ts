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
    const { messageId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID required' 
      } as ApiResponse<null>, { status: 400 })
    }

    await ConversationManager.markMessagesAsRead(
      conversationId,
      userId,
      messageId
    )

    return NextResponse.json({ 
      success: true, 
      data: { marked: true } 
    } as ApiResponse<{ marked: boolean }>)

  } catch (error) {
    console.error('Error marking messages as read:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message.includes('not a participant') ? 403 : 500
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    } as ApiResponse<null>, { status })
  }
}