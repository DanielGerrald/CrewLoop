# Remaining inline color replacements

These files contain hardcoded color values that bypass StyleSheet.js.
Do a find-and-replace in each file:

## Screens/FinalCheckOut.js
- thumbColor: `#01ab52` → `#F47C20`

## Screens/Profile.js  
- trackColor true value: `#01ab52` → `#F47C20`
- thumbColor: `#01ab52` → `#F47C20`
- ios_backgroundColor: `#3e3e3e` → `#2C3444`

## Screens/SignatureScreen.js
- sigSaveBtn backgroundColor: `#01ab52` → `#F47C20`
- sigClearBtn backgroundColor: `#3e3e3e` → `#2C3444`
- sigCancelBtn backgroundColor: `#3e3e3e` → `#2C3444`

## Components/JobDetails/Photos.js
- SegmentedButtons style borderColor: `#01ab52` → `#F47C20`
- SegmentedButtons style backgroundColor: `#01ab52` → `#F47C20`

## Database/JobDatabase.js
- Change: import Config from "../Config"  →  import { environment as Config } from "../Config"
- Change header: "ARCMC-TOKEN" → "CREWLOOP-TOKEN"
