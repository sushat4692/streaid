import React from 'react';

type Props = {
  status: 'ok' | 'pending' | 'error';
  children?: React.ReactNode;
};

export default function StatusBadge({ status, children }: Props) {
  const cls = status === 'ok' ? 'bg-green-100 text-green-800' : status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${cls}`}>{children}</span>
  );
}
