# AGENTS.MD

## Mission
Build **Alarminator** into a fun, reliable alarm app where users must solve simple puzzles before they can dismiss an alarm.

Core promise:
1. Alarm goes off on time.
2. User can snooze, but cannot fully dismiss until puzzle(s) are solved.
3. Experience feels playful, fast, and difficult to bypass accidentally.

## Current Project Snapshot
- Stack: Expo + React Native + TypeScript + Expo Router.
- Alarm scheduling and storage already exist.
- Alarm scheduling now uses `expo-notifications` with persisted notification IDs and startup reconciliation.
- Notification tap/receive navigation into `app/alarm-active.tsx` is implemented.
- Puzzle enforcement is not implemented yet (dismiss flow is currently a placeholder).

## Architecture Map (Source of Truth)
- App shell and notification routing: `app/_layout.tsx`
- Main alarm list: `app/(tabs)/index.tsx`
- Active alarm screen (puzzle gate entry): `app/alarm-active.tsx`
- Alarm state context: `src/store/AlarmContext.tsx`
- Alarm persistence: `src/services/alarmStorage.ts`
- Notification scheduling/snooze/cancel: `src/services/notificationService.ts`
- Shared alarm type: `src/types/index.ts`

When adding new logic, prefer extending these modules before creating parallel systems.

## Product Rules (Non-Negotiable)
1. **No puzzle completion, no dismiss**.
2. **Snooze is always explicit** (user chooses snooze duration, app confirms).
3. **Local-first reliability** (alarms and puzzle state survive app restarts).
4. **Fast wake-up UX** (large touch targets, clear instructions, minimal typing when alarm is ringing).
5. **No silent failure** (permission issues, schedule failures, or corrupted state must show user-facing recovery guidance).

## Implementation Priorities
1. Create a puzzle framework (types, registry, validation contract).
2. Implement Phase 1 puzzles:
   - Type a sentence with a required word.
   - Reverse counting with simple rule checks.
   - Odd-one-out multiple choice.
3. Wire puzzle completion into alarm dismissal gate.
4. Add puzzle progression and randomization for repeat alarms.
5. Add streak tracking and lightweight penalty mechanics.

Reference ideation document: `task_ideas_and_implementation_plan.md`.

## Recommended Puzzle System Shape
Use a composable puzzle contract instead of hardcoding puzzle UI into `alarm-active`.

Suggested types:
- `PuzzleDefinition` (id, title, instructions, generator, validator, difficulty)
- `PuzzleInstance` (definition id + generated prompt/state for this alarm ring)
- `PuzzleResult` (isSolved, feedback, attempts, elapsedMs)

Suggested folder (new):
- `src/puzzles/types.ts`
- `src/puzzles/registry.ts`
- `src/puzzles/generators/*`
- `src/puzzles/validators/*`
- `src/components/03_organisms/puzzles/*`

## Alarm Ring Flow (Target)
1. Alarm triggers notification.
2. App opens `alarm-active` with `alarmId`.
3. App resolves active puzzle instance for this alarm.
4. User can:
   - Snooze (reschedule alarm and preserve unsolved state), or
   - Solve puzzle.
5. Only after valid solve:
   - Cancel scheduled alarm notification.
   - Mark alarm session complete.
   - Return to alarm list.

## Engineering Standards
- Keep TypeScript strict and prefer explicit types for puzzle payloads.
- Avoid business logic in UI components; keep validation in puzzle/domain modules.
- Keep async flows idempotent (safe if called twice).
- Use small pure functions for puzzle generation/validation (easy to test).
- Preserve accessibility basics (contrast, readable text, touch targets).

## Testing Expectations
For each new puzzle or alarm-flow change, verify:
1. Alarm schedules correctly for future and past times.
2. Alarm opens active screen from foreground and background notification flows.
3. Dismiss is blocked until puzzle result is valid.
4. Snooze schedules follow-up alarm correctly.
5. App restart does not lose active alarm/puzzle state.
6. Invalid answers show clear retry feedback.

Run at minimum:
- `npm run lint`
- Manual device/simulator verification of one full ring -> solve -> dismiss cycle.

## Workflow Rules (Mandatory)
Every agent interacting with this repo MUST follow these workflow rules:
1. **Plan first**: Before making changes, create/update a plan in `Plans/` (e.g., `Plans/plan_feature_name.md`).
2. **Session Reports**: At the end of every session, append a summary of work done to `Reports/session_reports.md` (or create a new one if it's a major milestone).
3. **Traceability**: All major decisions and changed files should be logged in the session report.

## Collaboration Notes for Agents
- **Follow Workflow Rules**: Strictly adhere to the `Plans/` and `Reports/` requirements above.
- **Focused Changes**: Make focused changes; avoid broad refactors unless required by the feature.
- **Update Documentation**: Update this file when introducing a new subsystem or changing core flow.
- **Puzzle Documentation**: If you add new puzzle categories, document:
  - required input type,
  - validation strategy,
  - anti-bypass considerations,
  - expected completion time.

## Definition of Done (MVP for Puzzle Dismissal)
MVP is complete when:
1. At least 2 puzzle types are fully implemented.
2. Alarm cannot be dismissed without successful puzzle validation.
3. Snooze still works safely during unsolved state.
4. Basic failure/retry UX is clear and stable.
5. Flow works on at least one iOS and one Android test path.
