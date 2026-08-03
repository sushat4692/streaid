import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className='min-h-full flex items-center justify-center p-6'>
      <div className='glass-card p-12 text-center relative z-10'>
        <h1 className='text-4xl font-bold gradient-text mb-4'>
          Welcome to Streaid
        </h1>
        <p className='text-gray-400'>
          This app is aiding your streaming. (Strea(m) + aid)
        </p>
      </div>
    </div>
  )
}
