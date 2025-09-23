import { useState, useEffect, createContext } from "react";
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut
} from "firebase/auth";
import { auth } from "../../firebase/firebase.init";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const createUser = (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const signInUser = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const googleSignIn = () => {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    };

    const signOutUser = () => {
        return signOut(auth);
    };

    const initializeUser = (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
            console.log("User authenticated:", currentUser);
        } else {
            setUser(null);
            console.log("User signed out");
        }
        setLoading(false);
    };

    useEffect(() => {
        const unSubscribe = onAuthStateChanged(auth, initializeUser);
        return unSubscribe;
    }, []);

    return (
        <AuthContext.Provider
            value={{ user, loading, createUser, signInUser, googleSignIn, signOutUser }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
