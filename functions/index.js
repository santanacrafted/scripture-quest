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
// A player keeps their place until the queue entry itself expires. Quick Match
// must not silently replace a live queue search after an arbitrary UI timeout.
const LIVE_SEARCH_WINDOW_MS = QUEUE_TTL_MS;
const RECENT_PLAYER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_PENDING_ASYNC_MATCHES = 10;
const MAX_SIMULTANEOUS_QUICK_MATCHES = 5;
const CANDIDATE_LIMIT = 30;
const EXPIRE_BATCH_LIMIT = 100;
const QUESTION_HISTORY_LIMIT = 500;
const MATCH_DIFFICULTIES = ['beginner', 'disciple', 'scholar', 'mixed'];
const DIFFICULTY_PREFERENCES = [...MATCH_DIFFICULTIES, 'any'];
// Bootstrap allowlist only. Access to admin data is always enforced with the
// signed Firebase ID token's `admin` custom claim.
const CONTENT_ADMIN_EMAILS = new Set([
  'santanacrafted@gmail.com',
  'dsantanam2@gmail.com',
]);

exports.bootstrapContentAdmin = functions.https.onCall(requireAuth(async (_data, context) => {
  const user = await admin.auth().getUser(context.auth.uid);
  const email = String(user.email || '').trim().toLowerCase();
  if (!CONTENT_ADMIN_EMAILS.has(email)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'This account is not approved for the Content Studio.',
    );
  }
  await admin.auth().setCustomUserClaims(user.uid, {
    ...(user.customClaims || {}),
    admin: true,
  });
  functions.logger.info('content_admin_claim_granted', { uid: user.uid, email });
  return { admin: true, refreshToken: true };
}));

exports.createMatch = functions.https.onCall(requireAuth(async (data, context) => ({
  status: 'queued',
  note: 'Use joinQuickMatchQueue for trusted random match creation.',
  playerId: context.auth.uid,
  inviteCode: data?.inviteCode ?? null,
})));

exports.joinRandomMatch = functions.https.onCall(requireAuth(async (data, context) => {
  return joinOrAttemptQuickMatch(context.auth.uid, normalizeDifficultyPreference(data?.difficultyPreference));
}));

exports.joinQuickMatchQueue = functions.https.onCall(requireAuth(async (data, context) => {
  return joinOrAttemptQuickMatch(context.auth.uid, normalizeDifficultyPreference(data?.difficultyPreference));
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

exports.forfeitMatch = functions.https.onCall(requireAuth(async (data, context) => {
  const matchId = requireString(data?.matchId, 'matchId');
  const playerId = context.auth.uid;
  const matchRef = db.collection(MATCH_COLLECTION).doc(matchId);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(matchRef);
    if (!snapshot.exists) {
      return { status: 'cancelled', matchId };
    }
    const match = snapshot.data();
    if (!Array.isArray(match.playerIds) || !match.playerIds.includes(playerId)) {
      throw new functions.https.HttpsError('permission-denied', 'Only a participant can forfeit this match.');
    }
    if (['completed', 'cancelled'].includes(match.status)) {
      return { status: match.status, matchId };
    }
    const winnerId = match.playerIds.find((id) => id !== playerId) ?? null;
    transaction.update(matchRef, {
      status: 'completed',
      completionReason: 'forfeit',
      forfeitedBy: playerId,
      winnerId,
      currentTurnPlayerId: null,
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { status: 'cancelled', matchId };
  });
}));

exports.notifyForfeitWinner = functions.firestore
  .document('matches/{matchId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const match = change.after.data();
    if (before.status === 'completed' || match.status !== 'completed' || match.completionReason !== 'forfeit' || !match.winnerId) return null;
    const winnerId = match.winnerId;
    await db.collection('notifications').add({
      userId: winnerId, type: 'match_forfeit', matchId: context.params.matchId,
      title: 'Victory by forfeit', message: 'Your opponent forfeited the match. The victory is yours!',
      read: false, createdAt: FieldValue.serverTimestamp(),
    });
    const winner = await db.collection(USER_COLLECTION).doc(winnerId).get();
    const token = winner.get('notificationToken') || winner.get('fcmToken');
    if (!token) return null;
    try {
      await admin.messaging().send({
        token,
        notification: { title: 'Victory by forfeit', body: 'Your opponent forfeited. You won the match!' },
        data: { matchId: context.params.matchId, route: `/multiplayer/result/${context.params.matchId}` },
      });
    } catch (error) {
      functions.logger.warn('forfeit_notification_failed', { matchId: context.params.matchId, winnerId, code: error?.code });
    }
    return null;
  });

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
          title: 'New Lightbearer battle',
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

exports.notifyPlayerTurn = functions.firestore
  .document('matches/{matchId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const match = change.after.data();
    const playerId = match?.currentTurnPlayerId;
    if (!playerId || playerId === before?.currentTurnPlayerId || match.status !== 'active') {
      return null;
    }
    const player = await db.collection(USER_COLLECTION).doc(playerId).get();
    const token = player.get('notificationToken') || player.get('fcmToken');
    if (!token) return null;
    try {
      await admin.messaging().send({
        token,
        notification: { title: 'Your turn', body: 'Spin the wheel and continue your Lightbearer battle.' },
        data: { matchId: context.params.matchId, mode: match.mode || MODE, route: `/multiplayer/board/${context.params.matchId}` },
      });
    } catch (error) {
      functions.logger.warn('turn_notification_failed', { matchId: context.params.matchId, playerId, code: error?.code });
    }
    return null;
  });

exports.spinMatchWheel = functions.https.onCall(requireAuth(async (data, context) => {
  const matchId = requireString(data?.matchId, 'matchId');
  const matchRef = db.collection(MATCH_COLLECTION).doc(matchId);
  const categories = ['characters', 'scripture', 'stories', 'places', 'teachings'];
  const requestedCategory = typeof data?.category === 'string' ? data.category : null;
  let category = categories.includes(requestedCategory)
    ? requestedCategory
    : categories[Math.floor(Math.random() * categories.length)];
  const matchBeforeSpin = await matchRef.get();
  if (!matchBeforeSpin.exists) throw new functions.https.HttpsError('not-found', 'Match not found.');
  const requestedPhase = matchBeforeSpin.get('phase');
  if (requestedPhase === 'light_challenge' && matchBeforeSpin.get('selectedCategory')) {
    category = matchBeforeSpin.get('selectedCategory');
  }
  const questionSnapshotForCategory = await db.collection('questions')
    .where('category', '==', category).limit(100).get();
  const questionDocs = questionSnapshotForCategory.docs;
  const playableQuestions = questionDocs.filter((doc) =>
    doc.get('status') === 'published' &&
    doc.get('isActive') === true &&
    (doc.get('supportedModes') || []).includes('battle') &&
    questionMatchesDifficulty(doc.get('difficulty'), matchBeforeSpin.get('difficulty') || 'mixed')
  );
  if (!playableQuestions.length) throw new functions.https.HttpsError('failed-precondition', 'No published questions are available for this category.');
  const historySnapshot = await db.collection(USER_COLLECTION).doc(context.auth.uid)
    .collection('questionHistory').orderBy('seenAt', 'desc').limit(QUESTION_HISTORY_LIMIT).get();
  const seenAtByQuestion = new Map(historySnapshot.docs.map((doc) => [doc.id, doc.get('seenAt')?.toMillis?.() || 0]));
  const unseenQuestions = playableQuestions.filter((doc) => !seenAtByQuestion.has(doc.id));
  const questionSnapshot = unseenQuestions.length
    ? unseenQuestions[Math.floor(Math.random() * unseenQuestions.length)]
    : [...playableQuestions].sort((left, right) => (seenAtByQuestion.get(left.id) || 0) - (seenAtByQuestion.get(right.id) || 0))[0];
  const question = questionSnapshot.data();
  const publicQuestion = publicMatchQuestion(questionSnapshot.id, question, playableQuestions);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(matchRef);
    if (!snapshot.exists) throw new functions.https.HttpsError('not-found', 'Match not found.');
    const match = snapshot.data();
    if (!['spin', 'light_challenge'].includes(match.phase)) {
      throw new functions.https.HttpsError('failed-precondition', 'The wheel cannot be used during this phase.');
    }
    assertMatchTurn(match, context.auth.uid, match.phase);
    transaction.update(matchRef, {
      status: 'active', phase: 'question', selectedCategory: category,
      currentQuestion: { ...publicQuestion, kind: match.phase === 'light_challenge' ? 'light_challenge' : 'standard' },
      lastTurnSummary: match.phase === 'light_challenge' ? 'Answer correctly to capture the Light!' : `The wheel landed on ${category}.`, updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(
      db.collection(USER_COLLECTION).doc(context.auth.uid).collection('questionHistory').doc(questionSnapshot.id),
      { questionId: questionSnapshot.id, category, seenAt: FieldValue.serverTimestamp(), matchId },
      { merge: true },
    );
    return { matchId, category, question: publicQuestion, correctAnswer: correctAnswerForQuestion(question) };
  });
}));

exports.chooseLightChallenge = functions.https.onCall(requireAuth(async (data, context) => {
  const matchId = requireString(data?.matchId, 'matchId');
  const category = requireString(data?.category, 'category');
  const action = data?.action;
  if (!['capture', 'steal'].includes(action) || !['characters', 'scripture', 'stories', 'places', 'teachings'].includes(category)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid Light Challenge choice.');
  }
  const matchRef = db.collection(MATCH_COLLECTION).doc(matchId);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(matchRef);
    if (!snapshot.exists) throw new functions.https.HttpsError('not-found', 'Match not found.');
    const match = snapshot.data();
    assertMatchTurn(match, context.auth.uid, 'light_challenge');
    const owned = match.players?.[context.auth.uid]?.lights || [];
    if (owned.includes(category)) throw new functions.https.HttpsError('failed-precondition', 'You already own this Light.');
    const opponentId = match.playerIds.find((id) => id !== context.auth.uid);
    const opponentLights = opponentId ? match.players?.[opponentId]?.lights || [] : [];
    if (action === 'steal' && (!opponentId || !opponentLights.includes(category))) {
      throw new functions.https.HttpsError('failed-precondition', 'The opponent does not own that Light.');
    }
    transaction.update(matchRef, {
      selectedCategory: category,
      lightChallengeAction: action,
      lightChallengeOpponentId: action === 'steal' ? opponentId : null,
      lastTurnSummary: action === 'steal' ? `Challenge for the opponent's ${category} Light!` : `Challenge to capture the ${category} Light!`,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { matchId, category, action };
  });
}));

exports.submitAnswer = functions.https.onCall(requireAuth(async (data, context) => {
  const matchId = requireString(data?.matchId, 'matchId');
  const answer = requireString(data?.answer, 'answer');
  const matchRef = db.collection(MATCH_COLLECTION).doc(matchId);
  return db.runTransaction(async (transaction) => {
    const matchSnapshot = await transaction.get(matchRef);
    if (!matchSnapshot.exists) throw new functions.https.HttpsError('not-found', 'Match not found.');
    const match = matchSnapshot.data();
    assertMatchTurn(match, context.auth.uid, 'question');
    const questionId = match.currentQuestion?.id;
    if (!questionId) throw new functions.https.HttpsError('failed-precondition', 'No active question was found.');
    const questionSnapshot = await transaction.get(db.collection('questions').doc(questionId));
    if (!questionSnapshot.exists) throw new functions.https.HttpsError('not-found', 'Question not found.');
    const question = questionSnapshot.data();
    const correctAnswer = correctAnswerForQuestion(question);
    const correct = answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    const opponentId = match.playerIds.find((id) => id !== context.auth.uid);
    const sparks = Number(match.players?.[context.auth.uid]?.sparks || 0);
    const isLightChallenge = match.currentQuestion?.kind === 'light_challenge';
    const updates = {
      phase: 'spin', selectedCategory: null, currentQuestion: null,
      updatedAt: FieldValue.serverTimestamp(),
      lastTurnSummary: correct ? 'Correct! You earned a Light Spark and keep your turn.' : 'Incorrect. The turn passes.',
    };
    if (isLightChallenge) {
      updates[`players.${context.auth.uid}.sparks`] = 0;
      if (correct) {
        const lights = Array.isArray(match.players?.[context.auth.uid]?.lights) ? match.players[context.auth.uid].lights : [];
        const capturedLights = [...new Set([...lights, match.selectedCategory])];
        updates[`players.${context.auth.uid}.lights`] = capturedLights;
        if (match.lightChallengeAction === 'steal' && match.lightChallengeOpponentId) {
          const opponentLights = match.players?.[match.lightChallengeOpponentId]?.lights || [];
          updates[`players.${match.lightChallengeOpponentId}.lights`] = opponentLights.filter((light) => light !== match.selectedCategory);
        }
        updates.lastTurnSummary = `You captured the ${match.selectedCategory} Light!`;
        if (capturedLights.length >= 5) {
          updates.status = 'completed';
          updates.phase = 'complete';
          updates.currentTurnPlayerId = null;
          updates.winnerId = context.auth.uid;
          updates.completionReason = 'lights';
          updates.completedAt = FieldValue.serverTimestamp();
          updates.lastTurnSummary = 'All five Lights captured. Victory!';
        }
      } else if (opponentId) {
        updates.currentTurnPlayerId = opponentId;
        updates.lastTurnSummary = 'The Light Challenge was missed. The turn passes.';
      } else {
        updates.status = 'waiting_for_opponent';
        updates.currentTurnPlayerId = null;
        updates.lastTurnSummary = 'The Light Challenge was missed. Waiting for another explorer.';
      }
    } else if (correct) {
      const nextSparks = Math.min(3, sparks + 1);
      updates[`players.${context.auth.uid}.sparks`] = nextSparks;
      if (nextSparks === 3) {
        updates.phase = 'light_challenge';
        updates.selectedCategory = null;
        updates.lightChallengeAction = null;
        updates.lightChallengeOpponentId = null;
        updates.lastTurnSummary = 'Lantern charged! Take the Light Challenge.';
      }
    } else if (opponentId) {
      updates[`players.${context.auth.uid}.sparks`] = 0;
      updates.currentTurnPlayerId = opponentId;
    }
    else {
      updates[`players.${context.auth.uid}.sparks`] = 0;
      updates.status = 'waiting_for_opponent';
      updates.currentTurnPlayerId = null;
      updates.lastTurnSummary = 'Turn complete. Waiting for another explorer to join.';
    }
    transaction.update(matchRef, updates);
    return { matchId, correct, waitingForOpponent: !correct && !opponentId, correctAnswer, explanation: question.explanation || '', reference: question.scriptureReference || '' };
  });
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

function requireAdmin(handler) {
  return requireAuth(async (data, context) => {
    if (context.auth.token.admin !== true) {
      throw new functions.https.HttpsError('permission-denied', 'Content Studio administrator access is required.');
    }
    return handler(data, context);
  });
}

const CONTENT_CATEGORIES = ['characters','scripture','stories','places','teachings'];
const CONTENT_TYPES = ['multiple_choice','pictionary','verse_completion','reference_match','who_am_i','who_said_it','sequence','map_challenge','emoji_challenge','true_false','match_pairs','odd_one_out','what_happens_next','arrange_verse'];
const CONTENT_DIFFICULTIES = ['easy','medium','hard','expert'];
const CONTENT_SCOPES = ['chapter','book','multi_book','whole_bible'];
const CONTENT_SUPPORTED_MODES = ['quiz','battle'];
const MULTIPLE_CHOICE_CONTENT_TYPES = ['multiple_choice','pictionary','verse_completion','reference_match','who_am_i','who_said_it','emoji_challenge','odd_one_out','what_happens_next'];
function validateContentQuestion(question, publishing = false) {
  const errors = [];
  if (!CONTENT_CATEGORIES.includes(question?.category)) errors.push('Invalid category.');
  if (!CONTENT_TYPES.includes(question?.questionType)) errors.push('Invalid question type.');
  if (!CONTENT_DIFFICULTIES.includes(question?.difficulty)) errors.push('Invalid difficulty.');
  if (!CONTENT_SCOPES.includes(question?.scope)) errors.push('Scope must be chapter, book, multi_book, or whole_bible.');
  if (!Array.isArray(question?.supportedModes) || !question.supportedModes.length || question.supportedModes.some(mode => !CONTENT_SUPPORTED_MODES.includes(mode))) errors.push('Supported modes must include quiz, battle, or both.');
  if (Array.isArray(question?.supportedModes) && new Set(question.supportedModes).size !== question.supportedModes.length) errors.push('Supported modes must not contain duplicates.');
  if (['pictionary','map_challenge','emoji_challenge'].includes(question?.questionType) &&
      (question?.supportedModes?.length !== 1 || question.supportedModes[0] !== 'battle')) errors.push('Pictionary, Map Challenge, and Emoji Challenge must be battle-only.');
  if (!['en','es'].includes(question?.language)) errors.push('Invalid language.');
  if (typeof question?.prompt !== 'string' || question.prompt.trim().length < 10 || question.prompt.length > 500) errors.push('Prompt must contain 10–500 characters.');
  if (!question?.answerData?.type) errors.push('Answer configuration is required.');
  if (MULTIPLE_CHOICE_CONTENT_TYPES.includes(question?.questionType)) {
    const options = question.answerData?.options || [];
    if (question.answerData?.type !== 'multiple_choice') errors.push('This question type requires multiple-choice answer data.');
    if (options.length !== 4) errors.push('Multiple choice requires four options.');
    if (new Set(options.map(option => String(option.text).trim().toLowerCase())).size !== options.length) errors.push('Multiple-choice options must be unique.');
    if ((question.answerData?.correctOptionIds || []).length !== 1) errors.push('Multiple choice requires exactly one correct option.');
    if (!(question.answerData?.correctOptionIds || []).every(id => options.some(option => option.id === id))) errors.push('Correct option is invalid.');
  }
  if (question?.questionType === 'sequence') {
    const items = question.answerData?.items || [];
    if (question.answerData?.type !== 'sequence') errors.push('Sequence requires sequence answer data.');
    if (items.length < 2) errors.push('Sequence requires at least two items.');
    if (new Set(items.map(item => String(item.text).trim().toLowerCase())).size !== items.length) errors.push('Sequence items must be unique.');
    const positions = items.map(item => item.correctPosition).sort((a, b) => a - b);
    if (positions.some((position, index) => position !== index)) errors.push('Sequence positions must start at zero and be consecutive.');
  }
  if (question?.questionType === 'match_pairs') {
    const pairs = question.answerData?.pairs || [];
    if (question.answerData?.type !== 'match_pairs') errors.push('Match Pairs requires match-pairs answer data.');
    if (pairs.length < 2) errors.push('Match Pairs requires at least two pairs.');
    if (pairs.some(pair => !String(pair.left || '').trim() || !String(pair.right || '').trim())) errors.push('Every pair requires both a left and right value.');
    if (new Set(pairs.map(pair => String(pair.left).trim().toLowerCase())).size !== pairs.length) errors.push('Left-side pair values must be unique.');
    if (new Set(pairs.map(pair => String(pair.right).trim().toLowerCase())).size !== pairs.length) errors.push('Right-side pair values must be unique.');
  }
  if (question?.questionType === 'arrange_verse') {
    const segments = question.answerData?.segments || [];
    if (question.answerData?.type !== 'arrange_verse') errors.push('Arrange the Verse requires arrange-verse answer data.');
    if (segments.length < 2) errors.push('Arrange the Verse requires at least two segments.');
    if (segments.some(segment => !String(segment.id || '').trim() || !String(segment.text || '').trim())) errors.push('Every verse segment requires an ID and text.');
    if (new Set(segments.map(segment => String(segment.id))).size !== segments.length) errors.push('Verse segment IDs must be unique.');
    const positions = segments.map(segment => segment.correctPosition).sort((a, b) => a - b);
    if (positions.some((position, index) => position !== index)) errors.push('Verse segment positions must start at zero and be consecutive.');
  }
  if (publishing && !String(question?.scriptureReference || '').trim()) errors.push('Scripture reference is required to publish.');
  if (publishing && (!Array.isArray(question?.passages) || !question.passages.length)) errors.push('At least one structured biblical passage is required to publish.');
  if (publishing && ['pictionary','map_challenge'].includes(question?.questionType) && !question?.media?.storagePath) errors.push('This question type requires media.');
  if (publishing && question?.questionType === 'pictionary' && !question?.media?.downloadUrl) errors.push('Pictionary requires a playable image URL.');
  if (publishing && question?.media?.storagePath && !String(question.media.altText || '').trim()) errors.push('Media alt text is required.');
  if (question?.passages && !Array.isArray(question.passages)) errors.push('Passages must be an array.');
  for (const passage of question?.passages || []) {
    if (!String(passage.bookId || '').trim() || !String(passage.bookName || '').trim()) errors.push('Every passage needs a canonical book ID and name.');
    if (passage.chapterStart != null && (!Number.isInteger(passage.chapterStart) || passage.chapterStart < 1)) errors.push('Passage chapterStart is invalid.');
    if (passage.chapterEnd != null && (!Number.isInteger(passage.chapterEnd) || passage.chapterEnd < passage.chapterStart)) errors.push('Passage chapterEnd is invalid.');
  }
  return errors;
}

function withNormalizedScope(question) {
  const passages = Array.isArray(question.passages) ? question.passages : [];
  const tokens = new Set(['bible']);
  if (['old', 'new'].includes(question.testament)) tokens.add(`testament:${question.testament}`);
  for (const passage of passages) {
    tokens.add(`book:${passage.bookId}`);
    if (Number.isInteger(passage.chapterStart) && Number.isInteger(passage.chapterEnd)) {
      for (let chapter = passage.chapterStart; chapter <= passage.chapterEnd; chapter++) tokens.add(`chapter:${passage.bookId}:${chapter}`);
    }
  }
  return { ...question, passages, scopeTokens: [...tokens] };
}

exports.saveContentQuestion = functions.https.onCall(requireAdmin(async (data, context) => {
  const question = withNormalizedScope(data?.question || {});
  const id = typeof data?.questionId === 'string' && data.questionId ? data.questionId : db.collection('questions').doc().id;
  const errors = validateContentQuestion(question, false);
  if (errors.length) throw new functions.https.HttpsError('invalid-argument', errors.join(' '), { errors });
  const ref = db.collection('questions').doc(id), existing = await ref.get(), now = FieldValue.serverTimestamp();
  await ref.set({...question,id,status:question.status || 'draft',isActive:question.status === 'published' && question.isActive === true,createdAt:existing.exists?existing.get('createdAt'):now,createdBy:existing.exists?existing.get('createdBy'):context.auth.uid,updatedAt:now,updatedBy:context.auth.uid},{merge:true});
  await db.collection('questionAuditLogs').add({questionId:id,action:existing.exists?'updated':'created',actorId:context.auth.uid,timestamp:now});
  return { questionId:id };
}));

exports.publishQuestion = functions.https.onCall(requireAdmin(async (data, context) => {
  const id = requireString(data?.questionId, 'questionId'), ref = db.collection('questions').doc(id), snapshot = await ref.get();
  if (!snapshot.exists) throw new functions.https.HttpsError('not-found','Question not found.');
  const question = withNormalizedScope({...snapshot.data(),...(data?.question || {})}), errors = validateContentQuestion(question, true);
  if (errors.length) throw new functions.https.HttpsError('failed-precondition', errors.join(' '), { errors });
  if (question.externalId) { const duplicate = await db.collection('questions').where('externalId','==',question.externalId).limit(2).get(); if (duplicate.docs.some(doc => doc.id !== id)) throw new functions.https.HttpsError('already-exists','External ID is already in use.'); }
  await ref.set({...question,status:'published',isActive:true,publishedAt:FieldValue.serverTimestamp(),publishedBy:context.auth.uid,updatedAt:FieldValue.serverTimestamp(),updatedBy:context.auth.uid},{merge:true});
  await db.collection('questionAuditLogs').add({questionId:id,action:'published',actorId:context.auth.uid,timestamp:FieldValue.serverTimestamp()});
  return { questionId:id,status:'published' };
}));

exports.bulkImportQuestions = functions.https.onCall(requireAdmin(async (data, context) => {
  const questions = data?.questions;
  const publish = data?.publish === true;
  if (!Array.isArray(questions) || !questions.length || questions.length > 400) throw new functions.https.HttpsError('invalid-argument','Each import batch must contain 1–400 questions.');
  const failures = questions.map((question,index)=>({index,errors:validateContentQuestion(withNormalizedScope(question),publish)})).filter(result=>result.errors.length);
  if (failures.length) throw new functions.https.HttpsError('invalid-argument','Import contains invalid questions.',{failures});
  const externalIds = questions.map(q=>q.externalId).filter(Boolean); if (new Set(externalIds).size !== externalIds.length) throw new functions.https.HttpsError('already-exists','Import contains duplicate external IDs.');
  let imported=0;
  for(let offset=0;offset<questions.length;offset+=400){const batch=db.batch();questions.slice(offset,offset+400).forEach(question=>{const ref=db.collection('questions').doc();batch.set(ref,{...withNormalizedScope(question),id:ref.id,status:publish?'published':'draft',isActive:publish,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp(),createdBy:context.auth.uid,updatedBy:context.auth.uid,publishedAt:publish?FieldValue.serverTimestamp():null,publishedBy:publish?context.auth.uid:null});});await batch.commit();imported+=Math.min(400,questions.length-offset);}
  functions.logger.info('content_questions_imported',{actorId:context.auth.uid,count:imported,published:publish});return{imported,published:publish};
}));

async function joinOrAttemptQuickMatch(playerId, difficultyPreference = 'any') {
  // Prefer the oldest compatible waiting match. If none exists, create an
  // asynchronous match immediately so the player can take the first turn
  // while another Lightbearer joins later.
  return joinAsyncQuickMatch(playerId, difficultyPreference);

  /* Legacy simultaneous-search implementation retained for compatibility
     with older queue documents and clients. */
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
      displayName: profile.displayName,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
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

async function joinAsyncQuickMatch(playerId, difficultyPreference) {
  const profile = await loadAuthoritativeProfile(playerId);
  const playerMatches = await db.collection(MATCH_COLLECTION)
    .where('playerIds', 'array-contains', playerId)
    .get();
  const openQuickMatches = playerMatches.docs.filter((doc) => {
    const match = doc.data();
    return match.mode === MODE && ['active', 'waiting', 'waiting_for_opponent'].includes(match.status);
  });
  if (openQuickMatches.length >= MAX_SIMULTANEOUS_QUICK_MATCHES) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      `You can have up to ${MAX_SIMULTANEOUS_QUICK_MATCHES} Quick Matches at once. Finish or forfeit one before starting another.`,
    );
  }
  const waitingSnapshot = await db.collection(MATCH_COLLECTION)
    .where('status', '==', 'waiting_for_opponent')
    .limit(100)
    .get();
  const waiting = waitingSnapshot.docs
    .filter((doc) => doc.get('mode') === MODE)
    .filter((doc) => difficultyPreference === 'any' || doc.get('difficulty') === difficultyPreference)
    .sort((left, right) => (left.get('updatedAt')?.toMillis?.() || 0) - (right.get('updatedAt')?.toMillis?.() || 0))
    .slice(0, CANDIDATE_LIMIT);

  for (const candidate of waiting) {
    const joined = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(candidate.ref);
      if (!snapshot.exists) return null;
      const match = snapshot.data();
      if (match.status !== 'waiting_for_opponent' || match.mode !== MODE || match.playerIds.length !== 1 || match.playerIds.includes(playerId)) return null;
      if (difficultyPreference !== 'any' && match.difficulty !== difficultyPreference) return null;
      const hostId = match.playerIds[0];
      transaction.update(candidate.ref, {
        status: 'active',
        playerIds: [hostId, playerId],
        [`players.${playerId}`]: buildMatchPlayer(profile),
        currentTurnPlayerId: playerId,
        phase: 'spin',
        selectedCategory: null,
        currentQuestion: null,
        lastTurnSummary: 'An explorer joined. Spin the wheel!',
        updatedAt: FieldValue.serverTimestamp(),
      });
      return candidate.id;
    });
    if (joined) {
      const matchedSearchToken = createSearchToken();
      await setMatchedQueueEntry(playerId, profile, joined, matchedSearchToken, difficultyPreference);
      return { status: 'matched', matchId: joined, searchToken: matchedSearchToken };
    }
  }

  const matchRef = db.collection(MATCH_COLLECTION).doc();
  const searchToken = createSearchToken();
  const createdAt = FieldValue.serverTimestamp();
  await matchRef.set({
    id: matchRef.id, mode: MODE, status: 'waiting_for_opponent', isAsynchronous: true,
    difficulty: difficultyPreference === 'any' ? 'mixed' : difficultyPreference,
    createdAt, updatedAt: createdAt, currentTurnPlayerId: playerId,
    phase: 'spin', selectedCategory: null, currentQuestion: null,
    lastTurnSummary: 'Take your turn. If it passes, another explorer can join.',
    roundNumber: 1, totalRounds: TOTAL_ROUNDS, playerIds: [playerId],
    players: { [playerId]: buildMatchPlayer(profile) },
    matchmaking: { ratingDifference: 0, searchDurationMs: 0, source: 'live-queue' },
  });
  await setMatchedQueueEntry(playerId, profile, matchRef.id, searchToken, difficultyPreference);
  return { status: 'matched', matchId: matchRef.id, searchToken };
}

async function setMatchedQueueEntry(playerId, profile, matchId, searchToken = createSearchToken(), difficultyPreference = 'any') {
  await db.collection(QUEUE_COLLECTION).doc(playerId).set({
    playerId, status: 'matched', mode: MODE, rating: profile.rating, level: profile.level,
    region: profile.region, language: profile.language, displayName: profile.displayName,
    username: profile.username, avatarUrl: profile.avatarUrl, createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + QUEUE_TTL_MS),
    matchId, searchToken, difficultyPreference,
  });
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
  const candidates = await findLiveQueueCandidates(playerId);
  const liveResult = await claimCandidateInTransaction(playerId, searchToken, candidates);
  if (liveResult.status === 'matched') {
    return liveResult;
  }

  return {
    status: 'searching',
    matchId: null,
    searchToken,
    elapsedMs,
    nextAttemptAfterMs: 2500,
  };
}

async function findLiveQueueCandidates(playerId) {
  const baseQuery = db
    .collection(QUEUE_COLLECTION)
    .where('status', '==', 'searching')
    .where('mode', '==', MODE)
    .orderBy('createdAt', 'asc');

  const snapshot = await baseQuery.get();

  return snapshot.docs
    .filter((doc) => doc.id !== playerId)
    .map((doc) => ({ id: doc.id, ref: doc.ref, data: doc.data() }))
    .filter((candidate) => candidate.data.expiresAt?.toMillis() > Date.now());
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

        const ratingDifference = Math.abs((opponent.rating ?? DEFAULT_RATING) - (requester.rating ?? DEFAULT_RATING));
        if (requester.mode !== opponent.mode) {
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
    status: 'active',
    isAsynchronous: true,
    difficulty: playerOne.difficultyPreference === 'any' ? 'mixed' : (playerOne.difficultyPreference || 'mixed'),
    createdAt,
    updatedAt: createdAt,
    currentTurnPlayerId: playerOneId,
    phase: 'spin',
    selectedCategory: null,
    currentQuestion: null,
    lastTurnSummary: 'Your lantern is ready. Spin the wheel!',
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
    username: player.username || player.displayName || 'Explorer',
    avatarUrl: player.avatarUrl ?? null,
    ratingAtMatchStart: player.rating ?? DEFAULT_RATING,
    score: 0,
    sparks: 0,
    lights: [],
    status: 'ready',
  };
}

function assertMatchTurn(match, playerId, phase) {
  if (!Array.isArray(match.playerIds) || !match.playerIds.includes(playerId)) {
    throw new functions.https.HttpsError('permission-denied', 'You are not a participant in this match.');
  }
  if (!['waiting', 'active'].includes(match.status) || match.currentTurnPlayerId !== playerId || match.phase !== phase) {
    throw new functions.https.HttpsError('failed-precondition', 'It is not your turn for this action.');
  }
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function shuffleAwayFromOrder(items, key = (item) => item) {
  if (items.length < 2) return [...items];
  const shuffled = shuffle(items);
  const unchanged = shuffled.every((item, index) => key(item) === key(items[index]));
  return unchanged ? [...items.slice(1), items[0]] : shuffled;
}

function scrambledPairColumns(pairs) {
  const displayedPairs = shuffle(pairs);
  if (displayedPairs.length < 2) {
    return {
      left: displayedPairs.map((pair) => pair.left),
      right: displayedPairs.map((pair) => pair.right),
    };
  }
  const correctRights = displayedPairs.map((pair) => pair.right);
  const offset = 1 + Math.floor(Math.random() * (correctRights.length - 1));
  return {
    left: displayedPairs.map((pair) => pair.left),
    right: correctRights.map((_, index) => correctRights[(index + offset) % correctRights.length]),
  };
}

function publicMatchQuestion(id, question, questionPool = []) {
  const answer = question.answerData || {};
  let choices = [];
  if (answer.type === 'multiple_choice') choices = (answer.options || []).map((option) => option.text);
  else if (answer.type === 'sequence') {
    choices = [...(answer.items || [])]
      .sort((left, right) => left.correctPosition - right.correctPosition)
      .map((item) => item.text);
    choices = shuffleAwayFromOrder(choices);
    return { id, text: question.prompt, choices, questionType: question.questionType, difficulty: question.difficulty };
  }
  else if (answer.type === 'match_pairs') {
    const pairs = answer.pairs || [];
    const matchPairs = scrambledPairColumns(pairs);
    return {
      id,
      text: question.prompt,
      choices: [],
      questionType: question.questionType,
      difficulty: question.difficulty,
      matchPairs,
    };
  }
  else if (answer.type === 'arrange_verse') {
    return {
      id,
      text: question.prompt,
      choices: [],
      questionType: question.questionType,
      difficulty: question.difficulty,
      verseSegments: shuffleAwayFromOrder(
        [...(answer.segments || [])]
          .sort((left, right) => left.correctPosition - right.correctPosition)
          .map((segment) => ({ id: segment.id, text: segment.text })),
        (segment) => segment.id,
      ),
    };
  }
  else if (answer.type === 'true_false') {
    return {
      id,
      text: question.prompt,
      choices: ['True', 'False'].sort(() => Math.random() - 0.5),
      questionType: question.questionType,
      difficulty: question.difficulty,
    };
  }
  else if (answer.type === 'text') choices = [answer.primaryAnswer, ...(answer.distractors || [])];
  const correct = correctAnswerForQuestion(question);
  const poolAnswers = questionPool
    .filter((snapshot) => snapshot.id !== id)
    .map((snapshot) => correctAnswerForQuestion(snapshot.data()))
    .filter(Boolean);
  const fallbacks = ['Moses', 'Jerusalem', 'Genesis', 'None of these'];
  choices = [...new Map([...choices, correct, ...poolAnswers, ...fallbacks]
    .filter(Boolean).map((choice) => [String(choice).trim().toLowerCase(), String(choice).trim()])).values()]
    .slice(0, 4)
    .sort(() => Math.random() - 0.5);
  const result = { id, text: question.prompt, choices, questionType: question.questionType, difficulty: question.difficulty };
  if (question.questionType === 'pictionary') {
    result.media = {
      downloadUrl: question.media.downloadUrl,
      altText: question.media.altText,
    };
  }
  return result;
}

function correctAnswerForQuestion(question) {
  const answer = question.answerData || {};
  if (answer.type === 'multiple_choice') {
    return (answer.options || []).find((option) => (answer.correctOptionIds || []).includes(option.id))?.text || '';
  }
  if (answer.type === 'true_false') return answer.correctValue ? 'True' : 'False';
  if (answer.type === 'sequence') {
    return JSON.stringify([...(answer.items || [])]
      .sort((left, right) => left.correctPosition - right.correctPosition)
      .map((item) => String(item.text).trim()));
  }
  if (answer.type === 'match_pairs') {
    return JSON.stringify((answer.pairs || [])
      .map((pair) => ({ left: String(pair.left).trim(), right: String(pair.right).trim() }))
      .sort((left, right) => left.left.localeCompare(right.left)));
  }
  if (answer.type === 'arrange_verse') {
    return JSON.stringify([...(answer.segments || [])]
      .sort((left, right) => left.correctPosition - right.correctPosition)
      .map((segment) => String(segment.id)));
  }
  return answer.primaryAnswer || '';
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

function normalizeDifficultyPreference(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : 'any';
  if (!DIFFICULTY_PREFERENCES.includes(normalized)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid battle difficulty.');
  }
  return normalized;
}

function normalizeMatchDifficulty(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : 'mixed';
  if (!MATCH_DIFFICULTIES.includes(normalized)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid battle difficulty.');
  }
  return normalized;
}

function questionMatchesDifficulty(questionDifficulty, matchDifficulty) {
  if (matchDifficulty === 'mixed') return true;
  if (matchDifficulty === 'beginner') return questionDifficulty === 'easy';
  if (matchDifficulty === 'disciple') return questionDifficulty === 'medium';
  return ['hard', 'expert'].includes(questionDifficulty);
}

function createSearchToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

// Friend and Friend Battle trusted operations. Opposite-direction pending friend
// requests are returned to the caller for explicit acceptance (never auto-accepted).
const FRIEND_REQUESTS='friendRequests', FRIENDSHIPS='friendships', BLOCKS='blocks', INVITATIONS='battleInvitations';
const SOCIAL_LIMITS={searchResults:10,minSearchLength:2,maxPendingFriendRequests:30,maxPendingInvitations:10,invitationTtlMs:24*60*60*1000,allowedRounds:[3,6,9]};
const pairId=(a,b)=>[a,b].sort().join('_'); const blockId=(a,b)=>`${a}_${b}`;
const safeProfile=(id,d)=>({uid:id,displayName:d.displayName||d.username||'Explorer',username:d.username||d.displayName||'Explorer',friendCode:d.friendCode||'',avatarUrl:d.avatarUrl||null});

exports.searchPlayers=functions.https.onCall(requireAuth(async(data,context)=>{const raw=requireString(data?.query,'query').trim();if(raw.length<SOCIAL_LIMITS.minSearchLength)throw new functions.https.HttpsError('invalid-argument','Enter at least 2 characters.');const uid=context.auth.uid,q=raw.toLowerCase(),users=db.collection(USER_COLLECTION);const blocked=await blockedIds(uid);const snapshots=await Promise.all([users.where('username','==',raw).limit(SOCIAL_LIMITS.searchResults).get(),users.where('displayName','==',raw).limit(SOCIAL_LIMITS.searchResults).get(),users.where('usernameLowercase','>=',q).where('usernameLowercase','<=',q+'\uf8ff').limit(SOCIAL_LIMITS.searchResults).get(),users.where('displayNameLowercase','>=',q).where('displayNameLowercase','<=',q+'\uf8ff').limit(SOCIAL_LIMITS.searchResults).get(),users.where('friendCode','==',raw.toUpperCase()).limit(1).get()]);const unique=new Map(snapshots.flatMap(snapshot=>snapshot.docs).map(d=>[d.id,d]));return{players:[...unique.values()].filter(d=>d.id!==uid&&!blocked.has(d.id)&&eligible(d.data())).slice(0,SOCIAL_LIMITS.searchResults).map(d=>safeProfile(d.id,d.data()))};}));
exports.sendFriendRequest=functions.https.onCall(requireAuth(async(data,context)=>{const senderId=context.auth.uid,recipientId=requireString(data?.recipientId,'recipientId');if(senderId===recipientId)throw new functions.https.HttpsError('invalid-argument','You cannot add yourself.');await assertNotBlocked(senderId,recipientId);const [recipient,pending,opposite]=await Promise.all([db.doc(`${USER_COLLECTION}/${recipientId}`).get(),db.collection(FRIEND_REQUESTS).where('senderId','==',senderId).where('status','==','pending').limit(SOCIAL_LIMITS.maxPendingFriendRequests+1).get(),db.collection(FRIEND_REQUESTS).where('senderId','==',recipientId).where('recipientId','==',senderId).where('status','==','pending').limit(1).get()]);if(!recipient.exists)throw new functions.https.HttpsError('not-found','Player not found.');if(pending.size>=SOCIAL_LIMITS.maxPendingFriendRequests)throw new functions.https.HttpsError('resource-exhausted','Too many pending requests.');if((await db.doc(`${FRIENDSHIPS}/${pairId(senderId,recipientId)}`).get()).exists)throw new functions.https.HttpsError('already-exists','You are already friends.');if(!opposite.empty)return{status:'incoming-request-exists',requestId:opposite.docs[0].id};const id=pairId(senderId,recipientId),ref=db.doc(`${FRIEND_REQUESTS}/${id}`);return db.runTransaction(async t=>{const s=await t.get(ref);if(s.exists&&s.data().status==='pending')return{status:'pending',requestId:id};const sender=await t.get(db.doc(`${USER_COLLECTION}/${senderId}`));t.set(ref,{senderId,recipientId,status:'pending',createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp(),respondedAt:null,sender:safeProfile(senderId,sender.data()||{}),recipient:safeProfile(recipientId,recipient.data())});functions.logger.info('friend_request_sent',{senderId,recipientId});return{status:'pending',requestId:id};});}));
exports.respondToFriendRequest=functions.https.onCall(requireAuth(async(data,context)=>{const id=requireString(data?.requestId,'requestId'),action=data?.action;if(!['accept','decline'].includes(action))throw new functions.https.HttpsError('invalid-argument','Invalid action.');return db.runTransaction(async t=>{const ref=db.doc(`${FRIEND_REQUESTS}/${id}`),s=await t.get(ref);if(!s.exists)throw new functions.https.HttpsError('not-found','Request not found.');const r=s.data();if(r.recipientId!==context.auth.uid)throw new functions.https.HttpsError('permission-denied','Only the recipient may respond.');if(r.status!=='pending'){if(action==='accept'&&r.status==='accepted')return{status:'accepted',friendshipId:pairId(r.senderId,r.recipientId)};throw new functions.https.HttpsError('failed-precondition','Request is no longer pending.');}if(action==='decline'){t.update(ref,{status:'declined',updatedAt:FieldValue.serverTimestamp(),respondedAt:FieldValue.serverTimestamp()});return{status:'declined'};}const fid=pairId(r.senderId,r.recipientId);t.set(db.doc(`${FRIENDSHIPS}/${fid}`),{userIds:[r.senderId,r.recipientId].sort(),createdAt:FieldValue.serverTimestamp(),createdFromRequestId:id,profiles:{[r.senderId]:r.sender,[r.recipientId]:r.recipient},friend:r.sender},{merge:true});t.update(ref,{status:'accepted',updatedAt:FieldValue.serverTimestamp(),respondedAt:FieldValue.serverTimestamp()});functions.logger.info('friendship_created',{friendshipId:fid});return{status:'accepted',friendshipId:fid};});}));
exports.cancelFriendRequest=simplePendingTransition(FRIEND_REQUESTS,'senderId','cancelled');
exports.removeFriend=functions.https.onCall(requireAuth(async(data,context)=>{const id=requireString(data?.friendshipId,'friendshipId'),ref=db.doc(`${FRIENDSHIPS}/${id}`),s=await ref.get();if(!s.exists)return{status:'removed'};if(!s.data().userIds.includes(context.auth.uid))throw new functions.https.HttpsError('permission-denied','Not a friendship participant.');await ref.delete();functions.logger.info('friendship_removed',{friendshipId:id,actorId:context.auth.uid});return{status:'removed'};}));
exports.blockPlayer=functions.https.onCall(requireAuth(async(data,context)=>{const a=context.auth.uid,b=requireString(data?.userId,'userId');if(a===b)throw new functions.https.HttpsError('invalid-argument','You cannot block yourself.');const batch=db.batch();batch.set(db.doc(`${BLOCKS}/${blockId(a,b)}`),{blockerId:a,blockedUserId:b,createdAt:FieldValue.serverTimestamp()});batch.delete(db.doc(`${FRIENDSHIPS}/${pairId(a,b)}`));for(const col of [FRIEND_REQUESTS,INVITATIONS]){const field=col===FRIEND_REQUESTS?'status':'status';const snap=await db.collection(col).where('participantIds','array-contains',a).where(field,'==','pending').get().catch(()=>({docs:[]}));snap.docs.filter(d=>{const x=d.data();return [x.senderId,x.recipientId,x.challengerId].includes(b)}).forEach(d=>batch.update(d.ref,{status:'cancelled',updatedAt:FieldValue.serverTimestamp()}));}await batch.commit();functions.logger.info('player_blocked',{blockerId:a,blockedUserId:b});return{status:'blocked'};}));
exports.unblockPlayer=functions.https.onCall(requireAuth(async(data,context)=>{await db.doc(`${BLOCKS}/${blockId(context.auth.uid,requireString(data?.userId,'userId'))}`).delete();return{status:'unblocked'};}));

exports.sendFriendBattleInvitation=functions.https.onCall(requireAuth(async(data,context)=>{const challengerId=context.auth.uid,recipientId=requireString(data?.recipientId,'recipientId'),rounds=Number(data?.rounds),difficulty=normalizeMatchDifficulty(data?.difficulty);if(challengerId===recipientId)throw new functions.https.HttpsError('invalid-argument','You cannot challenge yourself.');if(!SOCIAL_LIMITS.allowedRounds.includes(rounds))throw new functions.https.HttpsError('invalid-argument','Invalid round count.');await assertNotBlocked(challengerId,recipientId);if(!(await db.doc(`${FRIENDSHIPS}/${pairId(challengerId,recipientId)}`).get()).exists)throw new functions.https.HttpsError('failed-precondition','Only friends can be challenged.');const [a,b,pending]=await Promise.all([db.doc(`${USER_COLLECTION}/${challengerId}`).get(),db.doc(`${USER_COLLECTION}/${recipientId}`).get(),db.collection(INVITATIONS).where('challengerId','==',challengerId).where('status','==','pending').limit(SOCIAL_LIMITS.maxPendingInvitations+1).get()]);if(!a.exists||!b.exists||!eligible(a.data())||!eligible(b.data())||b.data().friendChallengesEnabled===false)throw new functions.https.HttpsError('failed-precondition','This player cannot receive challenges.');if(pending.size>=SOCIAL_LIMITS.maxPendingInvitations)throw new functions.https.HttpsError('resource-exhausted','Too many pending invitations.');const id=pairId(challengerId,recipientId),ref=db.doc(`${INVITATIONS}/${id}`);return db.runTransaction(async t=>{const s=await t.get(ref);if(s.exists&&s.data().status==='pending'&&s.data().expiresAt.toMillis()>Date.now())throw new functions.https.HttpsError('already-exists','A challenge is already pending.');t.set(ref,{challengerId,recipientId,participantIds:[challengerId,recipientId],type:'friend-battle',status:'pending',rounds,difficulty,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp(),expiresAt:Timestamp.fromMillis(Date.now()+SOCIAL_LIMITS.invitationTtlMs),respondedAt:null,matchId:null,challengeToken:createSearchToken(),challenger:safeProfile(challengerId,a.data()),recipient:safeProfile(recipientId,b.data())});functions.logger.info('battle_invitation_sent',{invitationId:id,challengerId,recipientId});return{status:'pending',invitationId:id};});}));
exports.respondToBattleInvitation=functions.https.onCall(requireAuth(async(data,context)=>{const id=requireString(data?.invitationId,'invitationId'),action=data?.action;if(!['accept','decline'].includes(action))throw new functions.https.HttpsError('invalid-argument','Invalid action.');return db.runTransaction(async t=>{const ref=db.doc(`${INVITATIONS}/${id}`),s=await t.get(ref);if(!s.exists)throw new functions.https.HttpsError('not-found','Invitation not found.');const i=s.data();if(i.recipientId!==context.auth.uid)throw new functions.https.HttpsError('permission-denied','Only the recipient may respond.');if(i.status==='accepted'&&i.matchId)return{status:'accepted',matchId:i.matchId};if(i.status!=='pending'||i.expiresAt.toMillis()<=Date.now())throw new functions.https.HttpsError('failed-precondition','Invitation is no longer available.');if(action==='decline'){t.update(ref,{status:'declined',updatedAt:FieldValue.serverTimestamp(),respondedAt:FieldValue.serverTimestamp()});return{status:'declined',matchId:null};}const friendship=await t.get(db.doc(`${FRIENDSHIPS}/${pairId(i.challengerId,i.recipientId)}`));if(!friendship.exists)throw new functions.https.HttpsError('failed-precondition','Players are no longer friends.');const matchId=`friend_${id}`,matchRef=db.doc(`${MATCH_COLLECTION}/${matchId}`),existing=await t.get(matchRef);if(!existing.exists)t.set(matchRef,{id:matchId,mode:'friend-battle',status:'lobby',playerIds:i.participantIds,hostPlayerId:i.challengerId,invitationId:id,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp(),startedAt:null,completedAt:null,roundNumber:1,totalRounds:i.rounds,difficulty:i.difficulty||'mixed',currentTurnPlayerId:null,players:{[i.challengerId]:{...i.challenger,ready:false,joinedLobbyAt:null,score:0,status:'invited'},[i.recipientId]:{...i.recipient,ready:false,joinedLobbyAt:FieldValue.serverTimestamp(),score:0,status:'joined'}}});t.update(ref,{status:'accepted',matchId,updatedAt:FieldValue.serverTimestamp(),respondedAt:FieldValue.serverTimestamp()});functions.logger.info('friend_battle_lobby_created',{matchId,invitationId:id});return{status:'accepted',matchId};});}));
exports.cancelBattleInvitation=simplePendingTransition(INVITATIONS,'challengerId','cancelled');
exports.setLobbyReady=functions.https.onCall(requireAuth(async(data,context)=>{const id=requireString(data?.matchId,'matchId'),ready=data?.ready===true,ref=db.doc(`${MATCH_COLLECTION}/${id}`);await db.runTransaction(async t=>{const s=await t.get(ref);if(!s.exists)throw new functions.https.HttpsError('not-found','Match not found.');const m=s.data(),uid=context.auth.uid;if(!m.playerIds.includes(uid))throw new functions.https.HttpsError('permission-denied','Not a participant.');if(m.status!=='lobby')throw new functions.https.HttpsError('failed-precondition','Match has left the lobby.');t.update(ref,{[`players.${uid}.ready`]:ready,[`players.${uid}.status`]:ready?'ready':'joined',[`players.${uid}.joinedLobbyAt`]:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});});return{status:'lobby',ready};}));
exports.startFriendBattle=functions.https.onCall(requireAuth(async(data,context)=>db.runTransaction(async t=>{const id=requireString(data?.matchId,'matchId'),ref=db.doc(`${MATCH_COLLECTION}/${id}`),s=await t.get(ref);if(!s.exists)throw new functions.https.HttpsError('not-found','Match not found.');const m=s.data();if(!m.playerIds.includes(context.auth.uid)||m.hostPlayerId!==context.auth.uid)throw new functions.https.HttpsError('permission-denied','Only the host can start.');if(m.status==='active')return{status:'active',matchId:id};if(m.status!=='lobby'||!m.playerIds.every(x=>m.players[x]?.ready))throw new functions.https.HttpsError('failed-precondition','Both players must be ready.');t.update(ref,{status:'active',currentTurnPlayerId:m.playerIds[Math.floor(Math.random()*m.playerIds.length)],startedAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp(),[`players.${m.playerIds[0]}.status`]:'playing',[`players.${m.playerIds[1]}.status`]:'playing'});functions.logger.info('friend_battle_started',{matchId:id});return{status:'active',matchId:id};})));
exports.hydrateMatchPlayerProfiles=functions.https.onCall(requireAuth(async(data,context)=>{const matchId=requireString(data?.matchId,'matchId'),matchRef=db.doc(`${MATCH_COLLECTION}/${matchId}`),matchSnapshot=await matchRef.get();if(!matchSnapshot.exists)throw new functions.https.HttpsError('not-found','Match not found.');const match=matchSnapshot.data();if(!Array.isArray(match.playerIds)||!match.playerIds.includes(context.auth.uid))throw new functions.https.HttpsError('permission-denied','Only match participants can load player profiles.');const profiles=await Promise.all(match.playerIds.map(async uid=>{const snapshot=await db.doc(`${USER_COLLECTION}/${uid}`).get();return [uid,snapshot.exists?safeProfile(uid,snapshot.data()):{uid,username:'Explorer',displayName:'Explorer',avatarUrl:null}];}));const updates={updatedAt:FieldValue.serverTimestamp()};const players={};for(const [uid,profile] of profiles){updates[`players.${uid}.username`]=profile.username;updates[`players.${uid}.displayName`]=profile.displayName;updates[`players.${uid}.avatarUrl`]=profile.avatarUrl;players[uid]=profile;}await matchRef.update(updates);return{matchId,players};}));
exports.expireBattleInvitations=functions.pubsub.schedule('every 15 minutes').onRun(async()=>{const s=await db.collection(INVITATIONS).where('status','==','pending').where('expiresAt','<=',Timestamp.now()).limit(100).get();const b=db.batch();s.docs.forEach(d=>b.update(d.ref,{status:'expired',updatedAt:FieldValue.serverTimestamp()}));if(s.size)await b.commit();return null;});

function simplePendingTransition(collectionName,ownerField,nextStatus){return functions.https.onCall(requireAuth(async(data,context)=>{const id=requireString(data?.requestId||data?.invitationId,collectionName==='friendRequests'?'requestId':'invitationId'),ref=db.doc(`${collectionName}/${id}`);return db.runTransaction(async t=>{const s=await t.get(ref);if(!s.exists)return{status:nextStatus};const x=s.data();if(x[ownerField]!==context.auth.uid)throw new functions.https.HttpsError('permission-denied','Not allowed.');if(x.status===nextStatus)return{status:nextStatus};if(x.status!=='pending')throw new functions.https.HttpsError('failed-precondition','Item is no longer pending.');t.update(ref,{status:nextStatus,updatedAt:FieldValue.serverTimestamp()});return{status:nextStatus};});}));}
async function blockedIds(uid){const [a,b]=await Promise.all([db.collection(BLOCKS).where('blockerId','==',uid).get(),db.collection(BLOCKS).where('blockedUserId','==',uid).get()]);return new Set([...a.docs.map(d=>d.data().blockedUserId),...b.docs.map(d=>d.data().blockerId)]);}
async function assertNotBlocked(a,b){const [x,y]=await Promise.all([db.doc(`${BLOCKS}/${blockId(a,b)}`).get(),db.doc(`${BLOCKS}/${blockId(b,a)}`).get()]);if(x.exists||y.exists)throw new functions.https.HttpsError('permission-denied','This interaction is unavailable.');}
function eligible(p){return p&&p.accountStatus!=='suspended'&&p.accountStatus!=='banned'&&p.suspended!==true&&p.banned!==true;}
