import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      {/* Fixed background layer — stays put while content scrolls */}
      <div className='fixed inset-0 -z-10 bg-pattern pointer-events-none overflow-hidden'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl' />
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl' />
      </div>
      <Outlet />
    </>
  )
}
