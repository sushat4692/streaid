# Dictionary Feature Testing Guide

## Pre-Testing Checklist

Before testing the dictionary feature, ensure:

- [ ] Gemini API key is configured in keyring
- [ ] Twitch authentication is complete
- [ ] Translation toggle is **enabled** (controls both `!ts` and `!d`)
- [ ] Application is running in dev mode: `pnpm tauri dev`
- [ ] Connected to a Twitch channel with active chat

---

## Test Cases

### 1. Basic English → Japanese Dictionary Lookup

**Command:** `!d apple`

**Expected Backend Logs:**
```
Dictionary request: apple
Dictionary result: DictionaryResult { word: "apple", meaning: "りんご。バラ科...", ... }
Sent meaning to chat
Sent examples to chat
Sent similar words to chat
```

**Expected Chat Messages (3 messages):**
1. `@username: [Dict] apple - りんご。バラ科リンゴ属の落葉高木、またはその果実。`
2. `@username: [Examples] I eat an apple every day. (私は毎日りんごを食べます) | This apple is very sweet. (このりんごはとても甘い) | ...`
3. `@username: [Synonyms] fruit, pome, malus, orchard fruit, crabapple`

**Expected UI (DictionaryLog component):**
- New entry appears at top
- Word displayed with "(Dictionary)" label
- Meaning in blue-bordered box
- Examples accordion (default open)
- Synonyms accordion (can expand)

---

### 2. Basic Japanese → English Dictionary Lookup

**Command:** `!d りんご`

**Expected Backend Logs:**
```
Dictionary request: りんご
Dictionary result: DictionaryResult { word: "りんご", meaning: "Apple. A deciduous tree...", ... }
...
```

**Expected Chat Messages:**
1. `@username: [Dict] りんご - Apple. A deciduous tree of the genus Malus in the family Rosaceae, or its fruit.`
2. `@username: [Examples] 毎日りんごを食べます (I eat an apple every day) | このりんごは甘い (This apple is sweet) | ...`
3. `@username: [Synonyms] 林檎, 苹果, fruit, apple fruit, malus`

**Expected UI:**
- Entry appears with Japanese word
- English meaning displayed
- Examples with Japanese sentences

---

### 3. Single Word Extraction (Multi-word Input)

**Command:** `!d apple pie recipe`

**Expected Behavior:**
- Only "apple" is looked up
- "pie" and "recipe" are ignored
- Same result as Test Case #1

**Backend Log Should Show:**
```
Dictionary request: apple
```

---

### 4. Simple Word vs Complex Word

**Test Simple:** `!d run`
**Test Complex:** `!d serendipity`

**Expected:**
- Both should return appropriate meanings
- Simple word: shorter meaning, common synonyms
- Complex word: longer meaning, more sophisticated synonyms

---

### 5. Toggle Disabled

**Setup:** Disable translation toggle in UI

**Command:** `!d hello`

**Expected Behavior:**
- No backend logs for dictionary processing
- No chat messages sent
- No UI updates
- Command is completely ignored

---

### 6. Japanese Kanji Word

**Command:** `!d 勉強`

**Expected:**
- Detects as Japanese
- Returns English definition
- Examples with both kanji and English translations
- Synonyms may include related kanji words

---

### 7. Long Definition Truncation

**Command:** `!d philosophy` (or another word with long definition)

**Expected:**
- If meaning exceeds ~470 chars, it gets truncated with "..."
- Uses `floor_char_boundary()` for safe UTF-8 truncation
- No panic/crash
- Chat message stays under 500 chars

---

### 8. Unknown Word

**Command:** `!d asdfghjkl`

**Expected:**
- Gemini may return "Unknown word" or attempt to explain
- Should not crash
- UI should display whatever Gemini returns

---

### 9. Both Commands in Quick Succession

**Commands:**
```
!ts こんにちは
!d hello
```

**Expected:**
- Translation processes first (4 messages)
- Dictionary processes after (3 messages)
- Both appear in their respective UI logs
- No interference between features

---

### 10. Stress Test - Rapid Fire

**Commands:** (Send rapidly)
```
!d apple
!d orange
!d banana
```

**Expected:**
- All three should process
- May have delays due to API rate limits
- All should appear in UI log
- Max 50 entries retained (oldest removed)

---

## Edge Cases to Watch For

### Error Scenarios

1. **No Gemini API Key**
   - Backend log: `No Gemini API key configured`
   - Command silently skipped

2. **API Error**
   - Backend log: `Dictionary lookup failed: ...`
   - No chat messages sent
   - No UI update

3. **Unknown Language**
   - Backend log: `Unknown language, skipping`
   - Command ignored

4. **Empty Word After Extraction**
   - Command: `!d    ` (only spaces)
   - Should be ignored by `extract_dictionary_word()`

---

## UI Verification Checklist

After successful lookups, verify in DictionaryLog:

- [ ] Entries appear in reverse chronological order (newest first)
- [ ] Word is displayed prominently
- [ ] "(Dictionary)" label is visible
- [ ] Meaning has blue border styling
- [ ] Examples accordion exists and opens/closes
- [ ] Synonyms accordion exists and opens/closes
- [ ] Examples are separated by " | " pipe character
- [ ] Synonyms are comma-separated
- [ ] Timestamp is present (displayed or in data)
- [ ] "Clear" button removes all entries
- [ ] Max 50 entries enforced (51st lookup removes oldest)

---

## Performance Checks

- [ ] No visible lag in UI when event received
- [ ] Chat messages appear with ~500ms delay between them
- [ ] No memory leaks after many lookups
- [ ] Console shows no errors in browser DevTools

---

## Debugging Tips

### If dictionary doesn't respond:

1. Check backend terminal for logs starting with "Dictionary request:"
2. Verify toggle is enabled (green)
3. Check Gemini API key: Should see log if missing
4. Verify IRC connection is active
5. Check for "Unknown language, skipping" log

### If chat messages don't appear:

1. Look for "Failed to send" errors in backend logs
2. Verify IRC connection is stable
3. Check Twitch chat rate limits (should be fine with 500ms delays)

### If UI doesn't update:

1. Open browser DevTools console
2. Look for "Dictionary event received:" log
3. Check if event payload is correct
4. Verify DictionaryLog component is mounted (visible on page)

---

## Success Criteria

✅ **Feature is working correctly if:**

1. English words return Japanese definitions
2. Japanese words return English definitions
3. Multi-word inputs only process first word
4. Toggle controls both translation AND dictionary
5. UI displays all data correctly in DictionaryLog
6. Chat receives exactly 3 messages per lookup
7. No crashes on long definitions
8. UTF-8 characters handle correctly

---

## Quick Test Command Sequence

Copy-paste these into Twitch chat (with toggle enabled):

```
!d test
!d テスト
!d apple pie
!d 勉強
!ts Hello
!d hello
```

**Expected total:**
- 5 dictionary lookups (15 chat messages)
- 1 translation (4 chat messages)
- 6 entries in UI (5 in DictionaryLog, 1 in TranslationLog)

---

## Comparison: Translation vs Dictionary

| Feature | Translation (!ts) | Dictionary (!d) |
|---------|------------------|-----------------|
| **Input** | Full message | First word only |
| **Output Count** | 4 messages | 3 messages |
| **Chat Format** | [1/3] [casual] ... | [Dict] / [Examples] / [Synonyms] |
| **UI Component** | TranslationLog | DictionaryLog |
| **UI Theme** | Green accents | Purple/Blue accents |
| **Accordions** | Points only | Examples + Synonyms |
| **Toggle** | Shared | Shared |

---

## Next Steps After Testing

If all tests pass:
- ✅ Feature is production-ready
- Consider adding separate toggle for dictionary
- Consider adding multi-word phrase support
- Consider adding word history export

If tests fail:
- Note which test case failed
- Copy exact error messages from backend logs
- Check browser console for frontend errors
- Report issue with reproduction steps
