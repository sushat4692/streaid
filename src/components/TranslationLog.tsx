import { Accordion } from '@base-ui/react/accordion'
import { listen } from '@tauri-apps/api/event'
import cx from 'classnames'
import { useState, useEffect } from 'react'

import type { TranslationEvent } from '../types/chat'

const MAX_LOG_ENTRIES = 50

const FORMALITY_COLORS = {
  casual: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  neutral: 'bg-green-500/20 text-green-400 border-green-500/30',
  formal: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
} as const

export default function TranslationLog() {
  const [translations, setTranslations] = useState<TranslationEvent[]>([])

  useEffect(() => {
    const unlisten = listen<TranslationEvent>('translation', (event) => {
      console.log('Translation event received:', event.payload)
      setTranslations((prev) =>
        [event.payload, ...prev].slice(0, MAX_LOG_ENTRIES)
      )
    })

    return () => {
      unlisten.then((fn) => fn())
    }
  }, [])

  if (translations.length === 0) {
    return (
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold text-white'>Translation Log</h3>
        <div className='p-8 rounded-xl bg-white/5 border border-white/10 text-center'>
          <p className='text-gray-500 text-sm'>
            No translations yet. Start the listener and use !ts in chat.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-white'>Translation Log</h3>
        <button
          onClick={() => setTranslations([])}
          className='text-xs text-gray-400 hover:text-white transition'
        >
          Clear
        </button>
      </div>

      <div className='space-y-3 max-h-96 overflow-y-auto'>
        {translations.map((t, idx) => (
          <div
            key={`${t.timestamp}-${idx}`}
            className={cx(
              'p-4 rounded-xl',
              'bg-white/5 border border-white/10',
              'hover:bg-white/10 transition'
            )}
          >
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center gap-2'>
                <span className='text-purple-400 font-medium text-sm'>
                  @{t.original_user}
                </span>
                <span className='text-xs text-gray-500'>
                  {t.source_lang} → {t.target_lang}
                </span>
              </div>
              <span className='text-xs text-gray-500'>
                {new Date(t.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className='space-y-3'>
              <div className='text-sm text-gray-400'>
                <span className='text-gray-600'>Original: </span>
                {t.original_message}
              </div>

              {/* Translation Suggestions (simple list, no accordion) */}
              <div className='text-xs text-gray-600 uppercase tracking-wide mb-2'>
                Translations:
              </div>
              <div className='space-y-2'>
                {t.suggestions.map((suggestion, sidx) => (
                  <div
                    key={sidx}
                    className='flex items-start gap-2 border-l-2 border-white/10 pl-3'
                  >
                    {/* Formality Badge */}
                    <span
                      className={cx(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
                        FORMALITY_COLORS[suggestion.formality],
                        'uppercase tracking-wide flex-shrink-0 mt-0.5'
                      )}
                    >
                      {suggestion.formality}
                    </span>

                    {/* Translation Text */}
                    <p className='text-sm text-white break-words flex-1'>
                      {suggestion.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Linguistic Points (single accordion at the bottom) */}
              <Accordion.Root className='mt-4' defaultValue={['points']}>
                <Accordion.Item
                  value='points'
                  className={cx(
                    'border-l-2 border-white/10 pl-3',
                    'data-[open]:border-purple-500/50 transition-colors'
                  )}
                >
                  <Accordion.Header>
                    <Accordion.Trigger
                      className={cx(
                        'flex items-center gap-1.5 text-xs text-gray-400',
                        'hover:text-white transition cursor-pointer w-full',
                        'group/trigger'
                      )}
                    >
                      <span className='uppercase tracking-wide'>
                        翻訳の根拠
                      </span>
                      <svg
                        className={cx(
                          'w-3 h-3 transition-transform',
                          'group-data-[panel-open]/trigger:rotate-180'
                        )}
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19 9l-7 7-7-7'
                        />
                      </svg>
                      <span className='text-gray-600'>({t.points.length})</span>
                    </Accordion.Trigger>
                  </Accordion.Header>

                  <Accordion.Panel
                    className={cx(
                      'overflow-hidden',
                      'data-[starting-style]:animate-in data-[starting-style]:slide-in-from-top-2',
                      'data-[ending-style]:animate-out data-[ending-style]:slide-out-to-top-2'
                    )}
                  >
                    <ul className='mt-2 space-y-1.5 pl-2 border-l border-white/10'>
                      {t.points.map((point, pidx) => (
                        <li
                          key={pidx}
                          className='text-xs text-gray-400 flex items-start gap-2'
                        >
                          <span className='text-purple-400 mt-0.5 flex-shrink-0'>
                            •
                          </span>
                          <span className='flex-1'>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion.Root>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
