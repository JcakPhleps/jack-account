// ─────────────────────────────────────────────────────────────
//  Jack Account · the shared identity SDK
//
//  One account across all of Jack's apps (Dude, Ping, Cribs, …),
//  like a Google account. Any web app imports THIS module and gets
//  sign-in + a Firestore handle, all pointed at the central
//  "jack-account" Firebase project.
//
//  Usage in an app:
//     import { JackAccount, fs } from "/jack-account/js/jackaccount.js";
//     JackAccount.onAuthState(user => { ... });
//     await JackAccount.signIn("jack", "hunter2");       // username OR email
//     await JackAccount.signUp("jack", "hunter2", "Jack Phelps");
//     await JackAccount.signInWithGoogle();
//     const uid = JackAccount.uid();
//     // then use fs.* (re-exported Firestore API) for data.
//
//  Hosting note: serve this from the SAME origin as the apps that
//  import it (e.g. both under https://jcakphleps.github.io/*) so the
//  absolute import path "/jack-account/js/jackaccount.js" resolves
//  same-origin. Apps on other origins should vendor a copy.
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, setPersistence, browserLocalPersistence,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, GoogleAuthProvider,
  onAuthStateChanged, signOut as fbSignOut, updateProfile,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection, collectionGroup, doc,
  getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, limit,
  serverTimestamp, Timestamp, deleteField, writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { firebaseConfig, USERNAME_DOMAIN } from "./config.js";

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// Keep the session across reloads (phones reopen the PWA a lot).
setPersistence(auth, browserLocalPersistence).catch(() => {});

// An identifier with no "@" is a username → internal email.
function emailFor(identifier) {
  const id = String(identifier || "").trim();
  if (id.includes("@")) return id;
  return `${id.toLowerCase().replace(/[^a-z0-9_.-]/g, "")}@${USERNAME_DOMAIN}`;
}

function isUsername(identifier) {
  return !String(identifier || "").includes("@");
}

// Write / merge the public profile doc for this account.
async function ensureProfile(user, { username, displayName } = {}) {
  if (!user) return;
  const ref  = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const base = {
    uid:       user.uid,
    displayName: displayName || user.displayName || username || "Jack",
    photoURL:  user.photoURL || null,
    lastSeen:  serverTimestamp(),
  };
  if (!snap.exists()) {
    await setDoc(ref, {
      ...base,
      username:  username || null,
      email:     user.email || null,
      provider:  user.providerData?.[0]?.providerId || "password",
      createdAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, base, { merge: true });
  }
}

export const JackAccount = {
  app, auth, db,

  /** Current Firebase user object (or null). */
  current() { return auth.currentUser; },
  /** Current account id (or null). */
  uid() { return auth.currentUser?.uid || null; },
  /** Friendly display name (or null). */
  name() { return auth.currentUser?.displayName || null; },

  /** Subscribe to sign-in/out. Returns an unsubscribe fn. */
  onAuthState(cb) { return onAuthStateChanged(auth, cb); },

  /** Create an account from a username OR email + password. */
  async signUp(identifier, password, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, emailFor(identifier), password);
    const name = displayName || (isUsername(identifier) ? identifier : identifier.split("@")[0]);
    try { await updateProfile(cred.user, { displayName: name }); } catch {}
    await ensureProfile(cred.user, {
      username: isUsername(identifier) ? identifier.toLowerCase() : null,
      displayName: name,
    });
    return cred.user;
  },

  /** Sign in with a username OR email + password. */
  async signIn(identifier, password) {
    const cred = await signInWithEmailAndPassword(auth, emailFor(identifier), password);
    await ensureProfile(cred.user, {
      username: isUsername(identifier) ? identifier.toLowerCase() : null,
    });
    return cred.user;
  },

  /** One-tap Google sign-in (web only). */
  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await ensureProfile(cred.user, { displayName: cred.user.displayName });
    return cred.user;
  },

  /** Password reset — only works for real-email accounts. */
  async resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  },

  async signOut() { return fbSignOut(auth); },

  /** Fresh ID token (for calling Firestore/your backend from elsewhere). */
  async idToken(forceRefresh = false) {
    return auth.currentUser ? auth.currentUser.getIdToken(forceRefresh) : null;
  },
};

// Re-export a curated Firestore API so apps import ONE module.
export const fs = {
  db,
  collection, collectionGroup, doc,
  getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, limit,
  serverTimestamp, Timestamp, deleteField, writeBatch,
};

export default JackAccount;
