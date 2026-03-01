import React from 'react';

type Props = {
  children?: React.ReactNode;
};

export default function AuthCard({ children }: Props) {
  return (
    <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-1">
          <h2 className="text-lg font-medium">Twitch Device Flow (Dev)</h2>
          <p className="text-sm text-gray-500 mt-1">Use the device code flow to authenticate with Twitch.</p>
        </div>
        <div className="col-span-1">{children}</div>
      </div>
    </div>
  );
}
