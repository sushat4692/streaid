import { Button as BaseButton } from '@base-ui/react/button'
import cx from 'classnames'

type Variant = 'primary' | 'secondary' | 'destructive'
type Size = 'sm' | 'md'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-6 py-3 rounded-xl',
}

const baseStyles =
  'font-medium transition-all duration-300 ease-out cursor-pointer'

const variantStyles: Record<Variant, string> = {
  primary: cx(
    'bg-[#9146FF] text-white font-semibold',
    'shadow-[0_4px_14px_0_rgba(145,70,255,0.39)]',
    'hover:bg-[#A970FF] hover:shadow-[0_8px_25px_0_rgba(145,70,255,0.5)]',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ),
  secondary: cx(
    'bg-white/10 text-[#EFEFF1]',
    'border border-white/10',
    'hover:bg-white/15 hover:border-white/20'
  ),
  destructive: cx('bg-red-500/80 text-white', 'hover:bg-red-500'),
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: Props) {
  return (
    <BaseButton
      className={cx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...rest}
    >
      {children}
    </BaseButton>
  )
}
