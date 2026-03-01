import React from 'react';

type Variant = 'primary' | 'secondary' | 'destructive';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const variantClasses: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
};

export default function Button({ variant = 'primary', className = '', children, ...rest }: Props) {
  return (
    <button className={`px-4 py-2 rounded ${variantClasses[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
