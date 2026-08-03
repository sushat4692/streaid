import { invoke } from '@tauri-apps/api/core'
import cx from 'classnames'
import { useState } from 'react'

import type { ModelTestResult } from '../types/chat'

import Button from './Button'

type Provider = 'gemini' | 'bonsai-8b' | 'bonsai-4b'
type Mode = 'ts' | 'd'

const PROVIDERS: { id: Provider; label: string; description: string }[] = [
  {
    id: 'gemini',
    label: 'Gemini 2.5 Flash Lite',
    description: 'Cloud API',
  },
  {
    id: 'bonsai-8b',
    label: 'Local Model 8B',
    description: 'On-device, offline',
  },
  {
    id: 'bonsai-4b',
    label: 'Local Model 4B',
    description: 'On-device, lighter',
  },
]

const MODES: { id: Mode; label: string }[] = [
  { id: 'ts', label: '!ts 翻訳' },
  { id: 'd', label: '!d 辞書' },
]

function Switch<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className='flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10'>
      {options.map((o) => (
        <button
          key={o.id}
          type='button'
          onClick={() => onChange(o.id)}
          className={cx(
            'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
            value === o.id
              ? 'bg-[#9146FF]/20 text-white ring-1 ring-[#9146FF]/40'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function ModelTest() {
  const [provider, setProvider] = useState<Provider>('gemini')
  const [mode, setMode] = useState<Mode>('ts')
  const [text, setText] = useState('')
  const [result, setResult] = useState<ModelTestResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function resetResult() {
    setResult(null)
    setError(null)
  }

  async function run() {
    const input = text.trim()
    if (!input || loading) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await invoke<ModelTestResult>('test_model_cmd', {
        text: input,
        provider,
        mode,
      })
      setResult(res)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const providerLabel = PROVIDERS.find((p) => p.id === provider)?.label

  return (
    <div className='glass-card p-6 space-y-5 relative z-10'>
      {/* Provider switch */}
      <Switch
        options={PROVIDERS}
        value={provider}
        onChange={(v) => {
          setProvider(v)
          resetResult()
        }}
      />

      {/* Mode switch */}
      <Switch
        options={MODES}
        value={mode}
        onChange={(v) => {
          setMode(v)
          resetResult()
        }}
      />

      <textarea
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        placeholder={
          mode === 'ts'
            ? 'Enter a sentence in Japanese or English...'
            : 'Enter a word in Japanese or English...'
        }
        rows={3}
        className={cx(
          'w-full px-4 py-3 rounded-xl resize-none',
          'bg-white/5 border border-white/10',
          'text-[#EFEFF1] placeholder-[#ADADB8]',
          'outline-none focus:border-[#9146FF] focus:ring-[3px] focus:ring-[#9146FF]/50',
          'focus:bg-white/8 transition-all duration-300 ease-out'
        )}
      />

      <div className='flex items-center justify-between gap-3'>
        <p className='text-xs text-gray-500'>
          {provider.startsWith('bonsai')
            ? 'Requires the Local Model toggle to be enabled in Chat Listener'
            : 'Uses your Gemini API key'}
        </p>
        <Button
          variant='primary'
          onClick={run}
          disabled={!text.trim() || loading}
        >
          {loading ? 'Working...' : mode === 'ts' ? 'Translate' : 'Lookup'}
        </Button>
      </div>

      {error && (
        <div className='p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400'>
          {error}
        </div>
      )}

      {result && !loading && (
        <div className='rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-semibold text-[#EFEFF1]'>
              {providerLabel} · {result.mode === 'ts' ? '!ts' : '!d'}
            </span>
            <span className='text-xs text-gray-400'>
              {result.source_lang} → {result.target_lang} ·{' '}
              {(result.duration_ms / 1000).toFixed(1)}s
            </span>
          </div>

          {result.mode === 'ts' ? (
            <>
              <div className='space-y-3'>
                {result.suggestions.map((s, i) => (
                  <div key={i} className='flex items-start gap-3'>
                    <span
                      className={cx(
                        'px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide shrink-0 mt-0.5',
                        s.formality === 'casual' &&
                          'bg-blue-500/20 text-blue-300',
                        s.formality === 'neutral' &&
                          'bg-white/10 text-gray-300',
                        s.formality === 'formal' &&
                          'bg-purple-500/20 text-purple-300'
                      )}
                    >
                      {s.formality}
                    </span>
                    <span className='text-sm text-[#EFEFF1]'>{s.text}</span>
                  </div>
                ))}
              </div>

              {result.points.length > 0 && (
                <div className='pt-3 border-t border-white/10'>
                  <p className='text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-2'>
                    Linguistic points
                  </p>
                  <ul className='space-y-1.5'>
                    {result.points.map((p, i) => (
                      <li
                        key={i}
                        className='text-xs text-gray-400 leading-relaxed'
                      >
                        • {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <p className='text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1'>
                  Meaning
                </p>
                <p className='text-sm text-[#EFEFF1] leading-relaxed'>
                  {result.meaning}
                </p>
              </div>

              {result.examples.length > 0 && (
                <div className='pt-3 border-t border-white/10'>
                  <p className='text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-2'>
                    Examples
                  </p>
                  <ul className='space-y-1.5'>
                    {result.examples.map((ex, i) => (
                      <li
                        key={i}
                        className='text-xs text-gray-400 leading-relaxed'
                      >
                        • {ex}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.similar_words.length > 0 && (
                <div className='pt-3 border-t border-white/10'>
                  <p className='text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-2'>
                    Similar words
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {result.similar_words.map((w, i) => (
                      <span
                        key={i}
                        className='px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300'
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
