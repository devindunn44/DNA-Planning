# Security Specification for SyncSpace

## Data Invariants
1. A **User** profile is private but their `pairingCode` can be queried to facilitate linking.
2. A **Pairing** involves exactly two uids. Access to a pairing's data (like shared events) is strictly limited to those two uids.
3. **SharedEvents** must belong to a valid Pairing.
4. **WorkEvents** are owned by a User, but viewable by their linked Partner.
5. All IDs must match `^[a-zA-Z0-9_\-]+$`.
6. Timestamps (`createdAt`, `updatedAt`) must be server-generated.

## The Dirty Dozen Payloads (Red Team Tests)
- `T1`: Create user profile with someone else's UID.
- `T2`: Update user profile and change `email`.
- `T3`: Update user profile and manually set `partnerUid` without a valid Pairing existing.
- `T4`: Create a Pairing with 3 UIDs.
- `T5`: Create a Pairing containing a UID that isn't the current user.
- `T6`: Create a SharedEvent in a Pairing the user isn't part of.
- `T7`: Update a SharedEvent and change the `pairingId`.
- `T8`: Delete a SharedEvent in someone else's Pairing.
- `T9`: Create a WorkEvent with a huge (1MB) title string.
- `T10`: Update a WorkEvent and change the `ownerId`.
- `T11`: List all Pairings without being part of them.
- `T12`: Spoof `createdAt` by sending a client-side date for a SharedEvent.

## Rules Draft Strategy
- Use `isValidId()` for all path variables.
- `isValidUser()`: Enforce `pairingCode` length and `displayName` size.
- `isValidPairing()`: Enforce `uids.size() == 2`.
- `isValidSharedEvent()`: Enforce tag subset and date format.
- `isValidWorkEvent()`: Enforce size limits.
- `isMemberOfPairing(pairingId)`: Helper to check if `request.auth.uid` is in `get(/databases/$(database)/documents/pairings/$(pairingId)).data.uids`.
