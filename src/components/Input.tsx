import { Input as BaseInput } from '@base-ui/react/input';

export type Props = {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
}

export default function Input({ value, onChange, placeholder }: Props) {
  return <BaseInput value={value} onChange={(e) => onChange && onChange(e.currentTarget.value)} placeholder={placeholder} className="mt-1 block w-full border rounded px-3 py-2" />;
}