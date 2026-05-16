const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

exports.testNotification = onDocumentWritten("couples/{coupleId}/notifications/latest", async (event) => {
  const data = event.data.after.data();
  if (!data) return null;

  try {
    const db = getFirestore();
    const messaging = getMessaging();

    const coupleSnap = await db.doc(`couples/${event.params.coupleId}`).get();
    if (!coupleSnap.exists) return null;

    const { partnerA, partnerB } = coupleSnap.data();
    const partnerId = partnerA === data.from ? partnerB : partnerA;
    if (!partnerId) return null;

    const userSnap = await db.doc(`users/${partnerId}`).get();
    if (!userSnap.exists) return null;

    const token = userSnap.data().fcmToken;
    if (!token) return null;

    await messaging.send({
      token: token,
      notification: { title: "OnlyUs ❤️", body: data.message }
    });
  } catch (e) {
    console.error(e);
  }
  return null;
});
