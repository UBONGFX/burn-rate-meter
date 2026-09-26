import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/useI18n'
import { shareText, type MeetingResult } from '../lib/share'
import { renderShareImage } from '../lib/shareImage'
import { Button } from './Button'
import styles from './ShareButton.module.css'

type Status = 'savedAndCopied' | 'copied' | 'saved' | 'failed'

const FILE_NAME = 'burn-rate-meter.png'

function appUrl(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href
}

function download(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = FILE_NAME
  link.click()
  URL.revokeObjectURL(url)
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Shares the result as image + text. Uses the system share sheet where it can
 * share files (phones, macOS, Windows); otherwise downloads the image and copies the text.
 */
export function ShareButton({ result }: { result: MeetingResult }) {
  const { t, formatEUR } = useI18n()
  const [status, setStatus] = useState<Status | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!status) return
    const timeout = setTimeout(() => setStatus(null), 5000)
    return () => clearTimeout(timeout)
  }, [status])

  const share = async () => {
    setBusy(true)
    setStatus(null)
    const url = appUrl()
    const text = shareText(t, formatEUR, result, url)
    const image = await renderShareImage(t, formatEUR, result, url.replace(/^https?:\/\//, '').replace(/\/$/, '')).catch(
      () => null,
    )
    const file = image && new File([image], FILE_NAME, { type: 'image/png' })

    try {
      if (file && navigator.canShare?.({ files: [file], text })) {
        await navigator.share({ files: [file], text })
        return
      }
      if (!file && navigator.share) {
        await navigator.share({ text })
        return
      }
    } catch (error) {
      // Closing the share sheet is not an error
      if (error instanceof DOMException && error.name === 'AbortError') return
    } finally {
      setBusy(false)
    }

    if (file) download(file)
    const copied = await copy(text)
    setStatus(file && copied ? 'savedAndCopied' : copied ? 'copied' : file ? 'saved' : 'failed')
  }

  return (
    <div className={styles.share}>
      <Button size="medium" className={styles.button} disabled={busy} onClick={share}>
        {t.share.button}
      </Button>
      <p className={styles.status} role="status">
        {status && t.share[status]}
      </p>
    </div>
  )
}
