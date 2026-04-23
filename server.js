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

// Allow requests from Expo dev client
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ─── Sample Data ────────────────────────────────────────────────────────────

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

const WORK_ORDERS = [
  {
    id: 1001,
    job_id: 2201,
    expanded_id: "WO-2201-A",
    name: "Riverside Distribution Center",
    location_name: "Riverside Warehouse - Zone A",
    addr_1: "4820 Logistics Pkwy",
    addr_2: "",
    addr_3: "",
    city: "Charlotte",
    state: "NC",
    zip: 28273,
    store_nbr: "RDC-04",
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
  {
    id: 1002,
    job_id: 2202,
    expanded_id: "WO-2202-A",
    name: "Eastside Learning Academy",
    location_name: "Main Building – Classrooms & Gymnasium",
    addr_1: "310 Education Blvd",
    addr_2: "",
    addr_3: "",
    city: "Concord",
    state: "NC",
    zip: 28025,
    store_nbr: "ELA-01",
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
  {
    id: 1003,
    job_id: 2203,
    expanded_id: "WO-2203-B",
    name: "NorthPark Industrial Complex",
    location_name: "Building C – Parking Lot & Exterior",
    addr_1: "7700 Industrial Park Dr",
    addr_2: "Building C",
    addr_3: "",
    city: "Huntersville",
    state: "NC",
    zip: 28078,
    store_nbr: "NPI-07",
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
  {
    id: 1004,
    job_id: 2204,
    expanded_id: "WO-2204-A",
    name: "Southfield Cold Storage",
    location_name: "Freezer Bay – Section 2",
    addr_1: "2250 Cold Chain Way",
    addr_2: "Gate 3",
    addr_3: "",
    city: "Rock Hill",
    state: "SC",
    zip: 29730,
    store_nbr: "SCS-02",
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
  {
    id: 1005,
    job_id: 2205,
    expanded_id: "WO-2205-A",
    name: "Cabarrus County Municipal Garage",
    location_name: "Fleet Maintenance Bay",
    addr_1: "580 Government Center Dr",
    addr_2: "",
    addr_3: "",
    city: "Kannapolis",
    state: "NC",
    zip: 28081,
    store_nbr: "CCG-01",
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
];

const CONTACTS = {
  1001: {
    job_purchase_order_id: 1001,
    // Site contact
    store_contacts_first_name: "Tony",
    store_contacts_last_name: "Chambers",
    store_contacts_phone_nbr: "704-555-0211",
    store_contacts_mobile_nbr: "704-555-0212",
    store_contacts_email: "tchambers@riverside-dist.com",
    store_contacts_contact_type: "Site Supervisor",
    store_contacts_is_employee: "N",
    // Field coordinator (CrewLoop employee managing the job)
    job_coordinator_first_name: "Priya",
    job_coordinator_last_name: "Anand",
    job_coordinator_phone_nbr: "704-555-0100",
    job_coordinator_mobile_nbr: "704-555-0101",
    job_coordinator_email: "panand@crewloop.com",
    job_coordinator_is_employee: "Y",
  },
  1002: {
    job_purchase_order_id: 1002,
    store_contacts_first_name: "Donna",
    store_contacts_last_name: "Merritt",
    store_contacts_phone_nbr: "704-555-0332",
    store_contacts_mobile_nbr: "704-555-0333",
    store_contacts_email: "dmerritt@eastsideacademy.edu",
    store_contacts_contact_type: "Facilities Manager",
    store_contacts_is_employee: "N",
    job_coordinator_first_name: "James",
    job_coordinator_last_name: "Okafor",
    job_coordinator_phone_nbr: "704-555-0102",
    job_coordinator_mobile_nbr: "704-555-0103",
    job_coordinator_email: "jokafor@crewloop.com",
    job_coordinator_is_employee: "Y",
  },
  1003: {
    job_purchase_order_id: 1003,
    store_contacts_first_name: "Brian",
    store_contacts_last_name: "Kowalski",
    store_contacts_phone_nbr: "704-555-0449",
    store_contacts_mobile_nbr: "704-555-0450",
    store_contacts_email: "bkowalski@northpark-ind.com",
    store_contacts_contact_type: "Security / Site Lead",
    store_contacts_is_employee: "N",
    job_coordinator_first_name: "Priya",
    job_coordinator_last_name: "Anand",
    job_coordinator_phone_nbr: "704-555-0100",
    job_coordinator_mobile_nbr: "704-555-0101",
    job_coordinator_email: "panand@crewloop.com",
    job_coordinator_is_employee: "Y",
  },
  1004: {
    job_purchase_order_id: 1004,
    store_contacts_first_name: "Sandra",
    store_contacts_last_name: "Vega",
    store_contacts_phone_nbr: "803-555-0568",
    store_contacts_mobile_nbr: "803-555-0569",
    store_contacts_email: "svega@southfieldcold.com",
    store_contacts_contact_type: "Warehouse Manager",
    store_contacts_is_employee: "N",
    job_coordinator_first_name: "James",
    job_coordinator_last_name: "Okafor",
    job_coordinator_phone_nbr: "704-555-0102",
    job_coordinator_mobile_nbr: "704-555-0103",
    job_coordinator_email: "jokafor@crewloop.com",
    job_coordinator_is_employee: "Y",
  },
  1005: {
    job_purchase_order_id: 1005,
    store_contacts_first_name: "Harold",
    store_contacts_last_name: "Simmons",
    store_contacts_phone_nbr: "704-555-0613",
    store_contacts_mobile_nbr: "704-555-0614",
    store_contacts_email: "hsimmons@cabarruscounty.gov",
    store_contacts_contact_type: "Fleet Manager",
    store_contacts_is_employee: "N",
    job_coordinator_first_name: "Priya",
    job_coordinator_last_name: "Anand",
    job_coordinator_phone_nbr: "704-555-0100",
    job_coordinator_mobile_nbr: "704-555-0101",
    job_coordinator_email: "panand@crewloop.com",
    job_coordinator_is_employee: "Y",
  },
};

// In-memory store for demo actions (resets on server restart)
let checkinoutLog = [];
let attachmentLog = [];
let finalCheckoutLog = [];
let syncLog = [];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function okResponse(res, results, message = "OK") {
  return res.json({
    info: { status: "OK", message },
    results,
  });
}

function errorResponse(res, message, statusCode = 400) {
  return res.status(statusCode).json({
    info: { status: "ERROR", message },
    results: null,
  });
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// Health check
app.get("/", (req, res) => {
  res.json({ status: "CrewLoop Mock API is running", version: "1.0.0" });
});

// App version / update gate
app.get("/version", (req, res) => {
  okResponse(res, {
    minimum_version: "1.0.0",
    minimum_ios_version: "16.0",
    minimum_android_api: 24,
  });
});

// Login
app.post("/contractorApi/login", (req, res) => {
  const { username, password } = req.body;

  // Demo accepts any password for the demo user
  const user = USERS.find((u) => u.username === username);
  if (!user) {
    return errorResponse(res, "Invalid username or password.", 401);
  }

  okResponse(res, {
    ...user,
    access_token: "demo-token-abc123",
    token_expire_date: 9999999999,
  });
});

// Work orders (job list)
app.get("/contractorApi/workOrders", (req, res) => {
  const token = req.headers["arcmc-token"] || req.headers["crewloop-token"];
  if (!token) return errorResponse(res, "Missing auth token.", 401);
  okResponse(res, WORK_ORDERS);
});

// Single work order
app.get("/contractorApi/workOrders/:id", (req, res) => {
  const job = WORK_ORDERS.find((w) => w.id === parseInt(req.params.id));
  if (!job) return errorResponse(res, "Work order not found.", 404);
  okResponse(res, job);
});

// Contacts for a job
app.get("/contractorApi/contacts/:jobId", (req, res) => {
  const contacts = CONTACTS[parseInt(req.params.jobId)];
  if (!contacts) return errorResponse(res, "Contacts not found.", 404);
  okResponse(res, contacts);
});

// Check in
app.post("/contractorApi/checkin", (req, res) => {
  const { job_purchase_order_id, contractor_tech_id, comment } = req.body;
  const record = {
    id: checkinoutLog.length + 1,
    job_purchase_order_id,
    contractor_tech_id,
    comment: comment || "",
    checkin_date: Date.now(),
    checking_out: 0,
    work_completed: 0,
    submittedToARC: "Y",
  };
  checkinoutLog.push(record);
  console.log(`✅ Check-in recorded for job ${job_purchase_order_id}`);
  okResponse(res, record, "Check-in recorded successfully.");
});

// Check out
app.post("/contractorApi/checkout", (req, res) => {
  const { job_purchase_order_id, contractor_tech_id, work_completed, comment } = req.body;
  const record = {
    id: checkinoutLog.length + 1,
    job_purchase_order_id,
    contractor_tech_id,
    comment: comment || "",
    checkin_date: Date.now(),
    checking_out: 1,
    work_completed: work_completed || 0,
    submittedToARC: "Y",
  };
  checkinoutLog.push(record);
  console.log(`✅ Check-out recorded for job ${job_purchase_order_id}`);
  okResponse(res, record, "Check-out recorded successfully.");
});

// Attachment upload (photos / documents)
app.post("/contractorApi/attachments", (req, res) => {
  const { job_purchase_order_id, label, type, fileName } = req.body;
  const record = {
    id: attachmentLog.length + 1,
    job_purchase_order_id,
    label: label || "Unlabeled",
    type: type || "photo",
    fileName: fileName || `attachment_${Date.now()}`,
    date: Date.now(),
    submittedToARC: "Y",
  };
  attachmentLog.push(record);
  console.log(`📎 Attachment received for job ${job_purchase_order_id}: ${record.fileName}`);
  okResponse(res, record, "Attachment uploaded successfully.");
});

// Final checkout (job completion)
app.post("/contractorApi/finalCheckout", (req, res) => {
  const {
    job_purchase_order_id,
    service_perf,
    desc_service_perf,
    material_inst,
    desc_material_inst,
    workOrder_100,
    walkThrough_comp,
    return_needed,
    desc_return_needed,
    desc_misc_notes,
    manager_name,
  } = req.body;

  const record = {
    id: finalCheckoutLog.length + 1,
    job_purchase_order_id,
    service_perf,
    desc_service_perf,
    material_inst,
    desc_material_inst,
    workOrder_100,
    walkThrough_comp,
    return_needed,
    desc_return_needed,
    desc_misc_notes,
    manager_name,
    modified_date: Date.now(),
    submittedToARC: "Y",
  };
  finalCheckoutLog.push(record);
  console.log(`🏁 Final checkout submitted for job ${job_purchase_order_id} — signed by ${manager_name}`);
  okResponse(res, record, "Final checkout submitted successfully.");
});

// Offline sync — accepts batched payload of offline records
app.post("/contractorApi/sync", (req, res) => {
  const { checkinout, attachments, finalCheckouts } = req.body;
  let synced = 0;

  if (Array.isArray(checkinout)) {
    checkinoutLog.push(...checkinout);
    synced += checkinout.length;
  }
  if (Array.isArray(attachments)) {
    attachmentLog.push(...attachments);
    synced += attachments.length;
  }
  if (Array.isArray(finalCheckouts)) {
    finalCheckoutLog.push(...finalCheckouts);
    synced += finalCheckouts.length;
  }

  const record = { synced_at: Date.now(), records_synced: synced };
  syncLog.push(record);
  console.log(`🔄 Offline sync: ${synced} records submitted`);
  okResponse(res, record, `${synced} offline records synced successfully.`);
});

// Category / label types
app.get("/contractorApi/categoryTypes", (req, res) => {
  okResponse(res, [
    { type_id: 1, type_category_id: "LED", type_label: "LED Fixture Replacement", type_category_label: "Lighting", type_group: "Retrofit" },
    { type_id: 2, type_category_id: "HID", type_label: "HID to LED Conversion", type_category_label: "Lighting", type_group: "Retrofit" },
    { type_id: 3, type_category_id: "EXT", type_label: "Exterior / Parking Lot", type_category_label: "Lighting", type_group: "Exterior" },
    { type_id: 4, type_category_id: "EMG", type_label: "Emergency Exit Lighting", type_category_label: "Safety", type_group: "Compliance" },
    { type_id: 5, type_category_id: "CTL", type_label: "Controls / Sensors", type_category_label: "Controls", type_group: "Smart Lighting" },
    { type_id: 6, type_category_id: "SPC", type_label: "Specialty / Cold Storage", type_category_label: "Specialty", type_group: "Specialty" },
  ]);
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log("");
  console.log("╔══════════════════════════════════════════╗");
  console.log("║       CrewLoop Mock API Server           ║");
  console.log(`║       Running at http://localhost:${PORT}    ║`);
  console.log("╚══════════════════════════════════════════╝");
  console.log("");
  console.log("Demo credentials:");
  console.log("  Username: demo");
  console.log("  Password: any value accepted");
  console.log("");
  console.log("Available endpoints:");
  console.log("  GET  /version");
  console.log("  POST /contractorApi/login");
  console.log("  GET  /contractorApi/workOrders");
  console.log("  GET  /contractorApi/workOrders/:id");
  console.log("  GET  /contractorApi/contacts/:jobId");
  console.log("  POST /contractorApi/checkin");
  console.log("  POST /contractorApi/checkout");
  console.log("  POST /contractorApi/attachments");
  console.log("  POST /contractorApi/finalCheckout");
  console.log("  POST /contractorApi/sync");
  console.log("  GET  /contractorApi/categoryTypes");
  console.log("");
});
