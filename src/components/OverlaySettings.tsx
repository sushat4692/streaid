import { invoke } from '@tauri-apps/api/core'
import { useEffect, useState } from 'react'

import Button from './Button'

export default function OverlaySettings() {
  const [url, setUrl] = useState('http://localhost:4242')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    invoke<string>('get_overlay_url_cmd')
      .then(setUrl)
      .catch(() => {})
  }, [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className='space-y-3'>
      <h3 className='text-lg font-semibold text-white'>OBS Overlay</h3>
      <p className='text-xs text-gray-500'>
        Add this URL as a Browser Source in OBS to show live translation and
        dictionary results on your stream.
      </p>
      <div className='flex items-center gap-2'>
        <code className='flex-1 rounded bg-white/5 px-3 py-2 text-sm text-purple-300 font-mono truncate'>
          {url}
        </code>
        <Button variant='secondary' size='sm' onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <p className='text-xs text-gray-600'>
        Recommended size: 800×300 · Enable transparent background in OBS
      </p>
    </div>
  )
}
