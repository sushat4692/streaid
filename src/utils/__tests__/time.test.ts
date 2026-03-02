import { describe, it, expect } from 'vitest'

import { formatTime } from '../time'

describe('formatTime', () => {
  it('returns a non-empty string for a valid ISO timestamp', () => {
    const result = formatTime('2024-01-15T10:30:00.000Z')
    expect(result).toBeTypeOf('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('includes hours and minutes in the output', () => {
    const result = formatTime('2024-01-15T10:30:00.000Z')
    // toLocaleTimeString always includes ":" separator
    expect(result).toContain(':')
  })

  it('handles an RFC3339 timestamp from Rust chrono', () => {
    // Matches what Rust's chrono::Utc::now().to_rfc3339() produces
    const result = formatTime('2024-06-01T08:00:00+00:00')
    expect(result).toBeTypeOf('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
