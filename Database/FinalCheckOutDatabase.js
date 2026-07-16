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
      "/updateAssignmentChecklist",
      {
        "AssignmentChecklist[service_performed]": data.service_perf,
        "AssignmentChecklist[service_performed_desc]": data.desc_service_perf,
        "AssignmentChecklist[materials_installed]": data.material_inst,
        "AssignmentChecklist[materials_installed_desc]": data.desc_material_inst,
        "AssignmentChecklist[assignment_100]": data.assignment_100,
        "AssignmentChecklist[walkthrough_completed]": data.walkThrough_comp,
        "AssignmentChecklist[return_needed]": data.return_needed,
        "AssignmentChecklist[return_needed_desc]": data.desc_return_needed,
        "AssignmentChecklist[manager_name]": data.manager_name,
        "AssignmentChecklist[manager_signature]": data.signature_base64,
        "AssignmentChecklist[assignment_id]": data.assignment_id,
        "AssignmentChecklist[modified_date]": data.modified_date,
      },
      {
        headers: {
          TOKEN: token,
        },
        params: {
          id: data.assignment_id,
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
  assignment_id,
) {
  try {
    const result = await instance.post(
      "/completeAssignment",
      {
        "AssignmentVisit[comment]": comment,
      },
      {
        headers: { TOKEN: token },
        params: {
          id: assignment_id,
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
      `INSERT INTO completion (${columns.join(", ")})
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
      `SELECT * FROM completion WHERE (${key}) = ?`,
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
      `UPDATE completion SET (${key1}) = ? WHERE (${key2}) = ?`,
      [value1, value2],
    );
    console.log("Update final checkout function  ran");
  } catch (error) {
    console.log("Update final checkout function failed:", error);
  }
}

export async function cleanupFinalCheckOutSqlite(db, value) {
  try {
    const workOrderIds = value.map((item) => item.assignment.id);
    const placeholders = workOrderIds.map(() => "?").join(", ");

    const query = `DELETE FROM completion WHERE assignment_id NOT IN (${placeholders})`;

    await db.runAsync(query, workOrderIds);

    console.log("Clean up SQLITE FinalCheckOut function ran");
  } catch (error) {
    console.log("Clean up SQLITE FinalCheckOut failed:", error);
  }
}
