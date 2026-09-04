import axios from "axios";

import { environment } from "../Config";



export async function getMinimums() {
  try {
    const response = await axios.get(environment.apiUrl + "/version.json");
    const results = response.data;          
    if (!results) return undefined;           
    return {
      minVersion: results.minimum_version,
      minIosVersion: results.minimum_ios_version ?? null,
      minAndroidApi: results.minimum_android_api ?? null,
    };
  } catch (error) {
    console.log("getMinimums Error:", error);
    return undefined;
  }
}