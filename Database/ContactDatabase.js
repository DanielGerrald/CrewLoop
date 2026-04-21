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

export async function getWorkOrderContactsApi(access_token, id) {
  try {
    const response = await instance.get("/workOrderContacts", {
      headers: {
        TOKEN: access_token,
      },
      params: {
        id: id,
      },
    });
    return Promise.resolve(response.data.results);
  } catch (error) {
    console.log("ERROR WorkOrderContacts API call:", error);
  }
}

//---------------SQLITE Functions---------------//

export async function insertContactSqlite(db, contact) {
  try {
    const jobPurchaseOrderId = {
      job_purchase_order_id: contact.job_purchase_order_id,
    };

    const storeContact = {
      store_contacts_id: contact.store_contacts.id,
      store_contacts_first_name: contact.store_contacts.first_name,
      store_contacts_last_name: contact.store_contacts.last_name,
      store_contacts_phone_nbr: contact.store_contacts.phone_nbr,
      store_contacts_phone_nbr_ext: contact.store_contacts.phone_nbr_ext,
      store_contacts_fax_nbr: contact.store_contacts.fax_nbr,
      store_contacts_mobile_nbr: contact.store_contacts.mobile_nbr,
      store_contacts_email: contact.store_contacts.email,
      store_contacts_is_employee: contact.store_contacts.is_employee,
      store_contacts_after_hours_nbr: contact.store_contacts.after_hours_nbr,
      store_contacts_contact_type: contact.store_contacts.contact_type,
    };
    const jobCoordinator = {
      job_coordinator_id: contact.job_coordinator.id,
      job_coordinator_first_name: contact.job_coordinator.first_name,
      job_coordinator_last_name: contact.job_coordinator.last_name,
      job_coordinator_phone_nbr: contact.job_coordinator.phone_nbr,
      job_coordinator_phone_nbr_ext: contact.job_coordinator.phone_nbr_ext,
      job_coordinator_fax_nbr: contact.job_coordinator.fax_nbr,
      job_coordinator_mobile_nbr: contact.job_coordinator.mobile_nbr,
      job_coordinator_email: contact.job_coordinator.email,
      job_coordinator_is_employee: contact.job_coordinator.is_employee,
      job_coordinator_after_hours_nbr: contact.job_coordinator.after_hours_nbr,
    };
    const companyInfo = {
      company_info_id: contact.company_info.id,
      company_info_first_name: contact.company_info.first_name,
      company_info_last_name: contact.company_info.last_name,
      company_info_phone_nbr: contact.company_info.phone_nbr,
      company_info_phone_nbr_ext: contact.company_info.phone_nbr_ext,
      company_info_fax_nbr: contact.company_info.fax_nbr,
      company_info_mobile_nbr: contact.company_info.mobile_nbr,
      company_info_email: contact.company_info.email,
      company_info_is_employee: contact.company_info.is_employee,
      company_info_after_hours_nbr: contact.company_info.after_hours_nbr,
      company_info_contact_type: contact.company_info.contact_type,
    };

    const data = {
      ...storeContact,
      ...jobCoordinator,
      ...companyInfo,
      ...jobPurchaseOrderId,
    };

    const columns = Object.keys(data).filter(
      (key) => data[key] !== undefined && data[key] !== null,
    );
    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((key) => data[key]);

    await db.runAsync(
      `INSERT OR REPLACE INTO contact (${columns.join(", ")}) VALUES (${placeholders})`,
      [...values],
    );

    console.log("Insert Contacts function ran");
  } catch (error) {
    console.error("Error inserting contact:", error);
  }
}

export async function selectContactSqlite(db, key, value) {
  try {
    return await db.getAllAsync(
      `SELECT * FROM contact WHERE (${key}) = (${value})`,
    );
  } catch (error) {
    console.log("Select SQLITE contacts failed:", error);
  }
}

export async function cleanupContactSqlite(db, value) {
  try {
    const workOrderIds = value.map((item) => item.work_order.id);
    const placeholders = workOrderIds.map(() => "?").join(", ");

    const query = `DELETE FROM contact WHERE job_purchase_order_id NOT IN (${placeholders})`;

    await db.runAsync(query, workOrderIds);

    console.log("Clean up SQLITE contact function ran");
  } catch (error) {
    console.log("Clean up SQLITE contact failed:", error);
  }
}
