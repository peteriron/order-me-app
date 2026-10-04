import { correction, generate, type Bitmap2D } from 'lean-qr'

/**
 * Largest QR version (size) we show. Version 20 is 97×97 modules: still about 3 px a module on a phone screen,
 * which a camera reads easily. A bigger Catalog gets "Copy link" only.
 */
const MAX_VERSION = 20

/** The QR code for `text`, or null when it would be too dense to scan reliably off a phone screen. */
export function qrCode(text: string): Bitmap2D | null {
  try {
    return generate(text, { minCorrectionLevel: correction.M, maxVersion: MAX_VERSION })
  } catch {
    return null
  }
}
