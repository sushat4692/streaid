import { Accordion } from '@base-ui/react/accordion'
import cx from 'classnames'

import { useLogContext } from '../contexts/logContext'

export default function DictionaryLog() {
  const { lookups, clearLookups } = useLogContext()

  if (lookups.length === 0) {
    return (
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold text-white'>Dictionary Log</h3>
        <div className='p-8 rounded-xl bg-white/5 border border-white/10 text-center'>
          <p className='text-gray-500 text-sm'>
            No lookups yet. Use !d word in chat.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-white'>Dictionary Log</h3>
        <button
          onClick={clearLookups}
          className='text-xs text-gray-400 hover:text-white transition'
        >
          Clear
        </button>
      </div>

      <div className='space-y-3 max-h-96 overflow-y-auto'>
        {lookups.map((lookup, idx) => (
          <div
            key={`${lookup.timestamp}-${idx}`}
            className={cx(
              'p-4 rounded-xl',
              'bg-white/5 border border-white/10',
              'hover:bg-white/10 transition'
            )}
          >
            {/* Header */}
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center gap-2'>
                <span className='text-purple-400 font-medium text-sm'>
                  @{lookup.original_user}
                </span>
                <span className='text-xs text-gray-500'>
                  {lookup.source_lang} → {lookup.target_lang}
                </span>
              </div>
              <span className='text-xs text-gray-500'>
                {new Date(lookup.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {/* Word */}
            <div className='mb-3'>
              <span className='text-xl font-bold text-white'>
                {lookup.word}
              </span>
              <span className='text-xs text-gray-500 ml-2'>(Dictionary)</span>
            </div>

            {/* Meaning */}
            <div className='mb-3 p-3 rounded-lg bg-white/5 border-l-2 border-blue-500/50'>
              <div className='text-xs text-blue-400 uppercase tracking-wide mb-1'>
                Meaning
              </div>
              <p className='text-sm text-gray-300'>{lookup.meaning}</p>
            </div>

            {/* Accordion for Examples & Similar Words */}
            <Accordion.Root className='space-y-2' defaultValue={['examples']}>
              {/* Examples */}
              <Accordion.Item
                value='examples'
                className={cx(
                  'border-l-2 border-white/10 pl-3',
                  'data-[open]:border-green-500/50 transition-colors'
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
                      例文 (Examples)
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
                    <span className='text-gray-600'>
                      ({lookup.examples.length})
                    </span>
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
                    {lookup.examples.map((example, eidx) => (
                      <li
                        key={eidx}
                        className='text-xs text-gray-400 flex items-start gap-2'
                      >
                        <span className='text-green-400 mt-0.5 flex-shrink-0'>
                          {eidx + 1}.
                        </span>
                        <span className='flex-1'>{example}</span>
                      </li>
                    ))}
                  </ul>
                </Accordion.Panel>
              </Accordion.Item>

              {/* Similar Words */}
              <Accordion.Item
                value='similar'
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
                      類義語 (Synonyms)
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
                    <span className='text-gray-600'>
                      ({lookup.similar_words.length})
                    </span>
                  </Accordion.Trigger>
                </Accordion.Header>

                <Accordion.Panel
                  className={cx(
                    'overflow-hidden',
                    'data-[starting-style]:animate-in data-[starting-style]:slide-in-from-top-2',
                    'data-[ending-style]:animate-out data-[ending-style]:slide-out-to-top-2'
                  )}
                >
                  <div className='mt-2 pl-2 border-l border-white/10'>
                    <p className='text-xs text-gray-400'>
                      {lookup.similar_words.join(', ')}
                    </p>
                  </div>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion.Root>
          </div>
        ))}
      </div>
    </div>
  )
}
