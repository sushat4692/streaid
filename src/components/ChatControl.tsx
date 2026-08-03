import { invoke } from '@tauri-apps/api/core'
import cx from 'classnames'
import { useState, useEffect } from 'react'

import type { ChatStatus } from '../types/chat'

import Button from './Button'
import Field from './Field'

export default function ChatControl() {
  const [status, setStatus] = useState<ChatStatus>({
    connected: false,
    is_running: false,
    is_enabled: true,
    channel: null,
  })
  const [isStarting, setIsStarting] = useState(false)
  const [targetChannel, setTargetChannel] = useState('')

  // One-time init: fetch status and pre-fill saved channel
  useEffect(() => {
    async function init() {
      try {
        const chatStatus = await invoke<ChatStatus>('get_chat_status_cmd')
        setStatus(chatStatus)
        if (!chatStatus.is_running && chatStatus.last_target_channel) {
          setTargetChannel(chatStatus.last_target_channel)
        }
      } catch (e) {
        console.error('Failed to get chat status:', e)
      }
    }
    init()
  }, [])

  // Polling: only updates status, never touches targetChannel
  useEffect(() => {
    const interval = setInterval(fetchStatus, 2000)
    return () => clearInterval(interval)
  }, [])

  async function fetchStatus() {
    try {
      const chatStatus = await invoke<ChatStatus>('get_chat_status_cmd')
      setStatus(chatStatus)
    } catch (e) {
      console.error('Failed to get chat status:', e)
    }
  }

  async function handleStart() {
    setIsStarting(true)
    try {
      // Pass target channel to backend (null if empty string)
      await invoke('start_chat_listener_cmd', {
        targetChannel: targetChannel.trim() || null,
      })
      console.log('Chat listener started')
      // Refresh status immediately
      setTimeout(fetchStatus, 500)
    } catch (e) {
      console.error('Failed to start listener:', e)
      alert(`Failed to start chat listener: ${e}`)
    } finally {
      setIsStarting(false)
    }
  }

  async function handleStop() {
    try {
      await invoke('stop_chat_listener_cmd')
      console.log('Chat listener stopped')
      // Refresh status immediately
      setTimeout(fetchStatus, 500)
    } catch (e) {
      console.error('Failed to stop listener:', e)
    }
  }

  async function handleToggle() {
    try {
      await invoke('toggle_translation_cmd', { enabled: !status.is_enabled })
      // Refresh status immediately
      setTimeout(fetchStatus, 200)
    } catch (e) {
      console.error('Failed to toggle translation:', e)
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-white'>Chat Listener</h3>

        <div
          className={cx(
            'px-3 py-1 rounded-full text-xs font-medium',
            status.is_running
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-500/20 text-gray-400'
          )}
        >
          {status.is_running ? '● Running' : '○ Stopped'}
        </div>
      </div>

      {!status.is_running && (
        <Field
          label='Target Channel'
          value={targetChannel}
          onChange={setTargetChannel}
          placeholder='Leave empty for your channel, or enter any channel (e.g., xqc)'
        />
      )}

      {status.channel && (
        <div className='p-4 rounded-xl bg-white/5 border border-white/10'>
          <p className='text-sm text-gray-400'>Monitoring</p>
          <p className='text-white font-medium'>#{status.channel}</p>
        </div>
      )}

      <div className='flex gap-3'>
        {!status.is_running ? (
          <Button
            variant='primary'
            onClick={handleStart}
            disabled={isStarting}
            className='flex-1'
          >
            {isStarting ? 'Starting...' : 'Start Listening'}
          </Button>
        ) : (
          <Button variant='destructive' onClick={handleStop} className='flex-1'>
            Stop Listening
          </Button>
        )}

        <Button
          variant={status.is_enabled ? 'secondary' : 'destructive'}
          onClick={handleToggle}
          disabled={!status.is_running}
          className='flex-1'
        >
          {status.is_enabled ? 'Disable !ts' : 'Enable !ts'}
        </Button>
      </div>

      {status.is_running && !status.is_enabled && (
        <div className='p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20'>
          <p className='text-xs text-yellow-400'>
            ⚠ Translation command (!ts) is currently disabled
          </p>
        </div>
      )}
    </div>
  )
}
