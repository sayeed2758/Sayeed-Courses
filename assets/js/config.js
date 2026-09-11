// Add your Firebase web app configuration here for production.
export const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_PROJECT.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT.firebasestorage.app",
  messagingSenderId: "PASTE_MESSAGING_SENDER_ID",
  appId: "PASTE_APP_ID"
};

export const adminEmail = "YOUR_ADMIN_EMAIL@example.com";

export function isFirebaseConfigured() {
  return !Object.values(firebaseConfig).some(v => !v || String(v).includes("PASTE_") || String(v).includes("YOUR_"));
}
