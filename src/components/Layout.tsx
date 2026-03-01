import React from 'react'

type Props = {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <div className='layout min-h-screen flex flex-col bg-gray-50 text-gray-900'>
      <header className='bg-white shadow'>
        <div className='container mx-auto px-4 py-4 flex items-center justify-between'>
          <h1 className='text-xl font-semibold'>streaid</h1>
          <nav className='space-x-4 text-sm text-gray-600'>
            <a href='#' className='hover:text-gray-900'>
              Home
            </a>
            <a href='#' className='hover:text-gray-900'>
              Settings
            </a>
          </nav>
        </div>
      </header>
      <main className='flex-1 container mx-auto px-4 py-8'>{children}</main>
      <footer className='bg-white border-t'>
        <div className='container mx-auto px-4 py-4 text-sm text-gray-500'>
          © streaid
        </div>
      </footer>
    </div>
  )
}
