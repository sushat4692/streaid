import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { invoke } from '@tauri-apps/api/core'
import { useState, useEffect } from 'react'
import cx from 'classnames'
import Button from '../components/Button'

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-purple-500 mx-auto mb-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card w-full max-w-lg p-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Twitch チャット翻訳</p>
          </div>
          <Button variant="secondary" onClick={handleLogout}>
            ログアウト
          </Button>
        </div>

        {/* User info card */}
        <div
          className={cx(
            'p-6 rounded-xl',
            'bg-white/5 border border-white/10'
          )}
        >
          <div className="flex items-center gap-4">
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
              <p className="text-sm text-gray-400">ログイン中</p>
              <p className="text-xl font-semibold text-[#EFEFF1]">{username}</p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <p className="text-green-400 text-sm font-medium">
              Twitch に接続中
            </p>
          </div>
        </div>

        {/* Placeholder for future features */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>翻訳機能は準備中です</p>
        </div>
      </div>
    </div>
  )
}
