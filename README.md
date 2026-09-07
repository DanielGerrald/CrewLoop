# Ohmly

**Field operations management for mobile crews — built with React Native + Expo**

Ohmly is a cross-platform iOS/Android field service app that connects subcontractors to a back-office CRM. Technicians use the app to manage their assigned jobs, document their work, and sync completed data back to the office — even when working in areas without internet connectivity.

> This repository is a portfolio showcase of the production codebase — screenshots, architecture, and code are real. It's wired to a private Firebase backend, so it isn't set up to be cloned and run by visitors without their own Firebase project.

---
## Background

This app is used in production at a field services company, where subcontractors use it daily to manage lighting retrofit jobs across warehouse, industrial, and commercial sites. It connects to a live Firebase backend (Authentication + Realtime Database) for user accounts and job assignment data, with SQLite as an offline-first local cache.

The code shown here — including the offline-first SQLite architecture, job workflow, signature capture, and photo documentation — is the actual production implementation.

---

## App Preview

### Login & Job Dashboard

<p align="center">
  <img src="assets/screenshots/01_login.png" width="280" alt="Login screen" />
  &nbsp;&nbsp;
  <img src="assets/screenshots/02_jobs_list.png" width="280" alt="Active jobs list" />
</p>

*Left: Login screen with environment indicator. Right: Active jobs dashboard showing assigned work orders with site address and scheduling info.*

---

### Job Details & Site Information

<p align="center">
  <img src="assets/screenshots/03_work_description.png" width="280" alt="Work description and contractor requirements" />
  &nbsp;&nbsp;
  <img src="assets/screenshots/04_location_contacts.png" width="280" alt="Location info and field coordinator contacts" />
</p>

*Left: Work description and contractor requirements for each job. Right: Location info with one-tap navigation and direct-dial field coordinator contact.*

---

### Documentation & Attachments

<p align="center">
  <img src="assets/screenshots/05_document_upload.png" width="280" alt="Document upload" />
  &nbsp;&nbsp;
  <img src="assets/screenshots/06_photo_upload.png" width="280" alt="Photo documentation" />
</p>

*Left: Native document picker for attaching PDFs and files to a job record. Right: Before/after photo documentation attached to a job.*

---

### Work Log & Final Checkout

<p align="center">
  <img src="assets/screenshots/07_work_log.png" width="280" alt="Work log with check-in timestamp" />
  &nbsp;&nbsp;
  <img src="assets/screenshots/08_checkout_form.png" width="280" alt="Final checkout form" />
</p>

*Left: Work log showing check-in timestamp and comments recorded at the site. Right: Final checkout summary — service performed, materials installed, and completion timestamp.*

---

### Workflow Demo

<p align="center">
  <img src="assets/demo-workflow.gif" width="300" alt="Ohmly workflow demo" />
  &nbsp;&nbsp;
  <img src="assets/demo-workflow-2.gif" width="300" alt="Ohmly job detail demo" />
</p>

*Left: navigating an active job — work description, site contacts, file/photo upload, and work log. Right: reviewing a completed job's contacts and final checkout summary.*

---

## What the App Does

Ohmly handles the full field technician workflow:

| Feature | Description |
|---|---|
| **Job Assignment List** | Technicians see all jobs assigned to them, pulled from the CRM |
| **Job Detail View** | Full job info — site address, work description, contractor requirements |
| **One-Tap Navigation** | Opens Apple Maps, Google Maps, or Waze directly to the job site |
| **One-Tap Calling** | Instant call buttons for the site contact and the office field coordinator |
| **Check-In / Check-Out** | Time tracking tied to each job with timestamp recording |
| **Photo Documentation** | Before/after photo capture and upload with labels |
| **Document Upload** | Attach PDFs and other documents to a job record |
| **Final Checkout** | Multi-step job completion form — tasks performed, materials installed, misc notes |
| **Manager Signature** | Digital signature capture from onsite manager at job completion |
| **Offline-First Architecture** | App continues to function without internet using SQLite local storage |
| **Auto & Manual Sync** | Syncs offline records back to Firebase on pull-down and automatically when the app returns to the foreground |

---

## Technical Highlights

- **React Native + Expo** — cross-platform iOS and Android from a single codebase
- **Firebase** — Authentication and Realtime Database as the backend, accessed over their REST APIs
- **SQLite (expo-sqlite)** — local database for offline-first data persistence
- **Offline sync queue** — records created offline are stored locally and batch-posted on reconnect
- **Axios** — REST client used for both Firebase auth/data calls and environment-based base URL configuration
- **Context API** — global job state shared across screens without prop drilling
- **Environment config** — production / staging / development release channels via `Config.js`
- **expo-image-picker** — native camera and photo library access
- **expo-document-picker** — native document selection
- **react-native-signature-canvas** — signature pad for manager sign-off
- **expo-linking** — deep linking into Maps apps and native phone dialer

---

## Architecture Notes

This build talks to a private Firebase project (Authentication + Realtime Database) that isn't included in this repo, so it isn't set up to be cloned and run out of the box — there's no mock backend or demo login to fall back on. The sections below describe how the pieces fit together for anyone reading the code.

- **Auth** — email/password via the Firebase Identity Toolkit REST API (`Database/UserDatabase.js`), with the resulting ID token attached to subsequent Realtime Database requests.
- **Data layer** — job assignments, contacts, check-ins, and checkout data live in Firebase Realtime Database, fetched over its REST interface (`environment.apiUrl` + `.json`, e.g. `Database/WorkOrderDatabase.js`) rather than the Firebase JS SDK, so the same axios-based data layer works identically whether the record came from the network or needs to be queued offline.
- **Offline cache** — every fetch is mirrored into SQLite (`expo-sqlite`) so the app remains fully usable without connectivity; writes made offline queue locally and sync back to Firebase when the connection returns.
- **Environments** — `Config.js` switches API targets and feature flags based on the Expo Updates release channel (`production` / `staging` / `development`), all pointed at the same Firebase project today.

---

## Project Structure

```
Ohmly/
├── App.js                  # Root component, navigation setup
├── Config.js               # Environment config (release channel → Firebase URL/flags)
├── firebase.js             # Firebase app init (Auth + Realtime Database)
│
├── screens/                # Top-level screens
│   ├── Login.js
│   ├── ForgotPassword.js
│   ├── Home.js
│   ├── JobsList.js
│   ├── CompletedJobs.js
│   ├── Profile.js
│   └── SignatureScreen.js
│
├── components/             # Reusable UI components
│   ├── JobCard.js
│   ├── JobsListScreen.js
│   ├── AppSyncManager.js   # Background/pull-to-refresh sync with Firebase
│   ├── AuthContext.js      # Auth state provider
│   ├── Context.js          # Global job state via Context API
│   ├── AlertManager.js
│   ├── AppFocusRefresh.js
│   ├── BannerOnPendingSync.js
│   ├── NavigationRef.js
│   ├── SyncLock.js
│   ├── UpdateGate.js
│   ├── constants.js
│   ├── ui/                 # Shared presentational components
│   │   ├── AvatarIcon.js
│   │   ├── CustomInput.js
│   │   ├── Loading.js
│   │   ├── ReauthModal.js
│   │   ├── SignupButton.js
│   │   ├── StagingBanner.js
│   │   └── Version.js
│   └── JobDetails/         # Job detail sub-screens
│       ├── Details.js
│       ├── Contacts.js
│       ├── CheckInOut.js
│       ├── Photos.js
│       ├── Files.js
│       ├── AttachmentSubmit.js
│       ├── AttachmentsProcess.js
│       ├── FinalCheckOut.js
│       ├── JobModal.js
│       ├── JobNav.js
│       └── OpenMap.js
│
├── constants/
│   └── colors.js           # Shared color palette
│
├── Database/                # Data layer — SQLite cache + Firebase REST calls
│   ├── SetupDatabase.js     # Schema creation and migrations
│   ├── UserDatabase.js      # Firebase auth (Identity Toolkit REST API)
│   ├── CheckInOutDatabase.js
│   ├── AttachmentDatabase.js
│   ├── FinalCheckOutDatabase.js
│   ├── ContactDatabase.js
│   ├── WorkOrderDatabase.js # Job assignments (Realtime Database REST API)
│   ├── LabelDatabase.js
│   └── UpdateGateApi.js     # App version check
│
└── assets/                  # Images, icons, splash screen, screenshots
    ├── screenshots/         # App preview screenshots
    ├── demo-workflow.gif    # Workflow demo GIF
    └── demo-workflow-2.gif  # Job detail demo GIF
```

---

## What I'd Build Next

- **Push notifications** via Expo Notifications for new job assignments
- **Real-time job status** updates using WebSockets
- **Photo compression** before upload to reduce bandwidth usage
- **Biometric authentication** (Face ID / fingerprint) for faster login
- **Connectivity-triggered sync** — currently syncs on pull-down and app foreground; sync automatically the moment a connection is detected

---

## Tech Stack

![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react)
![Expo](https://img.shields.io/badge/Expo-000020?style=flat&logo=expo)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=flat&logo=sqlite)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)

---

*Built by Daniel Gerrald — [LinkedIn](https://www.linkedin.com/in/daniel-gerrald-493b89165) · [GitHub](https://github.com/DanielGerrald)*
