import { createContext, useContext } from 'react'

import type { SoundData } from '../types/chat'

export type SoundContextValue = {
  newChatterSound: SoundData | null
  returningChatterSound: SoundData | null
  setNewChatterSound: (s: SoundData | null) => void
  setReturningChatterSound: (s: SoundData | null) => void
  newChatterVolume: number
  returningChatterVolume: number
  setNewChatterVolume: (v: number) => void
  setReturningChatterVolume: (v: number) => void
}

export const SoundContext = createContext<SoundContextValue>({
  newChatterSound: null,
  returningChatterSound: null,
  setNewChatterSound: () => {},
  setReturningChatterSound: () => {},
  newChatterVolume: 1,
  returningChatterVolume: 1,
  setNewChatterVolume: () => {},
  setReturningChatterVolume: () => {},
})

export function useSoundContext() {
  return useContext(SoundContext)
}
