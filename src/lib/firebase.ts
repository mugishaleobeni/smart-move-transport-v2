import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// TODO: Replace with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDNqdOoDYQXlZaeDr2odJACeQzXvwkbC5w",
    authDomain: "zee-ai-2fa31.firebaseapp.com",
    projectId: "zee-ai-2fa31",
    storageBucket: "zee-ai-2fa31.firebasestorage.app",
    messagingSenderId: "182845015404",
    appId: "1:182845015404:web:69eeb9ab6bb4c3799ddf49"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const idToken = await result.user.getIdToken();
        return { user: result.user, idToken };
    } catch (error) {
        console.error("Firebase Login Error:", error);
        throw error;
    }
};
