async function logUserEvent({ db, userId, action, productId, data = {} }) {
  if (!db || !userId || !action) return;
  try {
    await db.collection('user_activity_logs').insertOne({
      userId,
      action,
      productId: productId || null,
      data,
      timestamp: new Date(),
    });
  } catch (err) {
    // Non-blocking: behavior logging should never break main flow
  }
}

module.exports = { logUserEvent };
