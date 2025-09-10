import { NextRequest, NextResponse } from 'next/server'
import { MessageManager } from '@/lib/messageManager'
import { ApiResponse, ChatMessage } from '@/types/chat'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const conversationId = searchParams.get('conversationId')
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID required' 
      } as ApiResponse<null>, { status: 400 })
    }

    if (!conversationId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Conversation ID required' 
      } as ApiResponse<null>, { status: 400 })
    }

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Search query required' 
      } as ApiResponse<null>, { status: 400 })
    }

    const messages = await MessageManager.searchMessages(
      conversationId,
      userId,
      query.trim(),
      limit
    )

    return NextResponse.json({ 
      success: true, 
      data: { messages, totalCount: messages.length } 
    } as ApiResponse<{ messages: ChatMessage[], totalCount: number }>)

  } catch (error) {
    console.error('Error searching messages:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const statusCode = message.includes('not a participant') ? 403 : 500
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    } as ApiResponse<null>, { status: statusCode })
  }
}