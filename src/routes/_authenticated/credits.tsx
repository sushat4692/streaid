import { createFileRoute } from '@tanstack/react-router'

import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'

export const Route = createFileRoute('/_authenticated/credits')({
  component: CreditsPage,
})

const APP_VERSION = '0.5.0'

type CreditItem = {
  name: string
  role: string
  license: string
  url: string
}

const FRONTEND_CREDITS: CreditItem[] = [
  {
    name: 'React',
    role: 'UI framework',
    license: 'MIT',
    url: 'https://react.dev',
  },
  {
    name: 'TanStack Router',
    role: 'Routing',
    license: 'MIT',
    url: 'https://tanstack.com/router',
  },
  {
    name: 'Tailwind CSS',
    role: 'Styling',
    license: 'MIT',
    url: 'https://tailwindcss.com',
  },
  {
    name: 'Base UI',
    role: 'UI primitives',
    license: 'MIT',
    url: 'https://base-ui.com',
  },
  {
    name: 'Tauri API (JS)',
    role: 'Desktop bridge',
    license: 'MIT / Apache-2.0',
    url: 'https://tauri.app',
  },
]

const BACKEND_CREDITS: CreditItem[] = [
  {
    name: 'Tauri',
    role: 'Desktop shell',
    license: 'MIT / Apache-2.0',
    url: 'https://tauri.app',
  },
  {
    name: 'tokio / tokio-tungstenite',
    role: 'Async runtime / Twitch IRC',
    license: 'MIT',
    url: 'https://tokio.rs',
  },
  {
    name: 'reqwest',
    role: 'HTTP client (Gemini API)',
    license: 'MIT / Apache-2.0',
    url: 'https://github.com/seanmonstar/reqwest',
  },
  {
    name: 'axum',
    role: 'OBS overlay server',
    license: 'MIT',
    url: 'https://github.com/tokio-rs/axum',
  },
  {
    name: 'serde / serde_json',
    role: 'Serialization',
    license: 'MIT / Apache-2.0',
    url: 'https://serde.rs',
  },
  {
    name: 'keyring',
    role: 'OS keychain storage',
    license: 'MIT / Apache-2.0',
    url: 'https://github.com/hwchen/keyring-rs',
  },
  {
    name: 'twitch_api / twitch_oauth2',
    role: 'Twitch API / OAuth',
    license: 'MIT / Apache-2.0',
    url: 'https://github.com/Emilgardis/twitch_api',
  },
]

const MODEL_CREDITS: CreditItem[] = [
  {
    name: 'Bonsai (Ternary) by Prism ML',
    role: 'Local on-device LLM (8B / 4B)',
    license: 'Apache-2.0',
    url: 'https://prismml.com',
  },
  {
    name: 'MLX / mlx-lm (Apple)',
    role: 'Local inference runtime',
    license: 'MIT',
    url: 'https://github.com/ml-explore/mlx-lm',
  },
  {
    name: 'Gemini 3.1 Flash Lite (Google)',
    role: 'Cloud translation API',
    license: 'Google AI terms of service',
    url: 'https://ai.google.dev/gemini-api',
  },
]

function CreditSection({
  title,
  items,
}: {
  title: string
  items: CreditItem[]
}) {
  return (
    <section>
      <h2 className='text-sm font-semibold text-white mb-3'>{title}</h2>
      <ul className='divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden'>
        {items.map((item) => (
          <li
            key={item.name}
            className='flex items-center justify-between gap-4 px-4 py-3 bg-white/5'
          >
            <div className='min-w-0'>
              <a
                href={item.url}
                target='_blank'
                rel='noreferrer'
                className='text-sm text-[#EFEFF1] hover:text-[#A970FF] transition-colors'
              >
                {item.name}
              </a>
              <p className='text-xs text-gray-500 mt-0.5'>{item.role}</p>
            </div>
            <span className='px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-400 shrink-0'>
              {item.license}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function CreditsPage() {
  return (
    <div className='p-6 flex justify-center'>
      <div className='w-full max-w-2xl'>
        <PageHeader title='Credits' />
        <Card>
          <section>
            <h2 className='text-sm font-semibold text-white mb-2'>Streaid</h2>
            <p className='text-sm text-gray-400'>
              Version {APP_VERSION} — Tauri + React desktop app for Twitch chat
              translation and dictionary lookup.
            </p>
            <p className='text-xs text-gray-500 mt-2'>
              This app is aiding your streaming. (Strea(m) + aid)
            </p>
          </section>

          <CreditSection title='AI Models & Providers' items={MODEL_CREDITS} />
          <CreditSection title='Frontend Libraries' items={FRONTEND_CREDITS} />
          <CreditSection
            title='Backend Libraries (Rust)'
            items={BACKEND_CREDITS}
          />

          <section>
            <h2 className='text-sm font-semibold text-white mb-2'>
              License Notes
            </h2>
            <p className='text-xs text-gray-500 leading-relaxed'>
              All dependencies are permissively licensed (MIT / Apache-2.0 /
              BSD) and no copyleft (GPL/AGPL) libraries are used. The local
              Bonsai models are Apache-2.0 and are downloaded separately at
              runtime via{' '}
              <code className='font-mono'>scripts/setup-bonsai.sh</code>. Cloud
              calls to the Gemini API are governed by Google's AI terms of
              service.
            </p>
          </section>
        </Card>
      </div>
    </div>
  )
}
