import { describe, expect, it } from 'vitest'
import { seedCatalog } from '../../items/catalog.ts'
import { qrCode } from './qr.ts'
import { encodeCatalog, shareLink } from '../../items/sharedCatalog.ts'

describe('QR code for a Shared Catalog', () => {
  it('fits the starter Catalog in a small, easily scanned code', async () => {
    let n = 0
    const link = shareLink('https://peteriron.github.io/order-me-app/', await encodeCatalog(seedCatalog('nl', () => `${n++}`)))
    expect(qrCode(link)?.size).toBeLessThanOrEqual(81) // version 16 or smaller
  })

  it('gives no code for a link too long to scan reliably', () => {
    expect(qrCode(`https://peteriron.github.io/order-me-app/#items=${'x'.repeat(1200)}`)).toBeNull()
  })
})
