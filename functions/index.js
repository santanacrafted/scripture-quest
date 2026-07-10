const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

const DEFAULT_RATING = 1200;
const DEFAULT_LEVEL = 1;
const DEFAULT_LANGUAGE = 'en';
const MODE = 'quick-match';
const QUEUE_COLLECTION = 'matchmakingQueue';
const MATCH_COLLECTION = 'matches';
const USER_COLLECTION = 'users';
const TOTAL_ROUNDS = 6;
const QUEUE_TTL_MS = 90 * 1000;
const LIVE_SEARCH_WINDOW_MS = 30 * 1000;
const RECENT_PLAYER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_PENDING_ASYNC_MATCHES = 10;
const CANDIDATE_LIMIT = 30;
const EXPIRE_BATCH_LIMIT = 100;

const MATCH_STAGES = [
  { afterMs: 0, ratingRange: 100, preferSameLanguage: true },
  { afterMs: 10 * 1000, ratingRange: 250, preferSameLanguage: false },
  { afterMs: 20 * 1000, ratingRange: 500, preferSameLanguage: false },
  { afterMs: 30 * 1000, ratingRange: Number.POSITIVE_INFINITY, preferSameLanguage: false },
];

exports.createMatch = functions.https.onCall(requireAuth(async (data, context) => ({
  status: 'queued',
  note: 'Use joinQuickMatchQueue for trusted random match creation.',
  playerId: context.auth.uid,
  inviteCode: data?.inviteCode ?? null,
})));

exports.joinRandomMatch = functions.https.onCall(requireAuth(async (_data, context) => {
  return joinOrAttemptQuickMatch(context.auth.uid);
}));

exports.joinQuickMatchQueue = functions.https.onCall(requireAuth(async (_data, context) => {
  return joinOrAttemptQuickMatch(context.auth.uid);
}));

exports.attemptQuickMatch = functions.https.onCall(requireAuth(async (data, context) => {
  const searchToken = requireString(data?.searchToken, 'searchToken');
  return attemptQuickMatchForPlayer(context.auth.uid, searchToken);
}));

exports.cancelQuickMatch = functions.https.onCall(requireAuth(async (data, context) => {
  const searchToken = requireString(data?.searchToken, 'searchToken');
  const playerId = context.auth.uid;
  const queueRef = db.collection(QUEUE_COLLECTION).doc(playerId);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(queueRef);
    if (!snapshot.exists) {
      return { status: 'cancelled', matchId: null };
    }

    const queue = snapshot.data();
    if (queue.searchToken !== searchToken) {
      throw new functions.https.HttpsError('failed-precondition', 'This search is no longer active.');
    }

    if (queue.matchId) {
      return { status: 'matched', matchId: queue.matchId };
    }

    transaction.update(queueRef, {
      status: 'cancelled',
      updatedAt: FieldValue.serverTimestamp(),
    });

    functions.logger.info('quick_match_queue_cancelled', { playerId });
    return { status: 'cancelled', matchId: null };
  });
}));

exports.deleteMatchForTesting = functions.https.onCall(requireAuth(async (data, context) => {
  const matchId = requireString(data?.matchId, 'matchId');
  const playerId = context.auth.uid;
  const matchRef = db.collection(MATCH_COLLECTION).doc(matchId);

  return db.runTransaction(async (transaction) => {
    const matchSnapshot = await transaction.get(matchRef);
    if (!matchSnapshot.exists) {
      return { status: 'deleted', matchId };
    }

    const match = matchSnapshot.data();
    if (!Array.isArray(match.playerIds) || !match.playerIds.includes(playerId)) {
      throw new functions.https.HttpsError('permission-denied', 'Only match participants can delete this test match.');
    }

    const queueSnapshots = await Promise.all(
      match.playerIds.map(async (participantId) => {
        const queueRef = db.collection(QUEUE_COLLECTION).doc(participantId);
        const queueSnapshot = await transaction.get(queueRef);
        return { queueRef, queueSnapshot };
      }),
    );

    queueSnapshots.forEach(({ queueRef, queueSnapshot }) => {
      if (queueSnapshot.exists && queueSnapshot.data().matchId === matchId) {
        transaction.update(queueRef, {
          status: 'cancelled',
          matchId: null,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    transaction.delete(matchRef);
    functions.logger.info('quick_match_deleted_for_testing', { matchId, playerId });
    return { status: 'deleted', matchId };
  });
}));

exports.expireStaleMatchmakingEntries = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    const now = Timestamp.now();
    const snapshot = await db
      .collection(QUEUE_COLLECTION)
      .where('status', '==', 'searching')
      .where('expiresAt', '<=', now)
      .limit(EXPIRE_BATCH_LIMIT)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: 'expired',
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    functions.logger.info('quick_match_queue_expired', { count: snapshot.size });
    return null;
  });

exports.notifyMatchedPlayer = functions.firestore
  .document('matches/{matchId}')
  .onCreate(async (snapshot, context) => {
    const match = snapshot.data();
    if (match?.matchmaking?.source !== 'recent-player') {
      return null;
    }

    const requesterId = match.currentTurnPlayerId;
    const opponentId = (match.playerIds ?? []).find((playerId) => playerId !== requesterId);
    if (!opponentId) {
      return null;
    }

    const opponent = await db.collection(USER_COLLECTION).doc(opponentId).get();
    const token = opponent.get('notificationToken') || opponent.get('fcmToken');
    if (!token) {
      functions.logger.info('quick_match_notification_skipped', {
        matchId: context.params.matchId,
        reason: 'missing-token',
      });
      return null;
    }

    try {
      await admin.messaging().send({
        token,
        notification: {
          title: 'New Scripture Quest battle',
          body: 'An explorer challenged you to a Quick Match.',
        },
        data: {
          matchId: context.params.matchId,
          mode: MODE,
        },
      });
      return null;
    } catch (error) {
      functions.logger.warn('quick_match_notification_failed', {
        matchId: context.params.matchId,
        code: error?.code,
      });
      return null;
    }
  });

exports.submitAnswer = functions.https.onCall(async () => ({
  status: 'queued',
  note: 'Cloud Function scaffold ready for trusted answer validation.',
}));

exports.expireTurn = functions.https.onCall(async () => ({
  status: 'queued',
  note: 'Cloud Function scaffold ready for turn expiry handling.',
}));

exports.completeMatch = functions.https.onCall(async () => ({
  status: 'queued',
  note: 'Cloud Function scaffold ready for winner resolution.',
}));

exports.requestRematch = functions.https.onCall(async () => ({
  status: 'queued',
  note: 'Cloud Function scaffold ready for rematch flow.',
}));

function requireAuth(handler) {
  return async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication is required.');
    }
    return handler(data, context);
  };
}

async function joinOrAttemptQuickMatch(playerId) {
  const profile = await loadAuthoritativeProfile(playerId);
  const queueRef = db.collection(QUEUE_COLLECTION).doc(playerId);
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(Date.now() + QUEUE_TTL_MS);
  const searchToken = createSearchToken();

  const joinResult = await db.runTransaction(async (transaction) => {
    const queueSnapshot = await transaction.get(queueRef);
    if (queueSnapshot.exists) {
      const queue = queueSnapshot.data();
      const elapsedMs = queue.createdAt?.toMillis ? Date.now() - queue.createdAt.toMillis() : 0;
      if (
        queue.status === 'searching' &&
        queue.expiresAt?.toMillis() > Date.now() &&
        elapsedMs < LIVE_SEARCH_WINDOW_MS
      ) {
        return { status: 'searching', matchId: null, searchToken: queue.searchToken };
      }
    }

    transaction.set(queueRef, {
      playerId,
      status: 'searching',
      mode: MODE,
      rating: profile.rating,
      level: profile.level,
      region: profile.region,
      language: profile.language,
      createdAt: now,
      updatedAt: FieldValue.serverTimestamp(),
      expiresAt,
      matchId: null,
      searchToken,
    });

    functions.logger.info('quick_match_queue_joined', { playerId });
    return { status: 'searching', matchId: null, searchToken };
  });

  if (joinResult.matchId) {
    return joinResult;
  }

  return attemptQuickMatchForPlayer(playerId, joinResult.searchToken);
}

async function attemptQuickMatchForPlayer(playerId, searchToken) {
  const queueRef = db.collection(QUEUE_COLLECTION).doc(playerId);
  const queueSnapshot = await queueRef.get();
  if (!queueSnapshot.exists) {
    throw new functions.https.HttpsError('not-found', 'No active Quick Match search was found.');
  }

  const queue = queueSnapshot.data();
  if (queue.searchToken !== searchToken) {
    throw new functions.https.HttpsError('failed-precondition', 'This search has been replaced.');
  }

  if (queue.matchId) {
    return { status: 'matched', matchId: queue.matchId, searchToken };
  }

  if (queue.status !== 'searching' || queue.expiresAt?.toMillis() <= Date.now()) {
    return { status: queue.status === 'searching' ? 'expired' : queue.status, matchId: null, searchToken };
  }

  const elapsedMs = Math.max(0, Date.now() - queue.createdAt.toMillis());
  const stage = getStage(elapsedMs);
  const candidates = await findLiveQueueCandidates(playerId, queue, stage);
  const liveResult = await claimCandidateInTransaction(playerId, searchToken, candidates);
  if (liveResult.status === 'matched') {
    return liveResult;
  }

  if (elapsedMs >= LIVE_SEARCH_WINDOW_MS) {
    const fallbackResult = await createRecentPlayerChallenge(playerId, searchToken, queue);
    if (fallbackResult.status === 'matched') {
      return fallbackResult;
    }

    await queueRef.update({
      status: 'expired',
      updatedAt: FieldValue.serverTimestamp(),
    });

    functions.logger.info('quick_match_search_expired', { playerId });
    return { status: 'expired', matchId: null, searchToken };
  }

  return {
    status: 'searching',
    matchId: null,
    searchToken,
    elapsedMs,
    nextAttemptAfterMs: 2500,
  };
}

async function findLiveQueueCandidates(playerId, queue, stage) {
  const baseQuery = db
    .collection(QUEUE_COLLECTION)
    .where('status', '==', 'searching')
    .where('mode', '==', MODE)
    .orderBy('createdAt', 'asc')
    .limit(CANDIDATE_LIMIT);

  const sameLanguageSnapshot = stage.preferSameLanguage
    ? await baseQuery.where('language', '==', queue.language).get()
    : await baseQuery.get();

  return sameLanguageSnapshot.docs
    .filter((doc) => doc.id !== playerId)
    .map((doc) => ({ id: doc.id, ref: doc.ref, data: doc.data() }))
    .filter((candidate) => candidate.data.expiresAt?.toMillis() > Date.now())
    .filter((candidate) => Math.abs((candidate.data.rating ?? DEFAULT_RATING) - queue.rating) <= stage.ratingRange);
}

async function claimCandidateInTransaction(playerId, searchToken, candidates) {
  for (const candidate of candidates) {
    try {
      const result = await db.runTransaction(async (transaction) => {
        const requesterRef = db.collection(QUEUE_COLLECTION).doc(playerId);
        const requesterSnapshot = await transaction.get(requesterRef);
        const candidateSnapshot = await transaction.get(candidate.ref);

        if (!requesterSnapshot.exists || !candidateSnapshot.exists) {
          return null;
        }

        const requester = requesterSnapshot.data();
        const opponent = candidateSnapshot.data();
        if (!isClaimableRequester(requester, playerId, searchToken) || !isClaimableOpponent(opponent, candidate.id)) {
          return null;
        }

        const stage = getStage(Date.now() - requester.createdAt.toMillis());
        const ratingDifference = Math.abs((opponent.rating ?? DEFAULT_RATING) - (requester.rating ?? DEFAULT_RATING));
        if (requester.mode !== opponent.mode || ratingDifference > stage.ratingRange) {
          return null;
        }

        const matchRef = db.collection(MATCH_COLLECTION).doc();
        const match = buildMatch(matchRef.id, requester, opponent, 'live-queue', ratingDifference);
        transaction.set(matchRef, match);
        transaction.update(requesterRef, {
          status: 'matched',
          matchId: matchRef.id,
          updatedAt: FieldValue.serverTimestamp(),
        });
        transaction.update(candidate.ref, {
          status: 'matched',
          matchId: matchRef.id,
          updatedAt: FieldValue.serverTimestamp(),
        });

        return { status: 'matched', matchId: matchRef.id, searchToken: requester.searchToken };
      });

      if (result) {
        functions.logger.info('quick_match_created', {
          matchId: result.matchId,
          source: 'live-queue',
          playerId,
          opponentId: candidate.id,
        });
        return result;
      }
    } catch (error) {
      functions.logger.warn('quick_match_transaction_conflict', {
        playerId,
        candidateId: candidate.id,
        code: error?.code,
      });
    }
  }

  return { status: 'searching', matchId: null, searchToken };
}

async function createRecentPlayerChallenge(playerId, searchToken, queue) {
  const recentSince = Timestamp.fromMillis(Date.now() - RECENT_PLAYER_WINDOW_MS);
  const snapshot = await db
    .collection(USER_COLLECTION)
    .where('randomChallengesEnabled', '==', true)
    .where('lastActiveAt', '>=', recentSince)
    .limit(CANDIDATE_LIMIT)
    .get();

  const candidates = snapshot.docs.filter((doc) => doc.id !== playerId);
  for (const candidate of candidates) {
    const pendingSnapshot = await db
      .collection(MATCH_COLLECTION)
      .where('playerIds', 'array-contains', candidate.id)
      .where('status', 'in', ['waiting', 'active'])
      .limit(MAX_PENDING_ASYNC_MATCHES + 1)
      .get();

    if (pendingSnapshot.size > MAX_PENDING_ASYNC_MATCHES) {
      continue;
    }

    const result = await db.runTransaction(async (transaction) => {
      const requesterRef = db.collection(QUEUE_COLLECTION).doc(playerId);
      const requesterSnapshot = await transaction.get(requesterRef);
      if (!requesterSnapshot.exists) {
        return null;
      }

      const requester = requesterSnapshot.data();
      if (!isClaimableRequester(requester, playerId, searchToken)) {
        return requester.matchId
          ? { status: 'matched', matchId: requester.matchId, searchToken: requester.searchToken }
          : null;
      }

      const opponentProfile = normalizeProfile(candidate.id, candidate.data());
      const ratingDifference = Math.abs(opponentProfile.rating - (queue.rating ?? DEFAULT_RATING));
      const matchRef = db.collection(MATCH_COLLECTION).doc();
      const match = buildMatch(matchRef.id, requester, opponentProfile, 'recent-player', ratingDifference);
      transaction.set(matchRef, match);
      transaction.update(requesterRef, {
        status: 'matched',
        matchId: matchRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { status: 'matched', matchId: matchRef.id, searchToken: requester.searchToken };
    });

    if (result) {
      functions.logger.info('quick_match_created', {
        matchId: result.matchId,
        source: 'recent-player',
        playerId,
        opponentId: candidate.id,
      });
      return result;
    }
  }

  return { status: 'expired', matchId: null, searchToken };
}

function buildMatch(matchId, playerOne, playerTwo, source, ratingDifference) {
  const playerOneId = playerOne.playerId;
  const playerTwoId = playerTwo.playerId ?? playerTwo.uid;
  const createdAt = FieldValue.serverTimestamp();
  const searchDurationMs = Math.max(0, Date.now() - playerOne.createdAt.toMillis());

  return {
    id: matchId,
    mode: MODE,
    status: 'waiting',
    isAsynchronous: true,
    createdAt,
    updatedAt: createdAt,
    currentTurnPlayerId: playerOneId,
    roundNumber: 1,
    totalRounds: TOTAL_ROUNDS,
    playerIds: [playerOneId, playerTwoId],
    players: {
      [playerOneId]: buildMatchPlayer(playerOne),
      [playerTwoId]: buildMatchPlayer(playerTwo),
    },
    matchmaking: {
      ratingDifference,
      searchDurationMs,
      source,
    },
  };
}

function buildMatchPlayer(player) {
  return {
    displayName: player.displayName || player.username || 'Explorer',
    avatarUrl: player.avatarUrl ?? null,
    ratingAtMatchStart: player.rating ?? DEFAULT_RATING,
    score: 0,
    status: 'ready',
  };
}

async function loadAuthoritativeProfile(playerId) {
  const snapshot = await db.collection(USER_COLLECTION).doc(playerId).get();
  if (!snapshot.exists) {
    throw new functions.https.HttpsError('failed-precondition', 'Create a player profile before matchmaking.');
  }

  const profile = normalizeProfile(playerId, snapshot.data());
  if (profile.suspended || profile.banned || profile.accountStatus === 'suspended') {
    throw new functions.https.HttpsError('permission-denied', 'This account is not eligible for matchmaking.');
  }

  return profile;
}

function normalizeProfile(playerId, data) {
  return {
    uid: playerId,
    playerId,
    displayName: data.displayName || data.username || 'Explorer',
    username: data.username || data.displayName || 'Explorer',
    avatarUrl: data.avatarUrl ?? null,
    rating: Number.isFinite(data.rating) ? data.rating : DEFAULT_RATING,
    level: Number.isFinite(data.level) ? data.level : DEFAULT_LEVEL,
    region: data.region ?? null,
    language: data.language || DEFAULT_LANGUAGE,
    suspended: data.suspended === true,
    banned: data.banned === true,
    accountStatus: data.accountStatus ?? 'active',
  };
}

function getStage(elapsedMs) {
  return [...MATCH_STAGES].reverse().find((stage) => elapsedMs >= stage.afterMs) ?? MATCH_STAGES[0];
}

function isClaimableRequester(queue, playerId, searchToken) {
  return (
    queue?.playerId === playerId &&
    queue?.searchToken === searchToken &&
    queue?.status === 'searching' &&
    !queue?.matchId &&
    queue?.expiresAt?.toMillis() > Date.now()
  );
}

function isClaimableOpponent(queue, playerId) {
  return (
    queue?.playerId === playerId &&
    queue?.status === 'searching' &&
    !queue?.matchId &&
    queue?.expiresAt?.toMillis() > Date.now()
  );
}

function requireString(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new functions.https.HttpsError('invalid-argument', `${name} is required.`);
  }
  return value;
}

function createSearchToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
