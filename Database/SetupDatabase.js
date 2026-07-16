import { environment } from "../Config";

export default async function setupDatabase(db) {
  const DATABASE_VERSION = 9;

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
        await db.execAsync("DROP TABLE IF EXISTS assignment");
        await db.execAsync("DROP TABLE IF EXISTS contact");
        await db.execAsync("DROP TABLE IF EXISTS category_type");
        await db.execAsync("DROP TABLE IF EXISTS attachment");
        await db.execAsync("DROP TABLE IF EXISTS checkinout");
        await db.execAsync("DROP TABLE IF EXISTS visit");
        await db.execAsync("DROP TABLE IF EXISTS final_checkout");
        await db.execAsync("DROP TABLE IF EXISTS completion");

        console.log("Dropped tables successfully.");
      } catch (error) {
        console.error("Transaction failed:", error);
      }

      try {
        await db.execAsync(`
                CREATE TABLE IF NOT EXISTS user
                (
                  user_id           INTEGER PRIMARY KEY,
                  vendor_id         INTEGER,
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
                CREATE TABLE IF NOT EXISTS assignment
                (
                  id                  INTEGER PRIMARY KEY,
                  addr_1              TEXT,
                  addr_2              TEXT,
                  addr_3              TEXT,
                  category            TEXT,
                  checked_in          INTEGER,
                  city                TEXT,
                  completed           INTEGER DEFAULT 0,
                  vendor_id           INTEGER,
                  vendor_name         TEXT,
                  vendor_requirements TEXT,
                  created_date        TEXT,
                  desc_of_work        TEXT,
                  due_date            TEXT,
                  entered_date        TEXT,
                  reference_code      TEXT,
                  site_id             INTEGER,
                  latitude            NUMERIC,
                  location_name       TEXT,
                  longitude           NUMERIC,
                  name                TEXT,
                  phone_nbr           TEXT,
                  scheduled_date      INTEGER,
                  start_date          TEXT,
                  state               TEXT,
                  store_nbr           TEXT,
                  type                TEXT,
                  user_id             INTEGER,
                  status_label        TEXT,
                  zip                 INTEGER,
                  company_name        TEXT
                )
              `);

        await db.execAsync(`
                CREATE TABLE IF NOT EXISTS contact
                (
                  assignment_id                   INTEGER PRIMARY KEY,
                  vendor_contact_id                TEXT,
                  vendor_contact_first_name        TEXT,
                  vendor_contact_last_name         TEXT,
                  vendor_contact_phone_nbr         TEXT,
                  vendor_contact_phone_nbr_ext     TEXT,
                  vendor_contact_fax_nbr           TEXT,
                  vendor_contact_mobile_nbr        TEXT,
                  vendor_contact_email             TEXT,
                  vendor_contact_is_employee       TEXT,
                  vendor_contact_after_hours_nbr   TEXT,
                  vendor_contact_contact_type      TEXT,
                  site_contact_id                  TEXT,
                  site_contact_first_name          TEXT,
                  site_contact_last_name           TEXT,
                  site_contact_phone_nbr           TEXT,
                  site_contact_phone_nbr_ext       TEXT,
                  site_contact_fax_nbr             TEXT,
                  site_contact_mobile_nbr          TEXT,
                  site_contact_email               TEXT,
                  site_contact_is_employee         TEXT,
                  site_contact_after_hours_nbr     TEXT,
                  site_contact_contact_type        TEXT,
                  account_manager_id               TEXT,
                  account_manager_first_name       TEXT,
                  account_manager_last_name        TEXT,
                  account_manager_phone_nbr        TEXT,
                  account_manager_phone_nbr_ext    TEXT,
                  account_manager_fax_nbr          TEXT,
                  account_manager_mobile_nbr       TEXT,
                  account_manager_email            TEXT,
                  account_manager_is_employee      TEXT,
                  account_manager_after_hours_nbr  TEXT
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
                  id                INTEGER PRIMARY KEY NOT NULL,
                  date              INTEGER,
                  fileName          TEXT,
                  label             TEXT,
                  label_id          TEXT,
                  uri               BLOB,
                  type              TEXT,
                  assignment_id     INTEGER,
                  assignment_ref_id INTEGER,
                  base64            BLOB,
                  location          TEXT,
                  mimeType          TEXT,
                  syncStatus        TEXT
                )
              `);

        await db.execAsync(`
                CREATE TABLE IF NOT EXISTS visit
                (
                  id                INTEGER PRIMARY KEY NOT NULL,
                  crew_member_id    INTEGER,
                  assignment_id     INTEGER,
                  comment           TEXT,
                  visit_date        INTEGER,
                  departing         INTEGER,
                  work_completed    INTEGER,
                  syncStatus        TEXT
                )
              `);

        await db.execAsync(`
                CREATE TABLE IF NOT EXISTS completion
                (
                  id                          INTEGER PRIMARY KEY,
                  service_perf                TEXT,
                  desc_service_perf           TEXT,
                  material_inst               TEXT,
                  desc_material_inst          TEXT,
                  assignment_100              TEXT,
                  walkThrough_comp            TEXT,
                  return_needed               TEXT,
                  desc_return_needed          TEXT,
                  desc_misc_notes             TEXT,
                  manager_name                TEXT,
                  signature_base64            BLOB,
                  signature_size              INTEGER,
                  signature_md5               INTEGER,
                  signature_modification_time INTEGER,
                  assignment_id               INTEGER,
                  modified_date               INTEGER,
                  syncStatus                  TEXT
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
