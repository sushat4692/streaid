export type ChatStatus = {
  connected: boolean
  is_running: boolean
  is_enabled: boolean
  channel: string | null
  last_target_channel?: string | null
}

export type TranslationSuggestion = {
  text: string
  formality: 'casual' | 'neutral' | 'formal'
}

export type TranslationEvent = {
  original_user: string
  original_message: string
  suggestions: TranslationSuggestion[]
  points: string[]
  timestamp: string
  source_lang: string
  target_lang: string
}
