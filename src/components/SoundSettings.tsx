import { invoke } from '@tauri-apps/api/core'
import { useRef } from 'react'

import { useSoundContext } from '../contexts/soundContext'
import type { SoundData } from '../types/chat'
import Button from './Button'

type SoundSlotProps = {
  label: string
  soundType: string
  sound: SoundData | null
  volume: number
  onUpdate: (s: SoundData | null) => void
  onVolumeChange: (v: number) => void
}

function SoundSlot({
  label,
  soundType,
  sound,
  volume,
  onUpdate,
  onVolumeChange,
}: SoundSlotProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const buf = await file.arrayBuffer()
    const data = [...new Uint8Array(buf)]

    try {
      await invoke('set_sound_cmd', { soundType, data, fileName: file.name })
      const result = await invoke<SoundData | null>('get_sound_cmd', {
        soundType,
      })
      onUpdate(result)
    } catch (err) {
      console.error('Failed to save sound:', err)
    }

    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  function handlePreview() {
    if (!sound?.data_url) return
    const audio = new Audio(sound.data_url)
    audio.volume = volume
    audio.play().catch(() => {})
  }

  async function handleClear() {
    try {
      await invoke('clear_sound_cmd', { soundType })
      onUpdate(null)
    } catch (err) {
      console.error('Failed to clear sound:', err)
    }
  }

  return (
    <div className='space-y-2'>
      <p className='text-sm font-medium text-gray-300'>{label}</p>
      <p className='text-xs text-gray-500'>
        {sound ? sound.file_name : 'No file set'}
      </p>
      <div className='flex gap-2'>
        <Button
          variant='secondary'
          size='sm'
          onClick={() => fileInputRef.current?.click()}
        >
          Upload
        </Button>
        <Button
          variant='secondary'
          size='sm'
          onClick={handlePreview}
          disabled={!sound}
        >
          Preview
        </Button>
        <Button
          variant='destructive'
          size='sm'
          onClick={handleClear}
          disabled={!sound}
        >
          Clear
        </Button>
      </div>
      <div className='flex items-center gap-3'>
        <label className='text-xs text-gray-500 shrink-0'>Volume</label>
        <input
          type='range'
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={(e) => onVolumeChange(parseInt(e.target.value) / 100)}
          className='flex-1 accent-purple-500'
        />
        <span className='text-xs text-gray-400 w-8 text-right'>
          {Math.round(volume * 100)}%
        </span>
      </div>
      <input
        ref={fileInputRef}
        type='file'
        accept='.mp3,.wav,.ogg,.m4a,.aac'
        className='hidden'
        onChange={handleFileChange}
      />
    </div>
  )
}

export default function SoundSettings() {
  const {
    newChatterSound,
    returningChatterSound,
    setNewChatterSound,
    setReturningChatterSound,
    newChatterVolume,
    returningChatterVolume,
    setNewChatterVolume,
    setReturningChatterVolume,
  } = useSoundContext()

  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold text-white'>Sound Notifications</h3>
      <p className='text-xs text-gray-500'>
        Plays a sound when a chatter sends a message. First-message tracking
        resets on app restart.
      </p>

      <SoundSlot
        label='New Chatter Sound'
        soundType='first'
        sound={newChatterSound}
        volume={newChatterVolume}
        onUpdate={setNewChatterSound}
        onVolumeChange={setNewChatterVolume}
      />

      <div className='border-t border-white/10' />

      <SoundSlot
        label='Returning Chatter Sound'
        soundType='remaining'
        sound={returningChatterSound}
        volume={returningChatterVolume}
        onUpdate={setReturningChatterSound}
        onVolumeChange={setReturningChatterVolume}
      />
    </div>
  )
}
