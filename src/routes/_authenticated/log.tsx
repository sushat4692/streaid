import { createFileRoute } from '@tanstack/react-router'

import DictionaryLog from '../../components/DictionaryLog'
import TranslationLog from '../../components/TranslationLog'

export const Route = createFileRoute('/_authenticated/log')({
  component: LogPage,
})

function LogPage() {
  return (
    <div className='p-6 flex justify-center'>
      <div className='glass-card w-full max-w-2xl p-8 relative z-10 space-y-8'>
        <TranslationLog />
        <div className='border-t border-white/10' />
        <DictionaryLog />
      </div>
    </div>
  )
}
