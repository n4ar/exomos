import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Initialize R2 client (S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME!

export interface UploadFileParams {
  key: string
  body: Buffer
  contentType: string
  metadata?: Record<string, string>
}

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadFile({ key, body, contentType, metadata }: UploadFileParams) {
  // Sanitize metadata to remove invalid characters for S3 headers
  const sanitizedMetadata = metadata
    ? Object.entries(metadata).reduce((acc, [key, value]) => {
        // Only include ASCII characters in metadata
        const sanitizedValue = value.replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII
        if (sanitizedValue) {
          acc[key] = sanitizedValue
        }
        return acc
      }, {} as Record<string, string>)
    : undefined

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: sanitizedMetadata,
  })

  await r2Client.send(command)

  return {
    key,
    url: `https://${BUCKET_NAME}.r2.dev/${key}`, // Public URL if bucket is public
  }
}

/**
 * Get a file from Cloudflare R2
 */
export async function getFile(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  const response = await r2Client.send(command)

  // Convert stream to buffer
  const bytes = await response.Body!.transformToByteArray()
  return Buffer.from(bytes)
}

/**
 * Generate a presigned URL for temporary access
 */
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  return await getSignedUrl(r2Client, command, { expiresIn })
}

/**
 * Delete a file from Cloudflare R2
 */
export async function deleteFile(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await r2Client.send(command)
}

/**
 * Generate a unique file key for R2 storage
 */
export function generateFileKey(userId: string, filename: string): string {
  const timestamp = Date.now()
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `notes/${userId}/${timestamp}-${sanitizedFilename}`
}
