import axios from "axios";

import Config from "../Config";

const instance = axios.create({
  baseURL: Config.apiUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  params: {
    apikey: Config.apikey,
  },
});

export async function getWorkOrderApi(data) {
  try {
    const response = await instance.get("/contractorApi/workOrders", {
      headers: {
        "ARCMC-TOKEN": data.access_token,
      },
    });
    return Promise.resolve(response.data.results);
  } catch (error) {
    console.log("WorkOrder API call:", error);
  }
}
