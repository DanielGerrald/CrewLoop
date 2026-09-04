import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

import { environment } from "./Config";

const firebaseConfig = {
  apiKey: environment.apikey,
  authDomain: "crewloop-9564f.firebaseapp.com",
  databaseURL: environment.apiUrl,
  projectId: "crewloop-9564f",
  storageBucket: "crewloop-9564f.firebasestorage.app",
  messagingSenderId: "363196013025",
  appId: "1:363196013025:web:86f3941920ac87e7b39aa0"
};

const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export default app;