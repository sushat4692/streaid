import { describe, it, expect } from 'vitest'
import { getInitial } from '../string'

describe('getInitial', () => {
  it('returns uppercase first letter for a normal username', () => {
    expect(getInitial('streamer')).toBe('S')
  })

  it('already-uppercase input stays uppercase', () => {
    expect(getInitial('Alice')).toBe('A')
  })

  it('works for a single character', () => {
    expect(getInitial('x')).toBe('X')
  })

  it('returns empty string for empty input', () => {
    expect(getInitial('')).toBe('')
  })

  it('handles numeric usernames', () => {
    expect(getInitial('123user')).toBe('1')
  })
})
