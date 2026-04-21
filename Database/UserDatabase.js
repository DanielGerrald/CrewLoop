import axios from "axios";
import { Alert } from "react-native";
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

export async function getLoginApi(data) {
  try {
    let response = await instance.get("/login", {
      params: {
        USERNAME: data.username,
        PASSWORD: data.password,
      },
    });
    if (response.data.info.status === "OK") {
      return Promise.resolve(response.data.results.user);
    }
  } catch (error) {
    console.error("getLogin Error:", error);
  }
}

export async function getUserProfileApi(data) {
  try {
    let response = await instance.get("/userProfile", {
      headers: { TOKEN: data.access_token },
    });
    if (response.data.info.status === "OK") {
      return Promise.resolve(response.data.results);
    }
  } catch (error) {
    console.error("getUserProfile Error:", error);
  }
}

export async function postUserApi(data) {
  try {
    await instance.post(
      "/updateUserProfile",
      {
        "ContractorTech[person][first_name]": data.first_name,
        "ContractorTech[person][last_name]": data.last_name,
        "ContractorTech[person][email]": data.email,
        "ContractorTech[person][phone_nbr]": data.phone_nbr,
        "ContractorTech[person][last_login]": data.last_login,
        "ContractorTech[notify_sms]": data.notify_sms,
        "ContractorTech[notify_email]": data.notify_email,
      },
      { headers: { TOKEN: data.access_token } },
    );
  } catch (error) {
    console.error("postUserAPI Error:", error);
    Alert.alert(error.message);
  }
}

export async function postRecoverPasswordAPI(data) {
  try {
    const results = await instance.post("/recoverPassword", {
      username: data,
    });
    return results.data?.info?.message;
  } catch (error) {
    const errorMessage =
      error.response?.data?.info?.message ||
      error.message ||
      "An unexpected error occurred.";
    console.error("postRecoverPasswordAPI Error:", errorMessage);
    return errorMessage;
  }
}

//---------------SQLITE Functions---------------//

export async function insertUserSqlite(db, data) {
  try {
    const columns = Object.keys(data).filter(
      (key) => data[key] !== undefined && data[key] !== null,
    );
    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((key) => data[key]);

    await db.runAsync(
      `INSERT INTO "user" (${columns.join(", ")}) VALUES (${placeholders})`,
      [...values],
    );
  } catch (error) {
    console.error("Insert User function failed:", error?.message);
  }
}

export async function updateUserSqlite(db, data) {
  try {
    const fieldsToUpdate = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (key !== "username" && value !== undefined && value !== null) {
        fieldsToUpdate.push(`${key} = ?`);
        values.push(value);
      }
    }
    await db.runAsync(
      `UPDATE user SET ${fieldsToUpdate.join(", ")} WHERE username = ? COLLATE NOCASE`,
      [...values, data.username],
    );
  } catch (error) {
    console.error("Update User function failed:", error);
  }
}

export async function lastLoggedinUserSqlite(db) {
  try {
    return await db.getFirstAsync(
      "SELECT * FROM user ORDER BY last_login DESC LIMIT 1",
    );
  } catch (error) {
    console.error("Last logged in user function failed:", error);
    return null;
  }
}

export async function selectUserSqlite(db, data) {
  try {
    return await db.getFirstAsync(
      "SELECT * FROM user WHERE username = ? COLLATE NOCASE",
      [data.username],
    );
  } catch (error) {
    console.error("select user function failed:", error);
  }
}
