type Props = {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
};

export default function Field({ label, value, onChange, placeholder }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <input value={value} onChange={(e) => onChange && onChange(e.currentTarget.value)} placeholder={placeholder} className="mt-1 block w-full border rounded px-3 py-2" />
    </div>
  );
}
