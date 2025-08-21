"use client";

import * as React from "react";
import { 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut
} from "firebase/auth";
import { auth, db } from "@/lib/firebase.js";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast.js";

const AuthContext = React.createContext(null);

export function useAuth() {
  return React.useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);


  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Save user profile to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName || user.email || "User",
        email: user.email,
        avatar: user.photoURL || "https://placehold.co/100x100.png",
        lastLogin: new Date().toISOString(),
      }, { merge: true });
      toast({ title: "Success", description: "Signed in with Google successfully." });
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not sign in with Google." });
    }
  };

  // Fetch all users from Firestore
  const getAllUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    return querySnapshot.docs.map(doc => doc.data());
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({ title: "Signed Out", description: "You have been signed out." });
    } catch (error) {
      console.error("Sign-Out Error:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not sign out." });
    }
  };


  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    getAllUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
