import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// User-provided Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyCPzjFyqtOUfjuv0RGotHDiiqfLIfNMxfY",
  authDomain: "materialx-9be3b.firebaseapp.com",
  projectId: "materialx-9be3b",
  storageBucket: "materialx-9be3b.appspot.com",
  messagingSenderId: "977422050142",
  appId: "1:977422050142:web:faaa96ca2e34460561a5cf"
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };
