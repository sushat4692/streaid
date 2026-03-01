import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { invoke } from '@tauri-apps/api/core'
import { useState, useEffect } from 'react'
import cx from 'classnames'
import Button from '../components/Button'
import Field from '../components/Field'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [clientId, setClientId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scopes = ['chat_read']

  async function startDeviceFlow() {
    setIsLoading(true)
    try {
      const info = await invoke('start_device_flow_cmd', { clientId, scopes })
      console.log('startDeviceFlow: received info', info)

      const verificationUri = (info as any)?.verification_uri
      if (verificationUri) {
        try {
          await invoke('plugin:opener|open', { url: verificationUri })
        } catch (e) {
          console.warn('plugin opener failed:', e)
          try {
            await invoke('open_url_cmd', { url: verificationUri })
          } catch (e2) {
            console.warn('open_url_cmd failed:', e2)
            window.open(verificationUri, '_blank')
          }
        }
      }

      // Start polling for auth completion
      pollForToken()
    } catch (e) {
      console.error('startDeviceFlow error', e)
      setIsLoading(false)
    }
  }

  async function pollForToken() {
    const maxAttempts = 60
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const result = await invoke('poll_device_flow_cmd')
        if (result) {
          console.log('Token received:', result)
          navigate({ to: '/dashboard' })
          return
        }
      } catch (e) {
        console.error('Poll error:', e)
      }
      await new Promise((r) => setTimeout(r, 3000))
    }
    setIsLoading(false)
  }

  useEffect(() => {
    // Check if already authenticated
    ;(async () => {
      try {
        const token = await invoke('get_stored_token_cmd')
        if (token) {
          navigate({ to: '/dashboard' })
          return
        }
      } catch (e) {
        console.warn('get_stored_token_cmd failed:', e)
      }

      // Load saved client id
      try {
        const saved = await invoke('get_client_id_cmd')
        if (saved) setClientId(saved as string)
      } catch (e) {
        console.warn('get_client_id_cmd failed:', e)
      }
    })()
  }, [navigate])

  async function saveClientId() {
    try {
      await invoke('set_client_id_cmd', { clientId })
      console.log('Client ID saved')
    } catch (e) {
      console.error('saveClientId failed:', e)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card w-full max-w-md p-8 relative z-10">
        {/* Logo section */}
        <div className="text-center mb-8">
          <div className="logo-float inline-block mb-4">
            <div
              className={cx(
                'w-16 h-16 rounded-2xl',
                'bg-gradient-to-br from-purple-500 to-pink-500',
                'flex items-center justify-center',
                'shadow-lg shadow-purple-500/30'
              )}
            >
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">streaid</h1>
          <p className="text-gray-400 text-sm">Twitch チャット翻訳サポート</p>
        </div>

        {/* Form section */}
        <div className="space-y-6">
          <Field
            label="Client ID"
            value={clientId}
            onChange={setClientId}
            placeholder="Twitch Developer Console から取得"
          />

          <div className="flex gap-3">
            <Button variant="secondary" onClick={saveClientId} className="flex-1">
              保存
            </Button>
            <Button
              variant="primary"
              onClick={startDeviceFlow}
              disabled={isLoading || !clientId}
              className="flex-1"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                  認証待機中...
                </span>
              ) : (
                'Twitch と連携'
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Twitch Developer Console で Application を作成し、
            <br />
            Client ID を入力してください
          </p>
        </div>
      </div>
    </div>
  )
}
