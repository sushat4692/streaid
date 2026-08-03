type Props = {
  children: React.ReactNode
  className?: string
}

export default function Card({ children, className }: Props) {
  return (
    <div className={`glass-card p-8 space-y-8 ${className ?? ''}`}>
      {children}
    </div>
  )
}
