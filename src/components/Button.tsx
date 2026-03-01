import { Button as BaseButton } from '@base-ui/react/button'
import cx from 'classnames'

type Variant = 'primary' | 'secondary' | 'destructive'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

const baseStyles = 'px-6 py-3 rounded-xl font-medium transition-all duration-300 ease-out'

const variantStyles: Record<Variant, string> = {
  primary: cx(
    'bg-gradient-to-br from-[#9146FF] to-[#772CE8]',
    'text-white font-semibold',
    'shadow-[0_4px_14px_0_rgba(145,70,255,0.39)]',
    'hover:from-[#A970FF] hover:to-[#9146FF]',
    'hover:shadow-[0_8px_25px_0_rgba(145,70,255,0.5)]',
    'hover:-translate-y-0.5',
    'active:translate-y-0',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0'
  ),
  secondary: cx(
    'bg-white/10 text-[#EFEFF1]',
    'border border-white/10',
    'hover:bg-white/15 hover:border-white/20'
  ),
  destructive: cx(
    'bg-red-500/80 text-white',
    'hover:bg-red-500'
  ),
}

export default function Button({
  variant = 'primary',
  className,
  children,
  ...rest
}: Props) {
  return (
    <BaseButton
      className={cx(baseStyles, variantStyles[variant], className)}
      {...rest}
    >
      {children}
    </BaseButton>
  )
}
