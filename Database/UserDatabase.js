import axios from "axios";
import { environment } from "../Config";

//---------------API Functions---------------//



export async function getLoginApi(data) {

    const response = await axios.post(
      'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + environment.apikey,
      {
        email: data.username,
        password: data.password,
        returnSecureToken: true,
      }
    )
  
    return response.data;
  
}

export async function getUserProfileApi(data) {
  try {
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${environment.apikey}`,
      { idToken: data.idToken },
    );
    const user = response.data.users?.[0];
    if (!user) return undefined;

    const displayName = user.displayName || "";
    const [first_name = "", ...rest] = displayName.split(" ");

    return {
      displayName,
      first_name,
      last_name: rest.join(" "),
      email: user.email,
      localId: user.localId,
    };
  } catch (error) {
    console.error(
      "getUserProfile Error:",
      error.response?.data?.error?.message || error.message,
    );
  }
}

export async function postUserApi(data) {
  try {
    const authResponse = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${environment.apikey}`,
      {
        idToken: data.idToken,
        displayName: data.displayName,
        returnSecureToken: true,
      },
    );
    const idToken = authResponse.data.idToken;
    const refreshToken = authResponse.data.refreshToken;

    return { ...data, idToken, refreshToken };
  } catch (error) {
    console.error(
      "postUserApi Error:",
      error.response?.data?.error?.message || error.message,
    );
  }
}

// Avatar images are stored as a data URI (base64) directly in the
// Realtime Database rather than Firebase Storage, matching how attachment
// photos/signatures are handled elsewhere in this app.
export async function postUserAvatarApi(idToken, localId, base64, mimeType) {
  try {
    await axios.put(
      environment.apiUrl + `/AVATARS/${localId}.json`,
      { base64, mimeType },
      { params: { auth: idToken } },
    );
    return true;
  } catch (error) {
    console.log(
      "postUserAvatarApi Error:",
      error.response?.data ?? error.message,
    );
    return false;
  }
}

export async function getUserAvatarApi(idToken, localId) {
  try {
    const response = await axios.get(
      environment.apiUrl + `/AVATARS/${localId}.json`,
      { params: { auth: idToken } },
    );
    const data = response.data;
    if (!data?.base64) return null;
    return `data:${data.mimeType || "image/jpeg"};base64,${data.base64}`;
  } catch (error) {
    console.log(
      "getUserAvatarApi Error:",
      error.response?.data ?? error.message,
    );
    return null;
  }
}

export async function requestEmailChangeApi(idToken, newEmail) {
  try {
    await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${environment.apikey}`,
      {
        requestType: "VERIFY_AND_CHANGE_EMAIL",
        idToken,
        newEmail,
      },
    );
    return { success: true };
  } catch (error) {
    const errorCode = error.response?.data?.error?.message;
    console.error("requestEmailChangeApi Error:", errorCode || error.message);
    return { success: false, errorCode };
  }
}

export async function postRecoverPasswordAPI(email) {
  try {
    await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${environment.apikey}`,
      {
        requestType: "PASSWORD_RESET",
        email,
      },
    );
    return `A password reset link has been sent to ${email}.`;
  } catch (error) {
    const errorMessage =
      error.response?.data?.error?.message ||
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
      `INSERT OR REPLACE INTO "user" (${columns.join(", ")}) VALUES (${placeholders})`,
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
      if (key !== "localId" && value !== undefined && value !== null) {
        fieldsToUpdate.push(`${key} = ?`);
        values.push(value);
      }
    }
    await db.runAsync(
      `UPDATE user SET ${fieldsToUpdate.join(", ")} WHERE localId = ?`,
      [...values, data.localId],
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
      "SELECT * FROM user WHERE localId = ?",
      [data],
    );
  } catch (error) {
    console.error("select user function failed:", error);
  }
}

export async function selectUserByEmailSqlite(db, email) {
  try {
    return await db.getFirstAsync(
      "SELECT * FROM user WHERE email = ?",
      [email],
    );
  } catch (error) {
    console.error("select user by email function failed:", error);
  }
}
