import { createFileRoute } from '@tanstack/react-router'

import Card from '../../components/Card'
import DictionaryLog from '../../components/DictionaryLog'
import PageHeader from '../../components/PageHeader'
import TranslationLog from '../../components/TranslationLog'

export const Route = createFileRoute('/_authenticated/log')({
  component: LogPage,
})

function LogPage() {
  return (
    <div className='p-6 flex justify-center'>
      <div className='w-full max-w-2xl space-y-4'>
        <PageHeader title='Log' />
        <Card>
          <TranslationLog />
          <div className='border-t border-white/10' />
          <DictionaryLog />
        </Card>
      </div>
    </div>
  )
}
