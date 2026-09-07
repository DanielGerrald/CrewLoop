import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

import { environment } from "./Config";

const firebaseConfig = {
  apiKey: environment.apikey,
  authDomain: "ohmly-4a268.firebaseapp.com",
  databaseURL: environment.apiUrl,
  projectId: "ohmly-4a268",
  storageBucket: "ohmly-4a268.firebasestorage.app",
  messagingSenderId: "430708353870",
  appId: "1:430708353870:web:ba30094c61088e32110c1f"
};

const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export default app;