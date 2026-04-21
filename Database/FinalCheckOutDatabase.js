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

export async function postFinalCheckListApi(token, data) {
  try {
    const result = await instance.post(
      "/updateWorkOrderCheckList",
      {
        "WorkOrderCheckList[service_performed]": data.service_perf,
        "WorkOrderCheckList[service_performed_desc]": data.desc_service_perf,
        "WorkOrderCheckList[materials_installed]": data.material_inst,
        "WorkOrderCheckList[materials_installed_desc]": data.desc_material_inst,
        "WorkOrderCheckList[workOrder_100]": data.workOrder_100,
        "WorkOrderCheckList[walkthrough_completed]": data.walkThrough_comp,
        "WorkOrderCheckList[return_needed]": data.return_needed,
        "WorkOrderCheckList[return_needed_desc]": data.desc_return_needed,
        "WorkOrderCheckList[manager_name]": data.manager_name,
        "WorkOrderCheckList[manager_signature]": data.signature_base64,
        "WorkOrderCheckList[job_purchase_order_id]": data.job_purchase_order_id,
        "WorkOrderCheckList[modified_date]": data.modified_date,
      },
      {
        headers: {
          TOKEN: token,
        },
        params: {
          id: data.job_purchase_order_id,
        },
      },
    );
    console.log("Post Final Check list API ran");
    return result?.data?.info?.code === 200;
  } catch (error) {
    const errorMessage =
      error.response?.data?.info?.message ||
      error.message ||
      "An unexpected error occurred.";
    console.log("Post Final Checklist API error:", errorMessage);
  }
}

export async function postFinalCheckoutApi(
  token,
  comment,
  job_purchase_order_id,
) {
  try {
    const result = await instance.post(
      "/finalCheckout",
      {
        "WorkOrderCheckin[comment]": comment,
      },
      {
        headers: { TOKEN: token },
        params: {
          id: job_purchase_order_id,
        },
      },
    );
    return result?.data?.info?.code === 200;
  } catch (error) {
    const errorMessage =
      error.response?.data?.info?.message ||
      error.message ||
      "An unexpected error occurred.";

    console.log("post Final Checkout Api Error:", errorMessage);
    //Alert.alert(error.message);
  }
}

//---------------SQLITE Functions---------------//

export async function insertFinalCheckOutSqlite(db, data) {
  try {
    const columns = Object.keys(data).filter(
      (key) => data[key] !== undefined && data[key] !== null,
    );
    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((key) => data[key]);

    await db.runAsync(
      `INSERT INTO final_checkout (${columns.join(", ")})
         VALUES (${placeholders})`,
      [...values],
    );
    console.log("Insert final checkout function ran");
  } catch (error) {
    console.log("Insert final checkout function failed:", error);
  }
}

export async function selectFinalCheckOutSqlite(db, key, value) {
  try {
    const result = await db.getAllAsync(
      `SELECT * FROM final_checkout WHERE (${key}) = ?`,
      [value],
    );
    return result;
  } catch (error) {
    console.log("Select final checkout function failed:", error);
  }
}

export async function updateFinalCheckOutSqlite(
  db,
  key1,
  value1,
  key2,
  value2,
) {
  try {
    await db.runAsync(
      `UPDATE final_checkout SET (${key1}) = ? WHERE (${key2}) = ?`,
      [value1, value2],
    );
    console.log("Update final checkout function  ran");
  } catch (error) {
    console.log("Update final checkout function failed:", error);
  }
}

export async function cleanupFinalCheckOutSqlite(db, value) {
  try {
    const workOrderIds = value.map((item) => item.work_order.id);
    const placeholders = workOrderIds.map(() => "?").join(", ");

    const query = `DELETE FROM final_checkout WHERE job_purchase_order_id NOT IN (${placeholders})`;

    await db.runAsync(query, workOrderIds);

    console.log("Clean up SQLITE FinalCheckOut function ran");
  } catch (error) {
    console.log("Clean up SQLITE FinalCheckOut failed:", error);
  }
}
