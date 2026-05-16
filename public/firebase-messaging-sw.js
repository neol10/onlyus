importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCRirvwJiNr0lby9Sd1Ph8fWNH08zjHZG4",
  authDomain: "onlyus-340c4.firebaseapp.com",
  projectId: "onlyus-340c4",
  storageBucket: "onlyus-340c4.firebasestorage.app",
  messagingSenderId: "986821547683",
  appId: "1:986821547683:web:c0ba9bb9413df524395116"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
