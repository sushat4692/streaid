export type ChatStatus = {
  connected: boolean
  is_running: boolean
  is_enabled: boolean
  channel: string | null
  last_target_channel?: string | null
}

export type BonsaiStatus = {
  enabled: boolean
  server_running: boolean
  binary_found: boolean
  model_found: boolean
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

export type DictionaryEvent = {
  original_user: string
  original_word: string
  word: string
  meaning: string
  examples: string[]
  similar_words: string[]
  timestamp: string
  source_lang: string
  target_lang: string
}

export type ChatMessageEvent = {
  username: string
  message: string
  channel: string
  timestamp: string
}

export type SoundData = {
  data_url: string
  file_name: string
}
