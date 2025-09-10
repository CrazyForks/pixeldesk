import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

/**
 * Get all online users (for admin or general discovery)
 * GET /api/chat/users/online-status/all
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let currentUserId: string;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      currentUserId = decoded.userId || decoded.id;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeOffline = searchParams.get('includeOffline') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate parameters
    if (limit > 100) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 100' },
        { status: 400 }
      );
    }

    // Build where clause
    const whereClause: any = {
      userId: {
        not: currentUserId // Exclude current user
      }
    };

    if (!includeOffline) {
      whereClause.isOnline = true;
    }

    // Get users with their online status
    const userStatuses = await prisma.userOnlineStatus.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: [
        { isOnline: 'desc' }, // Online users first
        { lastSeen: 'desc' }   // Then by last seen
      ],
      take: limit,
      skip: offset
    });

    // Get total count for pagination
    const totalCount = await prisma.userOnlineStatus.count({
      where: whereClause
    });

    const usersList = userStatuses.map(status => ({
      userId: status.userId,
      isOnline: status.isOnline,
      lastSeen: status.lastSeen.toISOString(),
      socketId: status.socketId,
      user: status.user
    }));

    return NextResponse.json({
      success: true,
      data: usersList,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching online users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch online users' },
      { status: 500 }
    );
  }
}