// Generates a deterministic default avatar using DiceBear API
// No external dependency needed - just a URL
export function getDefaultAvatarUrl(seed: string): string {
  const styles = ['adventurer', 'avataaars', 'bottts', 'fun-emoji', 'lorelei', 'micah', 'notionists', 'open-peeps']
  // Pick a style deterministically based on the seed
  const styleIndex = seed.charCodeAt(0) % styles.length
  const style = styles[styleIndex]
  const encodedSeed = encodeURIComponent(seed)
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodedSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}

export async function uploadCustomerAvatar(
  supabase: any,
  customerId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Validate
    if (!file.type.startsWith('image/')) {
      return { url: null, error: 'Please select an image file' }
    }
    if (file.size > 3 * 1024 * 1024) {
      return { url: null, error: 'Image must be under 3 MB' }
    }

    // Resize + convert to WebP using Canvas
    const resized = await resizeImage(file, 400)

    const fileName = `${crypto.randomUUID()}.webp`
    const path = `${customerId}/${fileName}`

    const arrayBuffer = await resized.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('customer-avatars')
      .upload(path, buffer, { contentType: 'image/webp', upsert: false })

    if (uploadError) return { url: null, error: uploadError.message }

    const url = supabase.storage.from('customer-avatars').getPublicUrl(path).data.publicUrl
    return { url, error: null }
  } catch (err: any) {
    return { url: null, error: err?.message || 'Upload failed' }
  }
}

function resizeImage(file: File, maxSize: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob failed'))
      }, 'image/webp', 0.85)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}