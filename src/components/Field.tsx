import { Field as BaseField } from '@base-ui/react/field'
import Input, { Props as InputProps } from './Input'

type Props = {
  label: string
} & InputProps

export default function Field({ label, value, onChange, placeholder }: Props) {
  return (
    <BaseField.Root>
      <BaseField.Label className='block text-sm font-medium'>
        {label}
      </BaseField.Label>
      <Input value={value} onChange={onChange} placeholder={placeholder} />
    </BaseField.Root>
  )
}
