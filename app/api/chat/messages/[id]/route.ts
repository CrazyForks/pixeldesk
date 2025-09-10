import { NextRequest, NextResponse } from 'next/server'
import { MessageManager } from '@/lib/messageManager'
import { ApiResponse, ChatMessage } from '@/types/chat'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messageId = params.id
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID required' 
      } as ApiResponse<null>, { status: 400 })
    }

    const deletedMessage = await MessageManager.deleteMessage(messageId, userId)

    return NextResponse.json({ 
      success: true, 
      data: deletedMessage 
    } as ApiResponse<ChatMessage>)

  } catch (error) {
    console.error('Error deleting message:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const statusCode = message.includes('not found') ? 404 : 
                      message.includes('only delete your own') ? 403 : 500
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    } as ApiResponse<null>, { status: statusCode })
  }
}