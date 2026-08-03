type Props = {
  title: string
}

export default function PageHeader({ title }: Props) {
  return (
    <div className='mb-6'>
      <h1 className='text-xl font-semibold text-white'>{title}</h1>
      <div className='mt-2 h-px bg-white/10' />
    </div>
  )
}
