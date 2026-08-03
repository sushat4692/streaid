import { createFileRoute } from '@tanstack/react-router'

import Card from '../../components/Card'
import ChatControl from '../../components/ChatControl'
import OverlaySettings from '../../components/OverlaySettings'
import PageHeader from '../../components/PageHeader'
import SoundSettings from '../../components/SoundSettings'
import TranslationSettings from '../../components/TranslationSettings'

export const Route = createFileRoute('/_authenticated/config')({
  component: ConfigPage,
})

function ConfigPage() {
  return (
    <div className='p-6 flex justify-center'>
      <div className='w-full max-w-2xl space-y-4'>
        <PageHeader title='Config' />
        <Card>
          <TranslationSettings />
          <div className='border-t border-white/10' />
          <ChatControl />
          <div className='border-t border-white/10' />
          <SoundSettings />
          <div className='border-t border-white/10' />
          <OverlaySettings />
        </Card>
      </div>
    </div>
  )
}
