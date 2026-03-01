import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import Field from './Field'
import Button from './Button'

export default function TranslationSettings() {
  const [apiKey, setApiKey] = useState('')
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Load saved key (masked)
    invoke<string | null>('get_gemini_api_key_cmd')
      .then(setSavedKey)
      .catch(console.error)
  }, [])

  async function saveApiKey() {
    setIsSaving(true)
    try {
      await invoke('set_gemini_api_key_cmd', { apiKey })
      setSavedKey('***...***')
      setApiKey('')
      console.log('API key saved')
    } catch (e) {
      console.error('Failed to save API key:', e)
      alert('Failed to save API key. Check console for details.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Translation Settings</h3>

      {savedKey ? (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <p className="text-sm text-green-400">✓ Gemini API Key configured</p>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-sm text-yellow-400">
            ⚠ Please configure your Gemini API key
          </p>
        </div>
      )}

      <Field
        label="Gemini API Key"
        type="password"
        value={apiKey}
        onChange={setApiKey}
        placeholder="Enter your Gemini API key"
      />

      <Button
        variant="primary"
        onClick={saveApiKey}
        disabled={!apiKey || isSaving}
      >
        {isSaving ? 'Saving...' : 'Save API Key'}
      </Button>

      <div className="text-xs text-gray-500 space-y-1">
        <p>
          Get your API key from{' '}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            Google AI Studio
          </a>
        </p>
        <p>Uses Gemini 1.5 Flash model (free tier supported)</p>
        <p className="text-gray-600">Used for translating Japanese ↔ English chat messages</p>
      </div>
    </div>
  )
}
