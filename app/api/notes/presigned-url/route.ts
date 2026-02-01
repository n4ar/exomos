import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPresignedUploadUrl, generateFileKey } from '@/lib/r2'

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const { fileName, contentType, subjectId } = await request.json()

    // 3. Validate inputs
    if (!fileName || !contentType || !subjectId) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, contentType, subjectId' },
        { status: 400 }
      )
    }

    if (contentType !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    // 4. Generate presigned URL
    const fileKey = generateFileKey(user.id, fileName)
    const { uploadUrl, key } = await getPresignedUploadUrl(fileKey, contentType)

    return NextResponse.json({
      uploadUrl,
      key,
      fileUrl: `https://${process.env.CLOUDFLARE_R2_BUCKET_NAME}.r2.dev/${key}`,
    })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate presigned URL' },
      { status: 500 }
    )
  }
}
