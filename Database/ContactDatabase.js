import axios from "axios";
import { environment } from "../Config";

//---------------API Functions---------------//

export async function getWorkOrderContactsApi(idToken, id) {
  try {
    const response = await axios.get(
      environment.apiUrl + `/CONTACTS/${id}.json`,
      { params: { auth: idToken } },
    );
    return response.data || undefined;
  } catch (error) {
    console.error(
      "getWorkOrderContactsApi Error:",
      error.response?.data ?? error.message,
    );
  }
}

//---------------SQLITE Functions---------------//

export async function insertContactSqlite(db, contact, assignmentId) {
  try {
    const storeContact = {
      site_contact_id: contact.site_contact.id,
      site_contact_first_name: contact.site_contact.first_name,
      site_contact_last_name: contact.site_contact.last_name,
      site_contact_phone_nbr: contact.site_contact.phone_nbr,
      site_contact_phone_nbr_ext: contact.site_contact.phone_nbr_ext,
      site_contact_fax_nbr: contact.site_contact.fax_nbr,
      site_contact_mobile_nbr: contact.site_contact.mobile_nbr,
      site_contact_email: contact.site_contact.email,
      site_contact_is_employee: contact.site_contact.is_employee,
      site_contact_after_hours_nbr: contact.site_contact.after_hours_nbr,
      site_contact_contact_type: contact.site_contact.contact_type,
    };
    const jobCoordinator = {
      account_manager_id: contact.account_manager.id,
      account_manager_first_name: contact.account_manager.first_name,
      account_manager_last_name: contact.account_manager.last_name,
      account_manager_phone_nbr: contact.account_manager.phone_nbr,
      account_manager_phone_nbr_ext: contact.account_manager.phone_nbr_ext,
      account_manager_fax_nbr: contact.account_manager.fax_nbr,
      account_manager_mobile_nbr: contact.account_manager.mobile_nbr,
      account_manager_email: contact.account_manager.email,
      account_manager_is_employee: contact.account_manager.is_employee,
      account_manager_after_hours_nbr: contact.account_manager.after_hours_nbr,
    };
    const companyInfo = {
      vendor_contact_id: contact.vendor_contact.id,
      vendor_contact_first_name: contact.vendor_contact.first_name,
      vendor_contact_last_name: contact.vendor_contact.last_name,
      vendor_contact_phone_nbr: contact.vendor_contact.phone_nbr,
      vendor_contact_phone_nbr_ext: contact.vendor_contact.phone_nbr_ext,
      vendor_contact_fax_nbr: contact.vendor_contact.fax_nbr,
      vendor_contact_mobile_nbr: contact.vendor_contact.mobile_nbr,
      vendor_contact_email: contact.vendor_contact.email,
      vendor_contact_is_employee: contact.vendor_contact.is_employee,
      vendor_contact_after_hours_nbr: contact.vendor_contact.after_hours_nbr,
      vendor_contact_contact_type: contact.vendor_contact.contact_type,
    };

    const data = {
      ...storeContact,
      ...jobCoordinator,
      ...companyInfo,
      assignment_id: assignmentId,
    };

    const columns = Object.keys(data).filter(
      (key) => data[key] !== undefined && data[key] !== null,
    );
    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((key) => data[key]);

    await db.runAsync(
      `INSERT OR REPLACE INTO contact (${columns.join(", ")}) VALUES (${placeholders})`,
      values,
    );
  } catch (error) {
    console.error("Error inserting contact:", error);
  }
}

export async function selectContactSqlite(db, key, value) {
  try {
    return await db.getAllAsync(`SELECT * FROM contact WHERE ${key} = ?`, [
      value,
    ]);
  } catch (error) {
    console.log("Select contacts failed:", error);
  }
}

export async function cleanupContactSqlite(db, value) {
  try {
    const workOrderIds = (value ?? []).map((item) => item.assignment.id);

    if (!workOrderIds.length) {
      await db.runAsync("DELETE FROM contact");
      return;
    }

    const placeholders = workOrderIds.map(() => "?").join(", ");
    await db.runAsync(
      `DELETE FROM contact WHERE assignment_id NOT IN (${placeholders})`,
      workOrderIds,
    );
  } catch (error) {
    console.log("Clean up contacts failed:", error);
  }
}
