import { environment } from "../Config";

export default async function setupDatabase(db) {
  const DATABASE_VERSION = 6;

  try {
    let { user_version: currentDbVersion } = await db.getFirstAsync(
      "PRAGMA user_version",
    );
    currentDbVersion = parseInt(currentDbVersion, 10);

    const sqliteVersion = await db.getFirstAsync("SELECT sqlite_version()");
    console.log("SQLite Version:", sqliteVersion);
    console.log("Current DB Version:", currentDbVersion);
    console.log("Expected DB Version:", DATABASE_VERSION);

    if (currentDbVersion === DATABASE_VERSION) {
      console.log("SQLite database ready");
      console.log("Environment:", environment.icon, environment.envName);
      //console.log("apiUrl:", environment.apiUrl);
      return;
    } else {
      console.log("Database schema is outdated. Rebuilding...");

      try {
        await db.execAsync("DROP TABLE IF EXISTS user");
        await db.execAsync("DROP TABLE IF EXISTS workorder");
        await db.execAsync("DROP TABLE IF EXISTS contact");
        await db.execAsync("DROP TABLE IF EXISTS category_type");
        await db.execAsync("DROP TABLE IF EXISTS attachment");
        await db.execAsync("DROP TABLE IF EXISTS checkinout");
        await db.execAsync("DROP TABLE IF EXISTS final_checkout");

        console.log("Dropped tables successfully.");
      } catch (error) {
        console.error("Transaction failed:", error);
      }

      try {
        await db.execAsync(`
                CREATE TABLE IF NOT EXISTS user
                (
                  user_id           INTEGER PRIMARY KEY,
                  contractor_id     INTEGER,
                  company_name      TEXT,
                  username          TEXT,
                  first_name        TEXT,
                  last_name         TEXT,
                  email             TEXT,
                  phone_nbr         TEXT,
                  mobile_nbr        TEXT,
                  fax_nbr           TEXT,
                  active            TEXT,
                  created_on        TEXT,
                  access_token      TEXT,
                  token_expire_date INTEGER,
                  notify_sms        INTEGER DEFAULT (0),
                  notify_email      INTEGER DEFAULT (0),
                  avatar            BLOB,
                  last_login        INTEGER,
                  logged_in         INTEGER DEFAULT (0),
                  uuid              TEXT
                )
              `);

        await db.execAsync(`
                CREATE TABLE IF NOT EXISTS workorder
                (
                  id                      INTEGER PRIMARY KEY,
                  addr_1                  TEXT,
                  addr_2                  TEXT,
                  addr_3                  TEXT,
                  category                TEXT,
                  checked_in              INTEGER,
                  city                    TEXT,
                  completed               INTEGER DEFAULT 0,
                  contractor_id           INTEGER,
                  contractor_name         TEXT,
                  contractor_requirements TEXT,
                  created_date            TEXT,
                  desc_of_work            TEXT,
                  due_date                TEXT,
                  entered_date            TEXT,
                  expanded_id             TEXT,
                  job_id                  INTEGER,
                  latitude                NUMERIC,
                  location_name           TEXT,
                  longitude               NUMERIC,
                  name                    TEXT,
                  phone_nbr               TEXT,
                  scheduled_date          INTEGER,
                  start_date              TEXT,
                  state                   TEXT,
                  store_nbr               TEXT,
                  type                    TEXT,
                  user_id                 INTEGER,
                  workflow_step_label     TEXT,
                  zip                     INTEGER
                )
              `);

        await db.execAsync(`
                CREATE TABLE IF NOT EXISTS contact
                (
                  id                              INTEGER PRIMARY KEY,
                  job_purchase_order_id           INTEGER,
                  company_info_first_name         TEXT,
                  company_info_last_name          TEXT,
                  company_info_phone_nbr          TEXT,
                  company_info_phone_nbr_ext      TEXT,
                  company_info_fax_nbr            TEXT,
                  company_info_mobile_nbr         TEXT,
                  company_info_email              TEXT,
                  company_info_is_employee        TEXT,
                  company_info_after_hours_nbr    TEXT,
                  company_info_contact_type       TEXT,
                  store_contacts_id               TEXT,
                  store_contacts_first_name       TEXT,
                  store_contacts_last_name        TEXT,
                  store_contacts_phone_nbr        TEXT,
                  store_contacts_phone_nbr_ext    TEXT,
                  store_contacts_fax_nbr          TEXT,
                  store_contacts_mobile_nbr       TEXT,
                  store_contacts_email            TEXT,
                  store_contacts_is_employee      TEXT,
                  store_contacts_after_hours_nbr  TEXT,
                  store_contacts_contact_type     TEXT,
                  job_coordinator_id              TEXT,
                  job_coordinator_first_name      TEXT,
                  job_coordinator_last_name       TEXT,
                  job_coordinator_phone_nbr       TEXT,
                  job_coordinator_phone_nbr_ext   TEXT,
                  job_coordinator_fax_nbr         TEXT,
                  job_coordinator_mobile_nbr      TEXT,
                  job_coordinator_email           TEXT,
                  job_coordinator_is_employee     TEXT,
                  job_coordinator_after_hours_nbr TEXT
                )
              `);

        await db.execAsync(`
                CREATE TABLE IF NOT EXISTS category_type
                (
                  type_id             INTEGER PRIMARY KEY,
                  type_category_id    TEXT,
                  type_label          TEXT,
                  type_category_label TEXT,
                  type_group          TEXT
                )
              `);

        await db.execAsync(`
                CREATE TABLE IF NOT EXISTS attachment
                (
                  id                    INTEGER PRIMARY KEY NOT NULL,
                  date                  INTEGER,
                  fileName              TEXT,
                  label                 TEXT,
                  label_id              TEXT,
                  uri                   BLOB,
                  type                  TEXT,
                  job_purchase_order_id INTEGER,
                  workord_id            INTEGER,
                  base64                BLOB,
                  location              TEXT,
                  mimeType              TEXT,
                  submittedToARC        TEXT
                )
              `);

        await db.execAsync(`
                CREATE TABLE IF NOT EXISTS checkinout
                (
                  id                    INTEGER PRIMARY KEY NOT NULL,
                  contractor_tech_id    INTEGER,
                  job_purchase_order_id INTEGER,
                  comment               TEXT,
                  checkin_date          INTEGER,
                  checking_out          INTEGER,
                  work_completed        INTEGER,
                  submittedToARC        TEXT
                )
              `);

        await db.execAsync(`
                CREATE TABLE IF NOT EXISTS final_checkout
                (
                  id                          INTEGER PRIMARY KEY,
                  service_perf                TEXT,
                  desc_service_perf           TEXT,
                  material_inst               TEXT,
                  desc_material_inst          TEXT,
                  workOrder_100               TEXT,
                  walkThrough_comp            TEXT,
                  return_needed               TEXT,
                  desc_return_needed          TEXT,
                  desc_misc_notes             TEXT,
                  manager_name                TEXT,
                  signature_base64            BLOB,
                  signature_size              INTEGER,
                  signature_md5               INTEGER,
                  signature_modification_time INTEGER,
                  job_purchase_order_id       INTEGER,
                  modified_date               INTEGER,
                  submittedToARC              TEXT
                )
              `);

        console.log("Database schema updated successfully.");
      } catch (error) {
        console.error("Transaction failed:", error);
      }
    }

    await db.execAsync("PRAGMA journal_mode = WAL");
    await db.execAsync("PRAGMA foreign_keys = ON");
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    console.log(`Database version updated to: ${DATABASE_VERSION}`);
  } catch (error) {
    console.error("Error setting up database:", error);
  }

  console.log("SQLite database setup complete.");
  console.log("Environment:", environment.icon, environment.envName);
}
