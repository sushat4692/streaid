import { createFileRoute } from '@tanstack/react-router'

import ChatControl from '../../components/ChatControl'
import TranslationSettings from '../../components/TranslationSettings'

export const Route = createFileRoute('/_authenticated/config')({
  component: ConfigPage,
})

function ConfigPage() {
  return (
    <div className='p-6 flex justify-center'>
      <div className='glass-card w-full max-w-2xl p-8 relative z-10 space-y-8'>
        <TranslationSettings />
        <div className='border-t border-white/10' />
        <ChatControl />
      </div>
    </div>
  )
}
