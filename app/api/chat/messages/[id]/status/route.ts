import { NextRequest, NextResponse } from 'next/server'
import { MessageManager } from '@/lib/messageManager'
import { ApiResponse, ChatMessage } from '@/types/chat'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messageId = params.id
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const { status } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID required' 
      } as ApiResponse<null>, { status: 400 })
    }

    if (!status || !['sent', 'delivered', 'read'].includes(status)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid status required (sent, delivered, read)' 
      } as ApiResponse<null>, { status: 400 })
    }

    const updatedMessage = await MessageManager.updateMessageStatus(
      messageId,
      status,
      userId
    )

    return NextResponse.json({ 
      success: true, 
      data: updatedMessage 
    } as ApiResponse<ChatMessage>)

  } catch (error) {
    console.error('Error updating message status:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const statusCode = message.includes('not found') || message.includes('access denied') ? 404 : 500
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    } as ApiResponse<null>, { status: statusCode })
  }
}