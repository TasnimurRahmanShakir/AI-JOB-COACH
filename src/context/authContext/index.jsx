import { useState, useEffect, createContext } from "react";
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
} from "firebase/auth";
import { auth } from "../../firebase/firebase.init";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null); // JWT from backend

    // ----------------------
    // Firebase Authentication
    // ----------------------
    const createUser = (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const signInUser = async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);

        // Fetch JWT from backend
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: userCredential.user.email,
                uid: userCredential.user.uid
            }),
        });

        if (!res.ok) {
            throw new Error(`Backend login failed: ${res.status}`);
        }

        const data = await res.json();
        setToken(data.token); // store JWT
        localStorage.setItem('authToken', data.token); // persist token
        return userCredential; // return Firebase result for consistency
    };

    const googleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        setUser(result.user);

        // Fetch JWT from backend
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: result.user.email,
                uid: result.user.uid
            }),
        });

        if (!res.ok) {
            throw new Error(`Backend Google login failed: ${res.status}`);
        }

        const data = await res.json();
        setToken(data.token); // store JWT
        localStorage.setItem('authToken', data.token); // persist token
        return result; // return Firebase result for consistency
    };

    const signOutUser = async () => {
        await signOut(auth);
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken'); // clear persisted token
    };

    // ----------------------
    // Monitor Firebase auth state
    // ----------------------
    const initializeUser = (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
            console.log("User authenticated:", currentUser);

            // Check for persisted token
            const persistedToken = localStorage.getItem('authToken');
            if (persistedToken && !token) {
                setToken(persistedToken);
            }
        } else {
            setUser(null);
            setToken(null);
            localStorage.removeItem('authToken');
            console.log("User signed out");
        }
        setLoading(false);
    };

    useEffect(() => {
        const unSubscribe = onAuthStateChanged(auth, initializeUser);
        return unSubscribe;
    }, []);

    // Initialize token from localStorage on app start
    useEffect(() => {
        const persistedToken = localStorage.getItem('authToken');
        if (persistedToken && !token) {
            setToken(persistedToken);
        }
    }, []);

    // ----------------------
    // Helper to get auth headers
    // ----------------------
    const getAuthHeaders = () => {
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                createUser,
                signInUser,
                googleSignIn,
                signOutUser,
                getAuthHeaders, // use this when making API requests
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
