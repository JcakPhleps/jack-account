// ─────────────────────────────────────────────────────────────
//  Jack Account · Firebase config
//
//  The ONE central identity project that ties all of Jack's apps
//  together (like a Google account). These keys are PUBLIC by design
//  — safe to commit. Security comes from Firestore rules
//  (firestore.rules), not from hiding the keys.
// ─────────────────────────────────────────────────────────────
export const firebaseConfig = {
  apiKey:            "AIzaSyDROXyvXNYr2o5CazLomnQRU-RAUefRj60",
  authDomain:        "jack-account-46138.firebaseapp.com",
  projectId:         "jack-account-46138",
  storageBucket:     "jack-account-46138.firebasestorage.app",
  messagingSenderId: "644815151964",
  appId:             "1:644815151964:web:63433eeb181c5b0b6cd799",
  measurementId:     "G-F7NXFM143H",
};

// Usernames (no "@") are turned into an internal email so we can use
// Firebase's email/password auth without asking for a real email —
// same trick Ping and Cribs already use.
export const USERNAME_DOMAIN = "jack.id";
