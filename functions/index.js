const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.onNotificationCreated = functions.firestore
    .document("couples/{coupleId}/notifications/latest")
    .onWrite(async (change, context) => {
      const data = change.after.data();
      if (!data) return null;

      const {coupleId} = context.params;
      const {from, message, type} = data;

      // 1. Buscar os dados do casal para saber quem é o parceiro
      const coupleSnap = await admin.firestore().doc(`couples/${coupleId}`).get();
      if (!coupleSnap.exists) return null;

      const coupleData = coupleSnap.data();
      const partnerId = coupleData.partnerA === from ? 
                        coupleData.partnerB : coupleData.partnerA;

      if (!partnerId) return null;

      // 2. Buscar o token FCM do parceiro
      const userSnap = await admin.firestore().doc(`users/${partnerId}`).get();
      if (!userSnap.exists) return null;

      const userData = userSnap.data();
      const fcmToken = userData.fcmToken;

      if (!fcmToken) {
        console.log("Parceiro não tem token FCM registrado.");
        return null;
      }

      // 3. Enviar a notificação via FCM
      const payload = {
        token: fcmToken,
        notification: {
          title: "OnlyUs ❤️",
          body: message,
        },
        data: {
          click_action: "FLUTTER_NOTIFICATION_CLICK", // Para compatibilidade
          type: type || "general",
        },
        android: {
          priority: "high",
          notification: {
            icon: "stock_ticker_update",
            color: "#6366f1",
          },
        },
      };

      try {
        await admin.messaging().send(payload);
        console.log(`Notificação enviada com sucesso para ${partnerId}`);
      } catch (error) {
        console.error("Erro ao enviar notificação:", error);
      }

      return null;
    });
