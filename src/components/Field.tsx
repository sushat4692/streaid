import { Field as BaseField } from '@base-ui/react/field'
import cx from 'classnames'
import Input, { Props as InputProps } from './Input'

type Props = {
  label: string
  className?: string
} & InputProps

export default function Field({ label, value, onChange, placeholder, className }: Props) {
  return (
    <BaseField.Root className={cx('space-y-1', className)}>
      <BaseField.Label className="block text-sm font-medium text-[#ADADB8] mb-2">
        {label}
      </BaseField.Label>
      <Input value={value} onChange={onChange} placeholder={placeholder} />
    </BaseField.Root>
  )
}
