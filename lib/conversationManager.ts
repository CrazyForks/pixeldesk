import { prisma } from '@/lib/db'
import { ChatConversation, ConversationParticipant } from '@/types/chat'

export class ConversationManager {
  /**
   * Create a new conversation with participants
   */
  static async createConversation(
    participantIds: string[],
    type: 'private' | 'group' = 'private',
    name?: string
  ): Promise<ChatConversation> {
    // For private conversations, check if one already exists
    if (type === 'private' && participantIds.length === 2) {
      const existing = await this.findExistingPrivateConversation(participantIds)
      if (existing) {
        return existing
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        type,
        name,
        participants: {
          create: participantIds.map(userId => ({
            userId,
            joinedAt: new Date(),
            lastReadAt: new Date(),
            isActive: true
          }))
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
          }
        }
      }
    })

    return this.transformConversation(conversation)
  }

  /**
   * Find existing private conversation between two users
   */
  static async findExistingPrivateConversation(
    participantIds: string[]
  ): Promise<ChatConversation | null> {
    if (participantIds.length !== 2) return null

    const conversation = await prisma.conversation.findFirst({
      where: {
        type: 'private',
        participants: {
          every: {
            userId: { in: participantIds },
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
          }
        }
      }
    })

    if (!conversation || conversation.participants.length !== 2) {
      return null
    }

    return this.transformConversation(conversation)
  }

  /**
   * Add participants to a conversation
   */
  static async addParticipants(
    conversationId: string,
    userIds: string[],
    addedBy: string
  ): Promise<ConversationParticipant[]> {
    // Verify the user adding participants is already in the conversation
    const existingParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: addedBy,
        isActive: true
      }
    })

    if (!existingParticipant) {
      throw new Error('User not authorized to add participants')
    }

    // Check which users are not already participants
    const existingParticipants = await prisma.conversationParticipant.findMany({
      where: {
        conversationId,
        userId: { in: userIds }
      }
    })

    const existingUserIds = existingParticipants.map(p => p.userId)
    const newUserIds = userIds.filter(id => !existingUserIds.includes(id))

    if (newUserIds.length === 0) {
      return []
    }

    // Add new participants
    const newParticipants = await prisma.conversationParticipant.createMany({
      data: newUserIds.map(userId => ({
        conversationId,
        userId,
        joinedAt: new Date(),
        lastReadAt: new Date(),
        isActive: true
      }))
    })

    // Get the created participants with user data
    const createdParticipants = await prisma.conversationParticipant.findMany({
      where: {
        conversationId,
        userId: { in: newUserIds }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    return createdParticipants.map(p => ({
      id: p.id,
      userId: p.userId,
      userName: p.user.name,
      userAvatar: p.user.avatar || undefined,
      joinedAt: p.joinedAt.toISOString(),
      lastReadAt: p.lastReadAt.toISOString(),
      isActive: p.isActive
    }))
  }

  /**
   * Remove a participant from a conversation
   */
  static async removeParticipant(
    conversationId: string,
    userId: string,
    removedBy: string
  ): Promise<boolean> {
    // Verify the user removing is authorized (either removing themselves or is admin)
    const removerParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: removedBy,
        isActive: true
      }
    })

    if (!removerParticipant) {
      throw new Error('User not authorized to remove participants')
    }

    // For now, users can only remove themselves
    if (userId !== removedBy) {
      throw new Error('Users can only remove themselves from conversations')
    }

    // Mark participant as inactive instead of deleting
    const updated = await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId,
        isActive: true
      },
      data: {
        isActive: false
      }
    })

    if (updated.count > 0) {
      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      })
      return true
    }

    return false
  }

  /**
   * Get conversation metadata including unread counts and last message
   */
  static async getConversationMetadata(
    conversationId: string,
    userId: string
  ): Promise<{
    unreadCount: number
    lastMessage?: any
    participantCount: number
  }> {
    // Get user's last read timestamp
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
        isActive: true
      }
    })

    if (!participant) {
      throw new Error('User is not a participant in this conversation')
    }

    // Get unread count
    const unreadCount = await prisma.message.count({
      where: {
        conversationId,
        createdAt: {
          gt: participant.lastReadAt
        },
        senderId: {
          not: userId
        }
      }
    })

    // Get last message
    const lastMessage = await prisma.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    // Get active participant count
    const participantCount = await prisma.conversationParticipant.count({
      where: {
        conversationId,
        isActive: true
      }
    })

    return {
      unreadCount,
      lastMessage: lastMessage ? {
        id: lastMessage.id,
        conversationId: lastMessage.conversationId,
        senderId: lastMessage.senderId,
        senderName: lastMessage.sender.name,
        senderAvatar: lastMessage.sender.avatar || undefined,
        content: lastMessage.content,
        type: lastMessage.type,
        status: lastMessage.status,
        createdAt: lastMessage.createdAt.toISOString(),
        updatedAt: lastMessage.updatedAt.toISOString()
      } : undefined,
      participantCount
    }
  }

  /**
   * Mark messages as read for a user
   */
  static async markMessagesAsRead(
    conversationId: string,
    userId: string,
    upToMessageId?: string
  ): Promise<void> {
    // Update user's lastReadAt timestamp
    const updateData: any = {
      lastReadAt: new Date()
    }

    // If specific message ID provided, use that message's timestamp
    if (upToMessageId) {
      const message = await prisma.message.findUnique({
        where: { id: upToMessageId }
      })
      if (message) {
        updateData.lastReadAt = message.createdAt
      }
    }

    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId,
        isActive: true
      },
      data: updateData
    })
  }

  /**
   * Transform database conversation to API format
   */
  private static transformConversation(conversation: any): ChatConversation {
    return {
      id: conversation.id,
      type: conversation.type as 'private' | 'group',
      name: conversation.name || undefined,
      participants: conversation.participants.map((p: any) => ({
        id: p.id,
        userId: p.userId,
        userName: p.user.name,
        userAvatar: p.user.avatar || undefined,
        joinedAt: p.joinedAt.toISOString(),
        lastReadAt: p.lastReadAt.toISOString(),
        isActive: p.isActive
      })),
      unreadCount: 0, // This should be calculated separately per user
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString()
    }
  }
}