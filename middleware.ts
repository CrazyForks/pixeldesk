import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')

// Define protected routes that require authentication
const protectedRoutes = [
  '/api/auth/settings',
  '/api/auth/avatar',
  '/api/auth/logout',
  // Add more protected routes as needed
]

// Define public routes that should be accessible without authentication
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/users', // Keep this public for now as it might be used by the game
  // Add more public routes as needed
]

async function verifyAuth(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/webhooks') // Skip webhooks
  ) {
    return NextResponse.next()
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // If it's a protected route, verify authentication
  if (isProtectedRoute) {
    const user = await verifyAuth(request)
    
    if (!user) {
      // Return 401 Unauthorized for API routes
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }
      
      // For non-API routes, redirect to login (if we had login pages)
      // For now, just return 401
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Add user info to headers for downstream handlers
    const response = NextResponse.next()
    response.headers.set('x-user-id', user.userId as string)
    response.headers.set('x-user-email', user.email as string || '')
    return response
  }

  // For all other routes, continue without authentication check
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}