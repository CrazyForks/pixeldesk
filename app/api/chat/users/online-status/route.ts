import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

/**
 * Get online status of users
 * GET /api/chat/users/online-status?userIds=id1,id2,id3
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
    const userIdsParam = searchParams.get('userIds');

    if (!userIdsParam) {
      return NextResponse.json(
        { error: 'userIds parameter is required' },
        { status: 400 }
      );
    }

    const userIds = userIdsParam.split(',').filter(id => id.trim());

    if (userIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one user ID is required' },
        { status: 400 }
      );
    }

    // Limit to prevent abuse
    if (userIds.length > 100) {
      return NextResponse.json(
        { error: 'Too many user IDs requested (max 100)' },
        { status: 400 }
      );
    }

    // Get online status for requested users
    const onlineStatuses = await prisma.userOnlineStatus.findMany({
      where: {
        userId: {
          in: userIds
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    // Create a map for quick lookup
    const statusMap = new Map(
      onlineStatuses.map(status => [status.userId, status])
    );

    // Build response with all requested users (including those without status records)
    const userStatuses = userIds.map(userId => {
      const status = statusMap.get(userId);
      return {
        userId,
        isOnline: status?.isOnline || false,
        lastSeen: status?.lastSeen?.toISOString() || null,
        user: status?.user || null
      };
    });

    return NextResponse.json({
      success: true,
      data: userStatuses,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching online status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch online status' },
      { status: 500 }
    );
  }
}

/**
 * Update user's online status
 * POST /api/chat/users/online-status
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { isOnline } = body;

    if (typeof isOnline !== 'boolean') {
      return NextResponse.json(
        { error: 'isOnline must be a boolean value' },
        { status: 400 }
      );
    }

    // Update or create online status
    const updatedStatus = await prisma.userOnlineStatus.upsert({
      where: { userId: currentUserId },
      update: {
        isOnline,
        lastSeen: new Date(),
        updatedAt: new Date()
      },
      create: {
        userId: currentUserId,
        isOnline,
        lastSeen: new Date(),
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: updatedStatus.userId,
        isOnline: updatedStatus.isOnline,
        lastSeen: updatedStatus.lastSeen.toISOString(),
        updatedAt: updatedStatus.updatedAt.toISOString(),
        user: updatedStatus.user
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating online status:', error);
    return NextResponse.json(
      { error: 'Failed to update online status' },
      { status: 500 }
    );
  }
}

/**
 * Get all online users (for admin or general discovery)
 * GET /api/chat/users/online-status/all
 */
export async function PUT(request: NextRequest) {
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

    // Get all online users
    const onlineUsers = await prisma.userOnlineStatus.findMany({
      where: {
        isOnline: true,
        userId: {
          not: currentUserId // Exclude current user
        }
      },
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
      orderBy: {
        lastSeen: 'desc'
      }
    });

    const onlineUsersList = onlineUsers.map(status => ({
      userId: status.userId,
      isOnline: status.isOnline,
      lastSeen: status.lastSeen.toISOString(),
      user: status.user
    }));

    return NextResponse.json({
      success: true,
      data: onlineUsersList,
      count: onlineUsersList.length,
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