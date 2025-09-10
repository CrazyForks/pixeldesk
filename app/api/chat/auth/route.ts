import { NextRequest, NextResponse } from 'next/server';
import { generateWebSocketToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Generate WebSocket authentication token
    const token = generateWebSocketToken(userId, userData);

    return NextResponse.json({
      token,
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Error generating WebSocket token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}