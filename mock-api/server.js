/**
 * CrewLoop Demo Mock API Server
 * ─────────────────────────────
 * Simulates the CrewLoop backend CRM API with realistic sample data.
 * All data is in-memory — restarting the server resets to defaults.
 *
 * Usage:
 *   npm run mock-api
 *   Server runs at http://localhost:3001
 */

const express = require("express");
const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function okResponse(res, results, message = "OK") {
  return res.json({ info: { status: "OK", message }, results });
}

function errorResponse(res, message, statusCode = 400) {
  return res.status(statusCode).json({ info: { status: "ERROR", message }, results: null });
}

function requireToken(req, res) {
  if (!req.headers["token"]) {
    errorResponse(res, "Missing auth token.", 401);
    return false;
  }
  return true;
}

// ─── Sample Data ─────────────────────────────────────────────────────────────

const USERS = [
  {
    user_id: 101,
    contractor_id: 5,
    company_name: "Apex Field Services LLC",
    username: "demo",
    first_name: "Marcus",
    last_name: "Rivera",
    email: "marcus.rivera@apexfield.com",
    phone_nbr: "704-555-0192",
    mobile_nbr: "704-555-0193",
    active: "Y",
    access_token: "demo-token-abc123",
    token_expire_date: 9999999999,
    notify_sms: 1,
    notify_email: 1,
    uuid: "usr-101-demo",
  },
];

const ATTACHMENT_TYPES = {
  document_types: [
    { type_id: 1, type_category_id: "PERMIT", type_label: "Permit / Approval",  type_category_label: "Documents" },
    { type_id: 2, type_category_id: "SPEC",   type_label: "Spec Sheet",          type_category_label: "Documents" },
    { type_id: 3, type_category_id: "MISC",   type_label: "Miscellaneous Doc",   type_category_label: "Documents" },
  ],
  photo_types: [
    { type_id: 4, type_category_id: "BEFORE", type_label: "Before Photo",   type_category_label: "Photos" },
    { type_id: 5, type_category_id: "AFTER",  type_label: "After Photo",    type_category_label: "Photos" },
    { type_id: 6, type_category_id: "ISSUE",  type_label: "Issue / Defect", type_category_label: "Photos" },
  ],
  comment_types: [
    { type_id: 7, type_category_id: "SITE",  type_label: "Site Note",    type_category_label: "Comments" },
    { type_id: 8, type_category_id: "SCOPE", type_label: "Scope Change", type_category_label: "Comments" },
  ],
};

// Shape the app expects from GET /workOrders: [{ work_order, job, customer }]
const WORK_ORDERS = [
  {
    work_order: {
      id: 1001,
      name: "Riverside Distribution Center",
      addr_1: "4820 Logistics Pkwy",
      addr_2: "",
      addr_3: "",
      city: "Charlotte",
      state: "NC",
      zip: 28273,
      phone_nbr: "704-555-0210",
      latitude: 35.1495,
      longitude: -80.9779,
      desc_of_work: "Replace 48 fluorescent T8 fixtures with LED panel lights in warehouse aisle sections B4–B9. Includes ballast removal and fixture disposal.",
      contractor_requirements: "Hard hat and safety vest required. Check in with site supervisor on arrival. Work hours: 6am–2pm only.",
      category: "LED Retrofit",
      type: "Commercial",
      workflow_step_label: "Scheduled",
      scheduled_date: 1748000000,
      due_date: "2025-06-15",
      start_date: "2025-05-22",
      entered_date: "2025-05-01",
      created_date: "2025-05-01",
      contractor_id: 5,
      contractor_name: "Apex Field Services LLC",
      user_id: 101,
      checked_in: 0,
      completed: 0,
    },
    job: {
      id: 2201,
      expanded_id: "WO-2201-A",
      store_nbr: "RDC-04",
      location_name: "Riverside Warehouse - Zone A",
      attachment_types: ATTACHMENT_TYPES,
    },
    customer: { company_name: "Riverside Distribution Center" },
  },
  {
    work_order: {
      id: 1002,
      name: "Eastside Learning Academy",
      addr_1: "310 Education Blvd",
      addr_2: "",
      addr_3: "",
      city: "Concord",
      state: "NC",
      zip: 28025,
      phone_nbr: "704-555-0331",
      latitude: 35.4087,
      longitude: -80.5795,
      desc_of_work: "Retrofit gymnasium overhead lighting (12 HID fixtures) to LED high-bay. Replace classroom fixtures (30 units) with 2x4 LED troffers. Install occupancy sensors in all classrooms.",
      contractor_requirements: "Work must be completed outside school hours (after 4pm or weekends). Coordinate with facilities manager before accessing roof junction boxes.",
      category: "LED Retrofit",
      type: "Educational",
      workflow_step_label: "In Progress",
      scheduled_date: 1747900000,
      due_date: "2025-06-10",
      start_date: "2025-05-20",
      entered_date: "2025-04-28",
      created_date: "2025-04-28",
      contractor_id: 5,
      contractor_name: "Apex Field Services LLC",
      user_id: 101,
      checked_in: 0,
      completed: 0,
    },
    job: {
      id: 2202,
      expanded_id: "WO-2202-A",
      store_nbr: "ELA-01",
      location_name: "Main Building – Classrooms & Gymnasium",
      attachment_types: ATTACHMENT_TYPES,
    },
    customer: { company_name: "Eastside Learning Academy" },
  },
  {
    work_order: {
      id: 1003,
      name: "NorthPark Industrial Complex",
      addr_1: "7700 Industrial Park Dr",
      addr_2: "Building C",
      addr_3: "",
      city: "Huntersville",
      state: "NC",
      zip: 28078,
      phone_nbr: "704-555-0448",
      latitude: 35.4105,
      longitude: -80.8429,
      desc_of_work: "Replace 22 parking lot pole fixtures (400W MH) with 150W LED shoebox fixtures. Update photocell controls. Dispose of existing fixtures per local hazmat guidelines.",
      contractor_requirements: "Night shift only (10pm–5am). Traffic cones and safety barriers required for parking lot work. Contact security at gate on arrival.",
      category: "Exterior Lighting",
      type: "Industrial",
      workflow_step_label: "Scheduled",
      scheduled_date: 1748100000,
      due_date: "2025-06-20",
      start_date: "2025-05-25",
      entered_date: "2025-05-03",
      created_date: "2025-05-03",
      contractor_id: 5,
      contractor_name: "Apex Field Services LLC",
      user_id: 101,
      checked_in: 0,
      completed: 0,
    },
    job: {
      id: 2203,
      expanded_id: "WO-2203-B",
      store_nbr: "NPI-07",
      location_name: "Building C – Parking Lot & Exterior",
      attachment_types: ATTACHMENT_TYPES,
    },
    customer: { company_name: "NorthPark Industrial Complex" },
  },
  {
    work_order: {
      id: 1004,
      name: "Southfield Cold Storage",
      addr_1: "2250 Cold Chain Way",
      addr_2: "Gate 3",
      addr_3: "",
      city: "Rock Hill",
      state: "SC",
      zip: 29730,
      phone_nbr: "803-555-0567",
      latitude: 34.9249,
      longitude: -81.0251,
      desc_of_work: "Install 18 vapor-tight LED fixtures rated for cold storage (-20°F). Remove existing fluorescent strips. All fixtures must be rated for wet/cold locations per spec sheet.",
      contractor_requirements: "Cold weather PPE required in freezer sections. Lockout/tagout procedure mandatory before electrical work. Coordinate with warehouse manager for bay access windows.",
      category: "Specialty Lighting",
      type: "Cold Storage",
      workflow_step_label: "Scheduled",
      scheduled_date: 1748200000,
      due_date: "2025-06-25",
      start_date: "2025-05-28",
      entered_date: "2025-05-05",
      created_date: "2025-05-05",
      contractor_id: 5,
      contractor_name: "Apex Field Services LLC",
      user_id: 101,
      checked_in: 0,
      completed: 0,
    },
    job: {
      id: 2204,
      expanded_id: "WO-2204-A",
      store_nbr: "SCS-02",
      location_name: "Freezer Bay – Section 2",
      attachment_types: ATTACHMENT_TYPES,
    },
    customer: { company_name: "Southfield Cold Storage" },
  },
  {
    work_order: {
      id: 1005,
      name: "Cabarrus County Municipal Garage",
      addr_1: "580 Government Center Dr",
      addr_2: "",
      addr_3: "",
      city: "Kannapolis",
      state: "NC",
      zip: 28081,
      phone_nbr: "704-555-0612",
      latitude: 35.4871,
      longitude: -80.6212,
      desc_of_work: "Retrofit 24 high-bay fixtures in vehicle maintenance bay with 240W LED UFO high-bays. Install new circuit breaker panel for lighting load. Coordinate with electrician for panel work.",
      contractor_requirements: "Government facility — photo ID required at entrance. No work during active vehicle maintenance. PPE mandatory.",
      category: "LED Retrofit",
      type: "Municipal",
      workflow_step_label: "Scheduled",
      scheduled_date: 1748300000,
      due_date: "2025-06-30",
      start_date: "2025-06-01",
      entered_date: "2025-05-07",
      created_date: "2025-05-07",
      contractor_id: 5,
      contractor_name: "Apex Field Services LLC",
      user_id: 101,
      checked_in: 0,
      completed: 0,
    },
    job: {
      id: 2205,
      expanded_id: "WO-2205-A",
      store_nbr: "CCG-01",
      location_name: "Fleet Maintenance Bay",
      attachment_types: ATTACHMENT_TYPES,
    },
    customer: { company_name: "Cabarrus County Municipal Garage" },
  },
];

// Shape insertContactSqlite expects: { store_contacts: {id,first_name,...}, job_coordinator, company_info }
const CONTACTS = {
  1001: {
    store_contacts: {
      id: 101, first_name: "Tony", last_name: "Chambers",
      phone_nbr: "704-555-0211", phone_nbr_ext: null, fax_nbr: null,
      mobile_nbr: "704-555-0212", email: "tchambers@riverside-dist.com",
      is_employee: "N", after_hours_nbr: null, contact_type: "Site Supervisor",
    },
    job_coordinator: {
      id: 201, first_name: "Priya", last_name: "Anand",
      phone_nbr: "704-555-0100", phone_nbr_ext: null, fax_nbr: null,
      mobile_nbr: "704-555-0101", email: "panand@crewloop.com",
      is_employee: "Y", after_hours_nbr: null,
    },
    company_info: {
      id: 301, first_name: "Apex Field Services", last_name: "LLC",
      phone_nbr: "704-555-0500", phone_nbr_ext: null, fax_nbr: null,
      mobile_nbr: null, email: "info@apexfield.com",
      is_employee: "N", after_hours_nbr: null, contact_type: "Contractor",
    },
  },
  1002: {
    store_contacts: {
      id: 102, first_name: "Donna", last_name: "Merritt",
      phone_nbr: "704-555-0332", phone_nbr_ext: null, fax_nbr: null,
      mobile_nbr: "704-555-0333", email: "dmerritt@eastsideacademy.edu",
      is_employee: "N", after_hours_nbr: null, contact_type: "Facilities Manager",
    },
    job_coordinator: {
      id: 202, first_name: "James", last_name: "Okafor",
      phone_nbr: "704-555-0102", phone_nbr_ext: null, fax_nbr: null,
      mobile_nbr: "704-555-0103", email: "jokafor@crewloop.com",
      is_employee: "Y", after_hours_nbr: null,
    },
    company_info: {
      id: 302, first_name: "Apex Field Services", last_name: "LLC",
      phone_nbr: "704-555-0500", phone_nbr_ext: null, fax_nbr: null,
      mobile_nbr: null, email: "info@apexfield.com",
      is_employee: "N", after_hours_nbr: null, contact_type: "Contractor",
    },
  },
  1003: {
    store_contacts: {
      id: 103, first_name: "Brian", last_name: "Kowalski",
      phone_nbr: "704-555-0449", phone_nbr_ext: null, fax_nbr: null,
      mobile_nbr: "704-555-0450", email: "bkowalski@northpark-ind.com",
      is_employee: "N", after_hours_nbr: null, contact_type: "Security / Site Lead",
    },
    job_coordinator: {
      id: 201, first_name: "Priya", last_name: "Anand",
      phone_nbr: "704-555-0100", phone_nbr_ext: null, fax_nbr: null,
      mobile_nbr: "704-555-0101", email: "panand@crewloop.com",
      is_employee: "Y", after_hours_nbr: null,
    },
    company_info: {
      id: 303, first_name: "Apex Field Services", last_name: "LLC",
      phone_nbr: "704-555-0500", phone_nbr_ext: null, fax_nbr: null,
      mobile_nbr: null, email: "info@apexfield.com",
      is_employee: "N", after_hours_nbr: null, contact_type: "Contractor",
    },
  },
  1004: {
    store_contacts: {
      id: 104, first_name: "Sandra", last_name: "Vega",
      phone_nbr: "803-555-0568", phone_nbr_ext: null, fax_nbr: null,
      mobile_nbr: "803-555-0569", email: "svega@southfieldcold.com",
      is_employee: "N", after_hours_nbr: null, contact_type: "Warehouse Manager",
    },
    job_coordinator: {
      id: 202, first_name: "James", last_name: "Okafor",
      phone_nbr: "704-555-0102", phone_nbr_ext: null, fax_nbr: null,
      mobile_nbr: "704-555-0103", email: "jokafor@crewloop.com",
      is_employee: "Y", after_hours_nbr: null,
    },
    company_info: {
      id: 304, first_name: "Apex Field Services", last_name: "LLC",
      phone_nbr: "704-555-0500", phone_nbr_ext: null, fax_nbr: null,
      mobile_nbr: null, email: "info@apexfield.com",
      is_employee: "N", after_hours_nbr: null, contact_type: "Contractor",
    },
  },
  1005: {
    store_contacts: {
      id: 105, first_name: "Harold", last_name: "Simmons",
      phone_nbr: "704-555-0613", phone_nbr_ext: null, fax_nbr: null,
      mobile_nbr: "704-555-0614", email: "hsimmons@cabarruscounty.gov",
      is_employee: "N", after_hours_nbr: null, contact_type: "Fleet Manager",
    },
    job_coordinator: {
      id: 201, first_name: "Priya", last_name: "Anand",
      phone_nbr: "704-555-0100", phone_nbr_ext: null, fax_nbr: null,
      mobile_nbr: "704-555-0101", email: "panand@crewloop.com",
      is_employee: "Y", after_hours_nbr: null,
    },
    company_info: {
      id: 305, first_name: "Apex Field Services", last_name: "LLC",
      phone_nbr: "704-555-0500", phone_nbr_ext: null, fax_nbr: null,
      mobile_nbr: null, email: "info@apexfield.com",
      is_employee: "N", after_hours_nbr: null, contact_type: "Contractor",
    },
  },
};

let checkinoutLog = [];
let attachmentLog = [];
let finalCheckoutLog = [];
let syncLog = [];

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({ status: "CrewLoop Mock API is running", version: "1.0.0" });
});

app.get("/version", (req, res) => {
  okResponse(res, { minimum_version: "1.0.0", minimum_ios_version: "16.0", minimum_android_api: 24 });
});

// ── Auth ──────────────────────────────────────────────────────────────────────

app.post("/contractorApi/login", (req, res) => {
  const { username } = req.body;
  const user = USERS.find((u) => u.username?.toLowerCase() === username?.toLowerCase());
  if (!user) return errorResponse(res, "Invalid username or password.", 401);
  okResponse(res, { ...user });
});

app.get("/userProfile", (req, res) => {
  if (!requireToken(req, res)) return;
  const user = USERS[0];
  okResponse(res, {
    id: user.user_id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone_nbr: user.phone_nbr,
    mobile_nbr: user.mobile_nbr,
    notify_sms: user.notify_sms,
    notify_email: user.notify_email,
  });
});

app.post("/recoverPassword", (req, res) => {
  const { username } = req.body;
  const user = USERS.find((u) => u.username?.toLowerCase() === username?.toLowerCase());
  if (!user) return errorResponse(res, "No account found for that username.", 404);
  okResponse(res, null, `Password reset instructions sent to ${user.email}`);
});

// ── Work Orders ───────────────────────────────────────────────────────────────

// Returns [{ work_order, job, customer }] — the shape insertWorkOrderSqlite expects
app.get("/workOrders", (req, res) => {
  if (!requireToken(req, res)) return;
  okResponse(res, WORK_ORDERS.filter((w) => !w.work_order.completed));
});

// Returns { work_order: { contractor_requirements, desc_of_work } }
app.get("/workOrderDetails", (req, res) => {
  if (!requireToken(req, res)) return;
  const id = parseInt(req.query.id);
  const entry = WORK_ORDERS.find((w) => w.work_order.id === id);
  if (!entry) return errorResponse(res, "Work order not found.", 404);
  okResponse(res, {
    work_order: {
      contractor_requirements: entry.work_order.contractor_requirements,
      desc_of_work: entry.work_order.desc_of_work,
    },
  });
});

app.get("/completedWorkOrders", (req, res) => {
  if (!requireToken(req, res)) return;
  okResponse(res, []);
});

// ── Contacts ──────────────────────────────────────────────────────────────────

// Returns { store_contacts, job_coordinator, company_info } — shape insertContactSqlite expects
app.get("/workOrderContacts", (req, res) => {
  if (!requireToken(req, res)) return;
  const id = parseInt(req.query.id);
  const contacts = CONTACTS[id];
  if (!contacts) return errorResponse(res, "Contacts not found.", 404);
  okResponse(res, { ...contacts, job_purchase_order_id: id });
});

// ── Check In / Out ────────────────────────────────────────────────────────────

app.get("/workOrderCheckins", (req, res) => {
  if (!requireToken(req, res)) return;
  const id = parseInt(req.query.id);
  okResponse(res, checkinoutLog.filter((r) => r.job_purchase_order_id === id));
});

app.post("/contractorApi/checkin", (req, res) => {
  const { job_purchase_order_id, contractor_tech_id, comment } = req.body;
  const record = {
    id: checkinoutLog.length + 1,
    job_purchase_order_id: parseInt(job_purchase_order_id),
    contractor_tech_id,
    comment: comment || "",
    checkin_date: Math.floor(Date.now() / 1000),
    checking_out: 0,
    work_completed: 0,
    submittedToARC: "Y",
  };
  checkinoutLog.push(record);
  console.log(`✅ Check-in recorded for job ${job_purchase_order_id}`);
  okResponse(res, record, "Check-in recorded successfully.");
});

app.post("/contractorApi/checkout", (req, res) => {
  const { job_purchase_order_id, contractor_tech_id, work_completed, comment } = req.body;
  const record = {
    id: checkinoutLog.length + 1,
    job_purchase_order_id: parseInt(job_purchase_order_id),
    contractor_tech_id,
    comment: comment || "",
    checkin_date: Math.floor(Date.now() / 1000),
    checking_out: 1,
    work_completed: work_completed || 0,
    submittedToARC: "Y",
  };
  checkinoutLog.push(record);
  console.log(`✅ Check-out recorded for job ${job_purchase_order_id}`);
  okResponse(res, record, "Check-out recorded successfully.");
});

// ── Attachments ───────────────────────────────────────────────────────────────

app.post("/contractorApi/attachments", (req, res) => {
  const { job_purchase_order_id, label, type, fileName } = req.body;
  const record = {
    id: attachmentLog.length + 1,
    job_purchase_order_id,
    label: label || "Unlabeled",
    type: type || "photo",
    fileName: fileName || `attachment_${Date.now()}`,
    date: Math.floor(Date.now() / 1000),
    submittedToARC: "Y",
  };
  attachmentLog.push(record);
  console.log(`📎 Attachment received for job ${job_purchase_order_id}: ${record.fileName}`);
  okResponse(res, record, "Attachment uploaded successfully.");
});

// ── Final Checkout ────────────────────────────────────────────────────────────

app.post("/contractorApi/finalCheckout", (req, res) => {
  const { job_purchase_order_id, manager_name } = req.body;
  const record = {
    id: finalCheckoutLog.length + 1,
    ...req.body,
    modified_date: Math.floor(Date.now() / 1000),
    submittedToARC: "Y",
  };
  finalCheckoutLog.push(record);
  console.log(`🏁 Final checkout submitted for job ${job_purchase_order_id} — signed by ${manager_name}`);
  okResponse(res, record, "Final checkout submitted successfully.");
});

// ── Offline Sync ──────────────────────────────────────────────────────────────

app.post("/contractorApi/sync", (req, res) => {
  const { checkinout, attachments, finalCheckouts } = req.body;
  let synced = 0;
  if (Array.isArray(checkinout))     { checkinoutLog.push(...checkinout);       synced += checkinout.length; }
  if (Array.isArray(attachments))    { attachmentLog.push(...attachments);       synced += attachments.length; }
  if (Array.isArray(finalCheckouts)) { finalCheckoutLog.push(...finalCheckouts); synced += finalCheckouts.length; }
  syncLog.push({ synced_at: Date.now(), records_synced: synced });
  console.log(`🔄 Offline sync: ${synced} records submitted`);
  okResponse(res, { synced_at: Date.now(), records_synced: synced }, `${synced} offline records synced.`);
});

// ── Profile Update ────────────────────────────────────────────────────────────

app.post("/updateUserProfile", (req, res) => {
  if (!requireToken(req, res)) return;
  console.log("📝 User profile update received");
  okResponse(res, null, "Profile updated successfully.");
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log("");
  console.log("╔══════════════════════════════════════════╗");
  console.log("║       CrewLoop Mock API Server           ║");
  console.log(`║       Running at http://localhost:${PORT}    ║`);
  console.log("╚══════════════════════════════════════════╝");
  console.log("");
  console.log("Demo credentials:  username=demo  password=<any>");
  console.log("");
  console.log("Endpoints:");
  console.log("  GET  /                        health check");
  console.log("  GET  /version                 update gate");
  console.log("  POST /contractorApi/login     authenticate");
  console.log("  GET  /userProfile             user profile      (TOKEN header)");
  console.log("  POST /recoverPassword         password reset");
  console.log("  GET  /workOrders              open jobs         (TOKEN header)");
  console.log("  GET  /workOrderDetails?id=    job details       (TOKEN header)");
  console.log("  GET  /completedWorkOrders     completed jobs    (TOKEN header)");
  console.log("  GET  /workOrderContacts?id=   contacts for job  (TOKEN header)");
  console.log("  GET  /workOrderCheckins?id=   checkins for job  (TOKEN header)");
  console.log("  POST /contractorApi/checkin");
  console.log("  POST /contractorApi/checkout");
  console.log("  POST /contractorApi/attachments");
  console.log("  POST /contractorApi/finalCheckout");
  console.log("  POST /contractorApi/sync");
  console.log("  POST /updateUserProfile                         (TOKEN header)");
  console.log("");
});
