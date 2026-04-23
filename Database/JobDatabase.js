import axios from "axios";

import { environment } from "../Config";

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

export async function getWorkOrderApi(data) {
  try {
    const response = await instance.get("/contractorApi/workOrders", {
      headers: {
        "CREWLOOP-TOKEN": data.access_token,
      },
    });
    return Promise.resolve(response.data.results);
  } catch (error) {
    console.log("WorkOrder API call:", error);
  }
}
