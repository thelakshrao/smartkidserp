"use client";
import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const AuthContext = createContext(null);
const CACHE_KEY = "dashboard_profile_cache";

const STUDENT_ROLES = ["student", "parent"];
const TEACHER_ROLES = ["teacher"];

// Looks up the linked record in `students` or `teachers` (matched by the
// authUid field, since those documents have their own auto-generated IDs)
// and merges its fields into the base user profile.
async function attachRoleProfile(baseProfile, uid) {
  const role = baseProfile.role;
  let collectionName = null;

  if (STUDENT_ROLES.includes(role)) collectionName = "students";
  else if (TEACHER_ROLES.includes(role)) collectionName = "teachers";

  if (!collectionName) return baseProfile;

  const q = query(collection(db, collectionName), where("authUid", "==", uid));
  const snap = await getDocs(q);

  if (snap.empty) return baseProfile;

  const roleData = snap.docs[0].data();
  return { ...baseProfile, ...roleData, uid, role }; // keep uid/role from the user doc authoritative
}

export function AuthProvider({ children }) {
  // Always start identical on server + first client render — no window check here.
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // useLayoutEffect only ever runs on the client, and fires before the
  // browser paints — so reading the cache here can't cause a hydration
  // mismatch, and there's no visible flash for repeat visits.
  useLayoutEffect(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        setProfile(JSON.parse(cached));
        setLoading(false);
      }
    } catch {
      // ignore bad/missing cache
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        sessionStorage.removeItem(CACHE_KEY);
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) {
          setError("No profile found for this account. Contact the developer.");
          setLoading(false);
          return;
        }
        const data = snap.data();
        if (data.status !== "active") {
          setError("This account has been disabled. Contact the school office.");
          setLoading(false);
          return;
        }
        const baseProfile = { uid: user.uid, ...data };
        const freshProfile = await attachRoleProfile(baseProfile, user.uid);

        setProfile((prev) =>
          prev && JSON.stringify(prev) === JSON.stringify(freshProfile)
            ? prev
            : freshProfile
        );
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(freshProfile));
        setError("");
      } catch (err) {
        console.error(err);
        // keep whatever cached profile we already have; don't clear it on a transient error
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ profile, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext) || {};
}