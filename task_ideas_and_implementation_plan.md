# Alarminator: Task Ideas & Implementation Plan

This document outlines the various tasks a user must complete to dismiss an alarm, ordered by implementation difficulty (easiest to hardest).

## Implementation Order (Phase 1: Core Tasks)

### 1. Type a sentence using a specific word
- **Description:** "Type a sentence using the word 'gravity'"
- **Why it's easiest:** Requires only a simple text input field and basic string validation (checking if the target word is in the inputted string).

### 2. Reverse counting with rules
- **Description:** e.g., “Count backwards from 97, skip multiples of 3”
- **Why it's easy:** Logic is straightforward math. UI just needs a number pad or a multiple-choice selection.

### 3. Odd-one-out rapid fire
- **Description:** e.g., Show 5 words → pick the one that doesn’t belong.
- **Why it's easy/medium:** Requires creating a pre-defined dataset of word groups. The UI is just a list of buttons.

### 4. Show 6 emojis → hide → recall order
- **Description:** Display a sequence of emojis, hide them after a few seconds, and have the user recreate the sequence.
- **Why it's medium:** Requires a timer mechanism, state management for the sequence, and a grid UI for emoji selection.

### 5. Show a pattern → recreate it
- **Description:** Show a visual pattern (e.g., colored tiles in a 3x3 grid or a sequence of flashing lights) and ask the user to replicate it.
- **Why it's medium:** Similar to the emoji recall but requires more custom UI components (like a playable grid).

### 6. Name 5 things challenge
- **Description:** Name 5 things in a specific category (e.g., "Name 5 fruits").
- **Why it's medium/hard:** Validating open-ended text input is tricky. You either need an exhaustive local dictionary/list for categories or integration with a lightweight NLP/LLM API to validate answers.

### 7. Maze puzzles (simple ones)
- **Description:** Navigate a simple 2D maze to the exit.
- **Why it's hard:** Requires generating a valid maze, rendering a 2D canvas/grid, and handling touch/drag controls for movement.

### 8. Combinations
- **Description:** e.g., Tap numbers → solve puzzle → shake phone.
- **Why it's hardest:** Requires chaining multiple independent tasks together and integrating device sensors (like the accelerometer for shaking).

---

## Meta Features & Progression (Phase 2)

These are overarching features that tie the app together, also ordered roughly by difficulty:

1. **Keep Streak:** Simple local storage logic to track consecutive days of waking up on time.
2. **Randomize Tasks Daily:** Easy to implement once multiple tasks are built; just pick a random task component to render.
3. **Streak Penalty:** Deduct points or reset the streak if the user fails or forces a skip.
4. **QR Code in Bathroom/Kitchen:** Requires camera permissions, a QR scanning library, and users to print out a QR code. Highly effective but higher friction to build and set up.
5. **Require Camera / Mic / Motion:** Requires deep device integration, permissions handling, and potentially complex validation (e.g., "take a picture of something blue" or "yell 'I am awake'").
6. **Make app smarter:** Understand if users are awake and if they are, show them a notification to turn off the alarm for today.
7. **haptic feedback:** when setting time for alarm
