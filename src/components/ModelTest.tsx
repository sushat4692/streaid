import { invoke } from '@tauri-apps/api/core'
import cx from 'classnames'
import { useState } from 'react'

import type { ModelTestResult } from '../types/chat'

import Button from './Button'

type Provider = 'gemini' | 'bonsai'

type ProviderState = {
  provider: Provider
  label: string
  accent: string
  result?: ModelTestResult
  error?: string
  loading: boolean
}

const INITIAL_PROVIDERS: Record<Provider, ProviderState> = {
  gemini: {
    provider: 'gemini',
    label: 'Gemini 2.5 Flash Lite',
    accent: 'text-emerald-400',
    loading: false,
  },
  bonsai: {
    provider: 'bonsai',
    label: 'Local Model (Bonsai)',
    accent: 'text-[#8d78fd]',
    loading: false,
  },
}

function ResultPanel({ state }: { state: ProviderState }) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col gap-4',
        state.loading && 'opacity-60'
      )}
    >
      <div className='flex items-center justify-between'>
        <span className={cx('text-sm font-semibold', state.accent)}>
          {state.label}
        </span>
        {state.result && (
          <span className='text-xs text-gray-400'>
            {state.result.source_lang} → {state.result.target_lang} ·{' '}
            {(state.result.duration_ms / 1000).toFixed(1)}s
          </span>
        )}
      </div>

      {state.loading && (
        <p className='text-sm text-gray-400 animate-pulse'>
          {state.result ? 'Re-running...' : 'Translating...'}
        </p>
      )}

      {state.error && (
        <div className='p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400'>
          {state.error}
        </div>
      )}

      {state.result && !state.loading && (
        <>
          <div className='space-y-3'>
            {state.result.suggestions.map((s, i) => (
              <div key={i} className='flex items-start gap-3'>
                <span
                  className={cx(
                    'px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide shrink-0 mt-0.5',
                    s.formality === 'casual' && 'bg-blue-500/20 text-blue-300',
                    s.formality === 'neutral' && 'bg-white/10 text-gray-300',
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

          {state.result.points.length > 0 && (
            <div className='pt-3 border-t border-white/10'>
              <p className='text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-2'>
                Linguistic points
              </p>
              <ul className='space-y-1.5'>
                {state.result.points.map((p, i) => (
                  <li key={i} className='text-xs text-gray-400 leading-relaxed'>
                    • {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {!state.result && !state.error && !state.loading && (
        <p className='text-sm text-gray-500'>No result yet</p>
      )}
    </div>
  )
}

export default function ModelTest() {
  const [text, setText] = useState('')
  const [providers, setProviders] = useState(INITIAL_PROVIDERS)

  async function run(provider: Provider) {
    const input = text.trim()
    if (!input) return
    setProviders((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], loading: true, error: undefined },
    }))
    try {
      const result = await invoke<ModelTestResult>('test_translation_cmd', {
        text: input,
        provider,
      })
      setProviders((prev) => ({
        ...prev,
        [provider]: { ...prev[provider], loading: false, result },
      }))
    } catch (e) {
      setProviders((prev) => ({
        ...prev,
        [provider]: { ...prev[provider], loading: false, error: String(e) },
      }))
    }
  }

  async function runBoth() {
    await Promise.all([run('gemini'), run('bonsai')])
  }

  return (
    <div className='glass-card p-6 space-y-5 relative z-10'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-semibold text-white'>Model Comparison</h2>
          <p className='text-xs text-gray-400 mt-1'>
            Translate a sentence with both providers to compare quality and
            speed.
          </p>
        </div>
        <Button
          variant='primary'
          size='sm'
          onClick={runBoth}
          disabled={
            !text.trim() || providers.gemini.loading || providers.bonsai.loading
          }
        >
          Compare Both
        </Button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        placeholder='Enter a sentence in Japanese or English...'
        rows={3}
        className={cx(
          'w-full px-4 py-3 rounded-xl resize-none',
          'bg-white/5 border border-white/10',
          'text-[#EFEFF1] placeholder-[#ADADB8]',
          'outline-none focus:border-[#9146FF] focus:ring-[3px] focus:ring-[#9146FF]/50',
          'focus:bg-white/8 transition-all duration-300 ease-out'
        )}
      />

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <ResultPanel state={providers.gemini} />
        <ResultPanel state={providers.bonsai} />
      </div>
    </div>
  )
}
