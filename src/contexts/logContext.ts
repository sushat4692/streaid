import { createContext, useContext } from 'react'

import type { DictionaryEvent, TranslationEvent } from '../types/chat'

export type LogContextValue = {
  translations: TranslationEvent[]
  lookups: DictionaryEvent[]
  clearTranslations: () => void
  clearLookups: () => void
}

export const LogContext = createContext<LogContextValue>({
  translations: [],
  lookups: [],
  clearTranslations: () => {},
  clearLookups: () => {},
})

export function useLogContext() {
  return useContext(LogContext)
}
