Multiplayer MVP notes:

- This module is intentionally structured so the current local-service demo can be replaced by Firestore-backed collections later.
- The Cloud Functions folder contains scaffolded entrypoints for createMatch, joinRandomMatch, submitAnswer, expireTurn, completeMatch, and requestRematch.
- Future work: add real authentication, push notifications, rankings, friend lists, achievement unlocks, and season progression.
