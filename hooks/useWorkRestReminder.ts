'use client'

import { useEffect, useRef, useState } from 'react'

const BREAK_THRESHOLD = 60 * 60 * 1000 // 60 minutes
const CHECK_INTERVAL = 60 * 1000 // Check every minute

export function useWorkRestReminder() {
    const [currentStatus, setCurrentStatus] = useState<any>(null)
    const startTimestampRef = useRef<number | null>(null)
    const lastNotificationTimeRef = useRef<number>(0)

    useEffect(() => {
        const handleStatusChange = (e: any) => {
            console.log('🔔 [WorkRestReminder] Status Change Event:', e.detail)
            setCurrentStatus(e.detail)
        }

        window.addEventListener('status-changed' as any, handleStatusChange)

        // Request notification permission if needed
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission()
            }
        }

        return () => {
            window.removeEventListener('status-changed' as any, handleStatusChange)
        }
    }, [])

    useEffect(() => {
        if (currentStatus?.type === 'working') {
            // If just started working or already working, keep track
            if (!startTimestampRef.current) {
                startTimestampRef.current = Date.now()
                console.log('🕒 [WorkRestReminder] Started working timer at:', new Date(startTimestampRef.current).toLocaleTimeString())
            }

            const interval = setInterval(() => {
                if (!startTimestampRef.current) return

                const elapsed = Date.now() - startTimestampRef.current

                // If worked for more than threshold and haven't notified in the last 60 mins
                if (elapsed >= BREAK_THRESHOLD && (Date.now() - lastNotificationTimeRef.current > BREAK_THRESHOLD)) {
                    sendNotification()
                    lastNotificationTimeRef.current = Date.now()
                }
            }, CHECK_INTERVAL)

            return () => clearInterval(interval)
        } else {
            // Reset if not working
            if (startTimestampRef.current) {
                console.log('🛑 [WorkRestReminder] Stopped working timer.')
            }
            startTimestampRef.current = null
        }
    }, [currentStatus])

    const sendNotification = () => {
        const title = '🕒 休息时间到了！'
        const options = {
            body: '你已经连续工作超过一个小时了。建议去像素洗手间转转，或者倒杯咖啡休息一下。',
            icon: '/logo.png',
            badge: '/logo.png',
            tag: 'work-rest-reminder',
            renotify: true
        }

        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(title, options)
            } else {
                console.log('Work Reminder:', title, options.body)
                window.dispatchEvent(new CustomEvent('show-toast', {
                    detail: { message: title + ' ' + options.body, type: 'info' }
                }))
            }
        }
    }
}
