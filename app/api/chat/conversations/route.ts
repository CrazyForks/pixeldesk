import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ConversationManager } from '@/lib/conversationManager'
import { ApiResponse, ConversationsResponse, CreateConversationRequest, ChatConversation } from '@/types/chat'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID required' 
      } as ApiResponse<null>, { status: 400 })
    }

    // Get user's conversations with participants and last message
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: userId,
            isActive: true
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          where: {
            isActive: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Transform to response format and calculate unread counts
    const transformedConversations: ChatConversation[] = await Promise.all(
      conversations.map(async (conv) => {
        // Get unread count for this user
        const userParticipant = conv.participants.find(p => p.userId === userId)
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            createdAt: {
              gt: userParticipant?.lastReadAt || new Date(0)
            },
            senderId: {
              not: userId
            }
          }
        })

        return {
          id: conv.id,
          type: conv.type as 'private' | 'group',
          name: conv.name || undefined,
          participants: conv.participants.map(p => ({
            id: p.id,
            userId: p.userId,
            userName: p.user.name,
            userAvatar: p.user.avatar || undefined,
            joinedAt: p.joinedAt.toISOString(),
            lastReadAt: p.lastReadAt.toISOString(),
            isActive: p.isActive
          })),
          lastMessage: conv.messages[0] ? {
            id: conv.messages[0].id,
            conversationId: conv.messages[0].conversationId,
            senderId: conv.messages[0].senderId,
            senderName: conv.messages[0].sender.name,
            senderAvatar: conv.messages[0].sender.avatar || undefined,
            content: conv.messages[0].content,
            type: conv.messages[0].type as any,
            status: conv.messages[0].status as any,
            createdAt: conv.messages[0].createdAt.toISOString(),
            updatedAt: conv.messages[0].updatedAt.toISOString()
          } : undefined,
          unreadCount,
          createdAt: conv.createdAt.toISOString(),
          updatedAt: conv.updatedAt.toISOString()
        }
      })
    )

    const response: ConversationsResponse = {
      conversations: transformedConversations,
      totalCount: transformedConversations.length
    }

    return NextResponse.json({ 
      success: true, 
      data: response 
    } as ApiResponse<ConversationsResponse>)

  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    } as ApiResponse<null>, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateConversationRequest = await request.json()
    const { participantIds, type = 'private', name } = body
    
    if (!participantIds || participantIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Participant IDs required' 
      } as ApiResponse<null>, { status: 400 })
    }

    // Use ConversationManager to create conversation
    const conversation = await ConversationManager.createConversation(
      participantIds,
      type,
      name
    )

    return NextResponse.json({ 
      success: true, 
      data: conversation 
    } as ApiResponse<ChatConversation>, { status: 201 })

  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    } as ApiResponse<null>, { status: 500 })
  }
}