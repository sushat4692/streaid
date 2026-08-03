import { createFileRoute } from '@tanstack/react-router'

import Card from '../../components/Card'
import ModelTest from '../../components/ModelTest'
import PageHeader from '../../components/PageHeader'

export const Route = createFileRoute('/_authenticated/model-test')({
  component: ModelTestPage,
})

function ModelTestPage() {
  return (
    <div className='p-6 flex justify-center'>
      <div className='w-full max-w-3xl'>
        <PageHeader title='Model Test' />
        <Card>
          <ModelTest />
        </Card>
      </div>
    </div>
  )
}
