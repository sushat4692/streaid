import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
} from '@tanstack/react-router'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import cx from 'classnames'
import { useState, useEffect, useRef } from 'react'

import AppIcon from '../components/AppIcon'
import Button from '../components/Button'
import { LogContext } from '../contexts/logContext'
import { SoundContext } from '../contexts/soundContext'
import type {
  ChatMessageEvent,
  ChatStatus,
  DictionaryEvent,
  SoundData,
  TranslationEvent,
} from '../types/chat'

const MAX_LOG_ENTRIES = 50

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
})

type TokenInfo = {
  access_token: string
  login?: string
  user_id?: string
}

function AuthenticatedLayout() {
  const navigate = useNavigate()
  const [username, setUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState<ChatStatus>({
    connected: false,
    is_running: false,
    is_enabled: true,
    channel: null,
  })
  const [translations, setTranslations] = useState<TranslationEvent[]>([])
  const [lookups, setLookups] = useState<DictionaryEvent[]>([])
  const [newChatterSound, setNewChatterSound] = useState<SoundData | null>(null)
  const [returningChatterSound, setReturningChatterSound] =
    useState<SoundData | null>(null)
  const [newChatterVolume, setNewChatterVolumeState] = useState<number>(() =>
    parseFloat(localStorage.getItem('sound_volume_first') ?? '1')
  )
  const [returningChatterVolume, setReturningChatterVolumeState] =
    useState<number>(() =>
      parseFloat(localStorage.getItem('sound_volume_remaining') ?? '1')
    )
  const seenUsersRef = useRef<Set<string>>(new Set())

  function setNewChatterVolume(v: number) {
    localStorage.setItem('sound_volume_first', String(v))
    setNewChatterVolumeState(v)
  }

  function setReturningChatterVolume(v: number) {
    localStorage.setItem('sound_volume_remaining', String(v))
    setReturningChatterVolumeState(v)
  }

  useEffect(() => {
    ;(async () => {
      try {
        const token = await invoke<TokenInfo | null>('get_stored_token_cmd')
        if (!token) {
          navigate({ to: '/login' })
          return
        }
        setUsername(token.login ?? 'Unknown User')
      } catch (e) {
        console.error('Failed to get token:', e)
        navigate({ to: '/login' })
      } finally {
        setIsLoading(false)
      }
    })()
  }, [navigate])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const unlisten = listen<TranslationEvent>('translation', (event) => {
      setTranslations((prev) =>
        [event.payload, ...prev].slice(0, MAX_LOG_ENTRIES)
      )
    })
    return () => {
      unlisten.then((fn) => fn())
    }
  }, [])

  useEffect(() => {
    const unlisten = listen<DictionaryEvent>('dictionary', (event) => {
      setLookups((prev) => [event.payload, ...prev].slice(0, MAX_LOG_ENTRIES))
    })
    return () => {
      unlisten.then((fn) => fn())
    }
  }, [])

  useEffect(() => {
    Promise.all([
      invoke<SoundData | null>('get_sound_cmd', { soundType: 'first' }),
      invoke<SoundData | null>('get_sound_cmd', { soundType: 'remaining' }),
    ])
      .then(([first, remaining]) => {
        setNewChatterSound(first)
        setReturningChatterSound(remaining)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    const unlisten = listen<ChatMessageEvent>('chat_message', (event) => {
      const { username } = event.payload
      const seenUsers = seenUsersRef.current
      const isNew = !seenUsers.has(username)
      const soundUrl = isNew
        ? newChatterSound?.data_url
        : returningChatterSound?.data_url
      const volume = isNew ? newChatterVolume : returningChatterVolume
      seenUsers.add(username)
      if (soundUrl) {
        const audio = new Audio(soundUrl)
        audio.volume = volume
        audio.play().catch(() => {})
      }
    })
    return () => {
      unlisten.then((fn) => fn())
    }
  }, [
    newChatterSound,
    returningChatterSound,
    newChatterVolume,
    returningChatterVolume,
  ])

  async function fetchStatus() {
    try {
      const chatStatus = await invoke<ChatStatus>('get_chat_status_cmd')
      setStatus(chatStatus)
    } catch (e) {
      console.error('Failed to get chat status:', e)
    }
  }

  async function handleStartStop() {
    try {
      if (status.is_running) {
        await invoke('stop_chat_listener_cmd')
      } else {
        await invoke('start_chat_listener_cmd', {
          targetChannel: status.last_target_channel ?? null,
        })
      }
      setTimeout(fetchStatus, 500)
    } catch (e) {
      console.error('Failed to toggle listener:', e)
    }
  }

  async function handleLogout() {
    try {
      await invoke('clear_stored_token_cmd')
      navigate({ to: '/login' })
    } catch (e) {
      console.error('Logout failed:', e)
    }
  }

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <svg
            className='animate-spin h-8 w-8 text-[#8d78fd] mx-auto mb-4'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
              fill='none'
            />
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            />
          </svg>
          <p className='text-gray-400'>Loading...</p>
        </div>
      </div>
    )
  }

  const navLinkClass = cx(
    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
    'text-gray-400 hover:text-white hover:bg-white/5',
    'data-[status=active]:text-white data-[status=active]:bg-white/10'
  )

  return (
    <div className='flex h-screen'>
      {/* Sidebar */}
      <aside className='w-56 shrink-0 flex flex-col fixed inset-y-0 left-0 z-10 border-r border-white/10 bg-black/20 backdrop-blur-sm'>
        {/* Logo */}
        <div className='flex items-center gap-2 px-4 h-14 border-b border-white/10 shrink-0'>
          <AppIcon className='w-6 h-6 shrink-0' />
          <span className='font-bold gradient-text'>streaid</span>
        </div>

        {/* Nav */}
        <nav className='flex-1 p-3 space-y-1'>
          <Link to='/dashboard' className={navLinkClass}>
            Dashboard
          </Link>
          <Link to='/config' className={navLinkClass}>
            Config
          </Link>
          <Link to='/log' className={navLinkClass}>
            Log
          </Link>
        </nav>

        {/* Bottom: user + actions */}
        <div className='p-3 border-t border-white/10 space-y-3'>
          {username && (
            <div className='flex items-center gap-2 px-1'>
              <div
                className={cx(
                  'w-7 h-7 rounded-full shrink-0',
                  'bg-gradient-to-br from-[#8d78fd] to-[#6534ed]',
                  'flex items-center justify-center',
                  'text-white text-xs font-bold'
                )}
              >
                {username.charAt(0).toUpperCase()}
              </div>
              <span className='text-sm text-gray-300 truncate'>{username}</span>
            </div>
          )}

          <Button
            variant={status.is_running ? 'destructive' : 'primary'}
            size='sm'
            onClick={handleStartStop}
            className='w-full'
          >
            {status.is_running ? '● Stop' : 'Start Listening'}
          </Button>

          <Button
            variant='secondary'
            size='sm'
            onClick={handleLogout}
            className='w-full'
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content — offset by sidebar width */}
      <main className='flex-1 ml-56 overflow-y-auto'>
        <LogContext.Provider
          value={{
            translations,
            lookups,
            clearTranslations: () => setTranslations([]),
            clearLookups: () => setLookups([]),
          }}
        >
          <SoundContext.Provider
            value={{
              newChatterSound,
              returningChatterSound,
              setNewChatterSound,
              setReturningChatterSound,
              newChatterVolume,
              returningChatterVolume,
              setNewChatterVolume,
              setReturningChatterVolume,
            }}
          >
            <Outlet />
          </SoundContext.Provider>
        </LogContext.Provider>
      </main>
    </div>
  )
}
