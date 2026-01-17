import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/pixel-dashboard/permissions'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
    try {
        await requirePermission('settings.edit')

        const formData = await request.formData()
        const file = formData.get('file') as File
        const level = formData.get('level') as string

        if (!file) {
            return NextResponse.json({ error: '请上传文件' }, { status: 400 })
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Create unique file name
        const timestamp = Date.now()
        const extension = file.name.split('.').pop() || 'png'
        const fileName = `badge_lvl${level}_${timestamp}.${extension}`

        const uploadDir = join(process.cwd(), 'public', 'uploads', 'badges')
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        const filePath = join(uploadDir, fileName)
        await writeFile(filePath, buffer)

        return NextResponse.json({
            success: true,
            url: `/uploads/badges/${fileName}`
        })
    } catch (error) {
        console.error('Badge upload error:', error)
        return NextResponse.json({ error: '上传失败' }, { status: 500 })
    }
}
