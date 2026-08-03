export type ChatStatus = {
  connected: boolean
  is_running: boolean
  is_enabled: boolean
  channel: string | null
  last_target_channel?: string | null
}

export type BonsaiModelStatus = {
  name: '8b' | '4b'
  running: boolean
  model_found: boolean
}

export type BonsaiStatus = {
  enabled: boolean
  binary_found: boolean
  active_model: '8b' | '4b'
  models: BonsaiModelStatus[]
}

export type ModelTestResult =
  | {
      mode: 'ts'
      source_lang: string
      target_lang: string
      suggestions: TranslationSuggestion[]
      points: string[]
      duration_ms: number
    }
  | {
      mode: 'd'
      source_lang: string
      target_lang: string
      word: string
      meaning: string
      examples: string[]
      similar_words: string[]
      duration_ms: number
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
