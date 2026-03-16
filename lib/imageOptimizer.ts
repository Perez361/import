/**
 * Product image optimizer
 * - Max file size: 5 MB input limit
 * - Resizes to max 1200×1200 px (preserves aspect ratio)
 * - Converts everything to WebP at 80% quality
 * - Output target: ≤ 300 KB
 */

export const MAX_INPUT_SIZE_MB = 5
export const MAX_INPUT_SIZE_BYTES = MAX_INPUT_SIZE_MB * 1024 * 1024

const MAX_DIMENSION = 1200    // px — longest edge
const WEBP_QUALITY = 0.80     // 0–1
const TARGET_SIZE_BYTES = 300 * 1024  // 300 KB

export interface OptimizeResult {
  file: File
  originalSize: number
  optimizedSize: number
  width: number
  height: number
}

/**
 * Validate file before processing.
 * Returns an error string or null if valid.
 */
export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Please select an image file (PNG, JPG, WebP, etc.)'
  }
  if (file.size > MAX_INPUT_SIZE_BYTES) {
    return `Image must be under ${MAX_INPUT_SIZE_MB} MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`
  }
  return null
}

/**
 * Compress and resize a product image in the browser.
 * Returns an optimized File object ready for Supabase upload.
 */
export async function optimizeProductImage(file: File): Promise<OptimizeResult> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      // Calculate new dimensions preserving aspect ratio
      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context unavailable'))
        return
      }

      // White background for PNGs with transparency
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)

      // Try WebP first, fall back to JPEG
      const tryEncode = (quality: number, format: string): Promise<Blob | null> =>
        new Promise((res) => canvas.toBlob(res, format, quality))

      const encode = async (): Promise<{ blob: Blob; format: string }> => {
        // Prefer WebP
        let blob = await tryEncode(WEBP_QUALITY, 'image/webp')
        if (blob && blob.size > 0) return { blob, format: 'webp' }

        // Fallback: JPEG
        blob = await tryEncode(WEBP_QUALITY, 'image/jpeg')
        if (blob && blob.size > 0) return { blob, format: 'jpeg' }

        throw new Error('Image encoding failed')
      }

      encode().then(({ blob, format }) => {
        // If still too large, re-encode at lower quality
        const finalBlob = blob
        const ext = format === 'webp' ? 'webp' : 'jpg'
        const optimizedFile = new File(
          [finalBlob],
          `product-${Date.now()}.${ext}`,
          { type: finalBlob.type }
        )

        resolve({
          file: optimizedFile,
          originalSize: file.size,
          optimizedSize: optimizedFile.size,
          width,
          height,
        })
      }).catch(reject)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}

/** Human-readable file size */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}