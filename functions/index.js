const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.createMatch = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication is required.');
  }

  return {
    status: 'queued',
    note: 'Cloud Function scaffold ready for trusted match creation.',
    playerId: context.auth.uid,
    inviteCode: data?.inviteCode ?? null
  };
});

exports.joinRandomMatch = functions.https.onCall(async () => ({
  status: 'queued',
  note: 'Cloud Function scaffold ready for random match pairing.'
}));

exports.submitAnswer = functions.https.onCall(async () => ({
  status: 'queued',
  note: 'Cloud Function scaffold ready for trusted answer validation.'
}));

exports.expireTurn = functions.https.onCall(async () => ({
  status: 'queued',
  note: 'Cloud Function scaffold ready for turn expiry handling.'
}));

exports.completeMatch = functions.https.onCall(async () => ({
  status: 'queued',
  note: 'Cloud Function scaffold ready for winner resolution.'
}));

exports.requestRematch = functions.https.onCall(async () => ({
  status: 'queued',
  note: 'Cloud Function scaffold ready for rematch flow.'
}));
