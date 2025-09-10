import { NextRequest, NextResponse } from 'next/server'
import { MessageManager } from '@/lib/messageManager'
import { ApiResponse, MessagesResponse, SendMessageRequest, ChatMessage } from '@/types/chat'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const cursor = searchParams.get('cursor')
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID required' 
      } as ApiResponse<null>, { status: 400 })
    }

    // Use MessageManager to get messages
    const result = await MessageManager.getMessages(conversationId, userId, {
      limit,
      cursor: cursor || undefined
    })

    const response: MessagesResponse = {
      messages: result.messages,
      totalCount: result.totalCount,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor
    }

    return NextResponse.json({ 
      success: true, 
      data: response 
    } as ApiResponse<MessagesResponse>)

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    } as ApiResponse<null>, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const body: SendMessageRequest = await request.json()
    const { content, type = 'text' } = body
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID required' 
      } as ApiResponse<null>, { status: 400 })
    }

    // Use MessageManager to create message
    const message = await MessageManager.createMessage(
      conversationId,
      userId,
      content,
      type
    )

    return NextResponse.json({ 
      success: true, 
      data: message 
    } as ApiResponse<ChatMessage>, { status: 201 })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    } as ApiResponse<null>, { status: 500 })
  }
}