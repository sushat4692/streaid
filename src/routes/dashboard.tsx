import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { invoke } from '@tauri-apps/api/core'
import cx from 'classnames'
import { useState, useEffect } from 'react'

import Button from '../components/Button'
import ChatControl from '../components/ChatControl'
import DictionaryLog from '../components/DictionaryLog'
import TranslationLog from '../components/TranslationLog'
import TranslationSettings from '../components/TranslationSettings'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

type TokenInfo = {
  access_token: string
  login?: string
  user_id?: string
}

function DashboardPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
            className='animate-spin h-8 w-8 text-purple-500 mx-auto mb-4'
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
          <p className='text-gray-400'>読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-6'>
      <div className='glass-card w-full max-w-2xl p-8 relative z-10'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-2xl font-bold gradient-text'>Dashboard</h1>
            <p className='text-gray-400 text-sm mt-1'>Twitch チャット翻訳</p>
          </div>
          <Button variant='secondary' onClick={handleLogout}>
            ログアウト
          </Button>
        </div>

        {/* User info card */}
        <div
          className={cx(
            'p-6 rounded-xl mb-8',
            'bg-white/5 border border-white/10'
          )}
        >
          <div className='flex items-center gap-4'>
            <div
              className={cx(
                'w-14 h-14 rounded-full',
                'bg-gradient-to-br from-purple-500 to-pink-500',
                'flex items-center justify-center',
                'text-white text-xl font-bold'
              )}
            >
              {username?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div>
              <p className='text-sm text-gray-400'>ログイン中</p>
              <p className='text-xl font-semibold text-[#EFEFF1]'>{username}</p>
            </div>
          </div>
        </div>

        {/* Translation features */}
        <div className='space-y-8'>
          <TranslationSettings />

          <div className='border-t border-white/10' />

          <ChatControl />

          <div className='border-t border-white/10' />

          <TranslationLog />

          <div className='border-t border-white/10' />

          <DictionaryLog />
        </div>
      </div>
    </div>
  )
}
