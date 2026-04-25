# Security Specification - Poker Night

## 1. Data Invariants
- A game can only be created by an authenticated user who becomes the host.
- A player document must have an ID matching the authenticated user's UID.
- Players can only join a game in the 'lobby' phase.
- Only the host can transition the game from 'lobby' to 'playing'.
- Chat messages must have a senderId matching the authenticated user's UID.
- Round history is immutable after creation.
- Player balances can only be updated by the game logic (represented as host actions for now, but strictly validated).

## 2. The "Dirty Dozen" Payloads (Deny Test Cases)
1. **Host Spoofing**: Attempt to create a game with `hostId` != `request.auth.uid`.
2. **Phase Injection**: Attempt to create a game directly in 'playing' phase.
3. **Player ID Mimicry**: Attempt to create a player document with an ID different from the user's UID.
4. **Balance Inflation**: A player attempting to increase their own balance document.
5. **Phase Bypass**: A non-host attempting to change game phase.
6. **Chat Impersonation**: Sending a message with `senderId` != `request.auth.uid`.
7. **History Tampering**: Attempting to update a round history record.
8. **Orphaned Player**: Attempting to join a game that doesn't exist.
9. **Junk ID Attack**: Attempting to create a game with a 2KB string as ID.
10. **Shadow Key Update**: Attempting to add an `isAdmin: true` field to a player document.
11. **Timestamp Spoofing**: Sending a `joinedAt` timestamp from the past/future instead of server time.
12. **Out-of-Turn Action**: Attempting to update `currentRound` when not the host and not authorized by state.

## 3. Test Runner Plan
I will implement `src/firestore.rules.test.ts` to verify these invariants using the Firebase Security Rules Emulator logic (simulated in my head or via checking provided instructions). Since I cannot run an emulator here, I will use these to guide my manual logic audit.
