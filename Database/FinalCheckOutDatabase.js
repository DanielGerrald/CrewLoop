import axios from "axios";
import { getUnixTime } from "date-fns";
import { environment } from "../Config";

//---------------API Functions---------------//

export async function postFinalCheckListApi(token, data) {
  try {
    await axios.put(
      environment.apiUrl + `/CHECKLISTS/${data.assignment_id}.json`,
      {
        service_perf: data.service_perf,
        desc_service_perf: data.desc_service_perf,
        material_inst: data.material_inst,
        desc_material_inst: data.desc_material_inst,
        assignment_100: data.assignment_100,
        walkThrough_comp: data.walkThrough_comp,
        return_needed: data.return_needed,
        desc_return_needed: data.desc_return_needed,
        desc_misc_notes: data.desc_misc_notes,
        manager_name: data.manager_name,
        manager_signature: data.signature_base64,
        assignment_id: data.assignment_id,
        modified_date: data.modified_date,
      },
      { params: { auth: token } },
    );
    return true;
  } catch (error) {
    console.log(
      "Post final checklist API error:",
      error.response?.data?.error?.message || error.message,
    );
    return false;
  }
}

export async function getFinalCheckoutApi(token, assignment_id) {
  try {
    const response = await axios.get(
      environment.apiUrl + `/CHECKLISTS/${assignment_id}.json`,
      { params: { auth: token } },
    );
    const data = response.data;
    if (!data) return null;

    return {
      assignment_id: data.assignment_id ?? assignment_id,
      service_perf: data.service_perf,
      desc_service_perf: data.desc_service_perf,
      material_inst: data.material_inst,
      desc_material_inst: data.desc_material_inst,
      assignment_100: data.assignment_100,
      walkThrough_comp: data.walkThrough_comp,
      return_needed: data.return_needed,
      desc_return_needed: data.desc_return_needed,
      desc_misc_notes: data.desc_misc_notes,
      manager_name: data.manager_name,
      signature_base64: data.manager_signature,
      modified_date: data.modified_date,
      syncStatus: "Yes",
    };
  } catch (error) {
    console.log(
      "getFinalCheckoutApi Error:",
      error.response?.data ?? error.message,
    );
    return null;
  }
}

export async function postFinalCheckoutApi(token, comment, assignment_id) {
  try {
    await axios.put(
      environment.apiUrl + `/COMPLETIONS/${assignment_id}.json`,
      {
        comment,
        assignment_id,
        completed_date: getUnixTime(new Date()),
      },
      { params: { auth: token } },
    );
    return true;
  } catch (error) {
    console.log(
      "Post final checkout API error:",
      error.response?.data?.error?.message || error.message,
    );
    return false;
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
      `INSERT INTO completion (${columns.join(", ")}) VALUES (${placeholders})`,
      values,
    );
  } catch (error) {
    console.log("Insert final checkout failed:", error);
  }
}

export async function selectFinalCheckOutSqlite(db, key, value) {
  try {
    return await db.getAllAsync(`SELECT * FROM completion WHERE ${key} = ?`, [
      value,
    ]);
  } catch (error) {
    console.log("Select final checkout failed:", error);
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
    await db.runAsync(`UPDATE completion SET ${key1} = ? WHERE ${key2} = ?`, [
      value1,
      value2,
    ]);
  } catch (error) {
    console.log("Update final checkout failed:", error);
  }
}

export async function deleteFinalCheckOutSqlite(db, assignment_id) {
  try {
    await db.runAsync("DELETE FROM completion WHERE assignment_id = ?", [
      assignment_id,
    ]);
  } catch (error) {
    console.log("Delete final checkout failed:", error);
  }
}

export async function cleanupFinalCheckOutSqlite(db, value) {
  try {
    const workOrderIds = (value ?? []).map((item) => item.assignment.id);

    if (!workOrderIds.length) {
      await db.runAsync("DELETE FROM completion");
      return;
    }

    const placeholders = workOrderIds.map(() => "?").join(", ");
    await db.runAsync(
      `DELETE FROM completion WHERE assignment_id NOT IN (${placeholders})`,
      workOrderIds,
    );
  } catch (error) {
    console.log("Clean up final checkout failed:", error);
  }
}
