import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

import { environment } from "./Config";

// TODO(rebrand): replace with the new Ohmly Firebase project's config
// (apiKey via .env, messagingSenderId and appId from Project settings).
const firebaseConfig = {
  apiKey: environment.apikey,
  authDomain: "ohmly-xxxxx.firebaseapp.com",
  databaseURL: environment.apiUrl,
  projectId: "ohmly-xxxxx",
  storageBucket: "ohmly-xxxxx.firebasestorage.app",
  messagingSenderId: "363196013025",
  appId: "1:363196013025:web:86f3941920ac87e7b39aa0"
};

const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export default app;