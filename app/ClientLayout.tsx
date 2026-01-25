'use client'

import { UserProvider } from '../contexts/UserContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import '@/lib/firebase' // Initialize Firebase and Analytics
import { useWorkRestReminder } from '@/hooks/useWorkRestReminder'

function GlobalReminder() {
  useWorkRestReminder()
  return null
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <UserProvider>
        <GlobalReminder />
        {children}
      </UserProvider>
    </ThemeProvider>
  )
}