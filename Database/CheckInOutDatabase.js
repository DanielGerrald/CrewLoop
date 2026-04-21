import axios from "axios";
import { getUnixTime } from "date-fns";
import { environment } from "../Config";


//---------------Axios instance---------------//

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


//---------------API Functions---------------//

export async function getCheckInOutApi(token, id) {
  try {
    const response = await instance.get("/workOrderCheckins", {
      headers: { TOKEN: token },
      params: { id },
    });
    return response.data?.results ?? [];
  } catch (error) {
    console.log("Get Check In/Out API call error:", error);
    return [];
  }
}

export async function postCheckInOutApi(
    data,
    token
){
  const body = {
    "WorkOrderCheckin[comment]": data.comment,
    "WorkOrderCheckin[checking_out]": data.checking_out,
    "WorkOrderCheckin[contractor_tech_id]": data.contractor_tech_id,
    "WorkOrderCheckin[job_purchase_order_id]": data.job_purchase_order_id,
    "WorkOrderCheckin[checkin_date]": data.checkin_date,
    //"WorkOrderCheckin[work_completed]":
  };

  const result = await instance.post("/workOrderCheckin", body, {
    headers: { TOKEN: token },
    params: { id: data.job_purchase_order_id },
  });

  console.log("Post check in/out API response:", result.data);
  return result?.data?.info?.code === 200;
}

//---------------SQLITE Functions---------------//

export async function insertCheckInOutSqlite(
    db,
    data
) {
  try {
    if (data.checkin_date == null || data.checkin_date === "") {
      data = { ...data, checkin_date: getUnixTime(new Date()) };
    }

    const columns = Object.keys(data).filter(
        (key) => data[key] !== undefined && data[key] !== null,
    );
    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((key) => data[key]);

    await db.runAsync(
        `INSERT OR REPLACE INTO checkinout (${columns.join(", ")}) VALUES (${placeholders})`,
        values,
    );
    console.log("Insert SQLITE check in/out ran");
  } catch (error) {
    console.log("Insert SQLITE Check in/out failed:", error);
  }
}

export async function selectCheckInOutSqlite(
    db,
    key,
    value,
    orderBy = "id",
    order = "ASC"
) {
  try {
    return await db.getAllAsync(
        `SELECT * FROM checkinout WHERE ${key} = ? ORDER BY ${orderBy} ${order}`,
        [value],
    );
  } catch (error) {
    console.log("Select SQLITE Check in/out failed:", error);
    return [];
  }
}


export async function deleteCheckInOutDuplicatesSqlite(db, serverRecord) {
  if (
    serverRecord.id == null ||
    serverRecord.checkin_date == null ||
    serverRecord.job_purchase_order_id == null
  ) return;

  try {
    await db.runAsync(
      `DELETE FROM checkinout
       WHERE job_purchase_order_id = ?
         AND checkin_date = ?
         AND checking_out = ?
         AND id != ?`,
      [
        serverRecord.job_purchase_order_id,
        serverRecord.checkin_date,
        serverRecord.checking_out,
        serverRecord.id,
      ],
    );
  } catch (error) {
    console.log("Delete duplicate check-in/out failed:", error);
  }
}

export async function updateCheckInOutSqlite(db, value, id) {
  try {
    await db.runAsync(
        `UPDATE CheckInOut
         SET submittedToARC = ?
         WHERE id = ?`,
        [value, id]
    );
    console.log("Update SQLITE check in/out ran");
  } catch(error) {
    console.log("Update SQLITE Check in/out failed:", error);
  }
}




export async function cleanupCheckInOutSqlite(
    db,
    value,
) {
  try {
    const workOrderIds = (value ?? []).map((item) => item.work_order.id);

    if (!workOrderIds.length) {
      await db.runAsync(`DELETE FROM checkinout`);
      console.log("Clean up SQLITE CheckInOut: cleared all");
      return;
    }

    const placeholders = workOrderIds.map(() => "?").join(", ");
    const query = `DELETE FROM checkinout WHERE job_purchase_order_id NOT IN (${placeholders})`;
    await db.runAsync(query, workOrderIds);

    console.log("Clean up SQLITE CheckInOut ran");
  } catch (error) {
    console.log("Clean up SQLITE CheckInOut failed:", error);
  }
}


