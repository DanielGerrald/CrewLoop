import axios from "axios";

import { environment } from "../Config";

//---------------API Functions---------------//

const instance = axios.create({
  baseURL: environment.apiUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  params: {
    apikey: environment.apikey,
  },
});

export async function getMinimums() {
  try {
    let response = await instance.get("/version");
    if (response.data.info.status === "OK") {
      const results = response.data.results;
      return {
        minVersion: results.minimum_version,
        // Optional fields — backend can add these to enforce OS minimums remotely.
        // Falls back to DEFAULT_MIN_* constants in UpdateGate.js if absent.
        minIosVersion: results.minimum_ios_version ?? null,
        minAndroidApi: results.minimum_android_api ?? null,
      };
    }
  } catch (error) {
    console.log("getMinimums Error:", error);
  }
}
