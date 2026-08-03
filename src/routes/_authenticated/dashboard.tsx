import { createFileRoute } from '@tanstack/react-router'

import ModelTest from '../../components/ModelTest'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className='min-h-full p-6 space-y-6'>
      <div>
        <h1 className='text-2xl font-bold gradient-text'>Dashboard</h1>
        <p className='text-gray-400 mt-1'>
          Compare translation quality between the cloud Gemini API and the local
          model — no Twitch chat needed.
        </p>
      </div>
      <ModelTest />
    </div>
  )
}
