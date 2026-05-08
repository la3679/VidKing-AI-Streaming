# Security Specification - VidKing AI

## Data Invariants
1. A user can only read and write their own profile, watchlist, and progress documents.
2. `ownerId` (or `userId` in path) must strictly match `request.auth.uid`.
3. Timestamps like `updatedAt` must be set to `request.time`.
4. Progress cannot be negative.
5. Item IDs must be alphanumeric strings.

## The "Dirty Dozen" Payloads
1. **Identity Theft (Create)**: Attempt to create a profile for another user's UID.
2. **Identity Theft (Update)**: Attempt to update another user's watchlist.
3. **Ghost Field Injection**: Adding `isAdmin: true` to a user profile update.
4. **Time Spoofing**: Providing a manual `updatedAt` in the past.
5. **Progress Poisoning**: Setting progress to -1 or 200 (if max should be 100).
6. **Resource Exhaustion**: Sending a 1MB string in `tmdbId`.
7. **Cross-User Leak (List)**: Authenticated User A tries to list authenticated User B's watchlist.
8. **Shadow Update**: Updating a locked field like `email` if it should be immutable.
9. **Orphaned Writes**: Writing progress for a non-existent user path (caught by `{userId}` match).
10. **State Shortcutting**: Skipping initialization and jumping to a 'completed' state if there were a state machine.
11. **Malicious ID Injection**: Using `../../bad/path` as a `tmdbId` (if not validated).
12. **Unverified Email WRITE**: Attempting to write profile without `email_verified == true`.

## Test Runner (Draft)
A `firestore.rules.test.ts` will be created to verify these.
