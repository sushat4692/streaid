import { invoke } from '@tauri-apps/api/core'
import cx from 'classnames'
import { useState, useEffect } from 'react'

import type { BonsaiStatus, ChatStatus } from '../types/chat'

import Button from './Button'
import Field from './Field'

export default function ChatControl() {
  const [status, setStatus] = useState<ChatStatus>({
    connected: false,
    is_running: false,
    is_enabled: true,
    channel: null,
  })
  const [bonsai, setBonsai] = useState<BonsaiStatus>({
    enabled: false,
    binary_found: false,
    active_model: '8b',
    models: [],
  })
  const [isStarting, setIsStarting] = useState(false)
  const [isBonsaiToggling, setIsBonsaiToggling] = useState(false)
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
    try {
      const bonsaiStatus = await invoke<BonsaiStatus>('get_bonsai_status_cmd')
      setBonsai(bonsaiStatus)
    } catch (e) {
      console.error('Failed to get bonsai status:', e)
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

  async function handleBonsaiToggle() {
    setIsBonsaiToggling(true)
    try {
      await invoke('set_local_model_cmd', { enabled: !bonsai.enabled })
      setTimeout(fetchStatus, 300)
    } catch (e) {
      console.error('Failed to toggle local model:', e)
      alert(`Failed to toggle local model: ${e}`)
    } finally {
      setIsBonsaiToggling(false)
    }
  }

  async function handleVariantChange(model: '8b' | '4b') {
    try {
      await invoke('set_local_model_variant_cmd', { model })
      setTimeout(fetchStatus, 200)
    } catch (e) {
      console.error('Failed to set local model variant:', e)
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

      <div className='pt-2 border-t border-white/10'>
        <div className='flex items-center justify-between'>
          <h4 className='text-sm font-semibold text-white'>
            Local Model (Bonsai)
          </h4>

          <div
            className={cx(
              'px-3 py-1 rounded-full text-xs font-medium',
              bonsai.models.some((m) => m.running)
                ? 'bg-green-500/20 text-green-400'
                : bonsai.enabled
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-gray-500/20 text-gray-400'
            )}
          >
            {bonsai.models.some((m) => m.running)
              ? '● Running'
              : bonsai.enabled
                ? '● Starting...'
                : '○ Off'}
          </div>
        </div>

        <p className='text-xs text-gray-400 mt-1'>
          When enabled, !ts and !d are answered by the local model instead of
          the Gemini API.
        </p>

        {bonsai.models.length > 0 && (
          <div className='mt-2 flex gap-2 flex-wrap'>
            {bonsai.models.map((m) => (
              <span
                key={m.name}
                className={cx(
                  'px-2.5 py-1 rounded-full text-[10px] font-medium border',
                  m.running
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : m.model_found
                      ? 'bg-white/5 border-white/10 text-gray-400'
                      : 'bg-white/5 border-white/10 text-gray-600'
                )}
              >
                {m.name.toUpperCase()}:{' '}
                {m.running ? '●' : m.model_found ? '○' : '—'}
              </span>
            ))}
          </div>
        )}

        {bonsai.enabled && (
          <div className='mt-3 flex items-center gap-2'>
            <span className='text-[10px] font-semibold uppercase tracking-wide text-gray-500'>
              Chat model:
            </span>
            <div className='flex gap-1 p-0.5 rounded-lg bg-white/5 border border-white/10'>
              {(['8b', '4b'] as const).map((m) => {
                const available = bonsai.models.some(
                  (x) => x.name === m && x.model_found
                )
                return (
                  <button
                    key={m}
                    type='button'
                    onClick={() => handleVariantChange(m)}
                    disabled={!available}
                    className={cx(
                      'px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
                      bonsai.active_model === m
                        ? 'bg-[#9146FF]/20 text-white ring-1 ring-[#9146FF]/40'
                        : 'text-gray-400 hover:text-white',
                      !available && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    {m.toUpperCase()}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {!bonsai.binary_found || bonsai.models.every((m) => !m.model_found) ? (
          <div className='mt-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20'>
            <p className='text-xs text-yellow-400'>
              ⚠ Not set up — run{' '}
              <code className='font-mono'>scripts/setup-bonsai.sh</code> to
              download the model (add{' '}
              <code className='font-mono'>--with-4b</code> for the 4B variant)
            </p>
          </div>
        ) : (
          <div className='mt-3'>
            <Button
              variant={bonsai.enabled ? 'destructive' : 'secondary'}
              onClick={handleBonsaiToggle}
              disabled={isBonsaiToggling}
              className='w-full'
            >
              {isBonsaiToggling
                ? 'Switching...'
                : bonsai.enabled
                  ? 'Disable Local Model'
                  : 'Enable Local Model'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
