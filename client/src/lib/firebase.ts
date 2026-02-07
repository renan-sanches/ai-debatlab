import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCr6pgB8zqNK9jRyDop-rcEYZQMvS8F26c",
  authDomain: "gen-lang-client-0098413951.firebaseapp.com",
  projectId: "gen-lang-client-0098413951",
  storageBucket: "gen-lang-client-0098413951.firebasestorage.app",
  messagingSenderId: "1035327913143",
  appId: "1:1035327913143:web:d7170e8cbdf67895872132",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export async function getAccessToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
}
