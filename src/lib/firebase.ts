import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDxoPPX62UWpsRqPF6V54klvz_Zd4V82EQ",
  authDomain: "amanah-apps-9783d.firebaseapp.com",
  databaseURL: "https://amanah-apps-9783d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "amanah-apps-9783d",
  storageBucket: "amanah-apps-9783d.firebasestorage.app",
  messagingSenderId: "1011963063034",
  appId: "1:1011963063034:web:af6cef32870090ef233743",
  measurementId: "G-NTV8GDRDXV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);

/**
 * Triggers a real-time reactive UI update for a specific user.
 * It updates/writes to /users/{userId} document in Realtime Database.
 * The mobile app is listening to this reference and will auto-refetch data.
 */
export async function triggerQueueUpdate(userId: string) {
  try {
    const userRef = ref(rtdb, `users/${userId}`);
    await set(userRef, {
      lastUpdated: new Date().toISOString(),
      trigger: Math.random() // Ensure a change event fires
    });
    console.log(`[Firebase RTDB] Triggered real-time queue/stats update for user: ${userId}`);
  } catch (error) {
    console.error(`[Firebase RTDB] Failed to trigger update for user ${userId}:`, error);
  }
}
