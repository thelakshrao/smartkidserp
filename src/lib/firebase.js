import { initializeApp, getApps, getApp, deleteApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCi-DWp8s-YbFWGbLwn6aVCp0sU08Hjm5E",
  authDomain: "smart-kids-erp.firebaseapp.com",
  projectId: "smart-kids-erp",
  storageBucket: "smart-kids-erp.firebasestorage.app",
  messagingSenderId: "555046826757",
  appId: "1:555046826757:web:ba369c93ab9a3eaa6dbd6c",
  measurementId: "G-2Y7NP6Q28B",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

async function createAuthUserWithoutSignIn(email, password) {
  const tempAppName = `temp-${Date.now()}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  const tempAuth = getAuth(tempApp);
  try {
    const cred = await createUserWithEmailAndPassword(
      tempAuth,
      email,
      password,
    );
    const uid = cred.user.uid;
    await signOut(tempAuth);
    return uid;
  } finally {
    await deleteApp(tempApp);
  }
}

export async function createTeacherLogin({
  email,
  password,
  fullName,
  phone,
  teacherId,
  classIds = [],
  createdBy,
}) {
  const authUid = await createAuthUserWithoutSignIn(email, password);

  await setDoc(doc(db, "users", authUid), {
    name: fullName,
    email,
    phone,
    role: "teacher",
    status: "active",
    userId: teacherId,
    authorityLevel: 1,
    classIds,
    mustChangePassword: true,
    createdBy: createdBy || "system",
    createdAt: serverTimestamp(),
  });

  return authUid;
}

export async function createStudentLogin({
  email,
  password,
  fullName,
  phone,
  admissionNumber,
  className,
  createdBy,
}) {
  const authUid = await createAuthUserWithoutSignIn(email, password);

  await setDoc(doc(db, "users", authUid), {
    name: fullName,
    email,
    phone,
    role: "student",
    status: "active",
    userId: admissionNumber,
    authorityLevel: 0,
    classIds: className ? [className] : [],
    mustChangePassword: true,
    createdBy: createdBy || "system",
    createdAt: serverTimestamp(),
  });

  return authUid;
}

export async function createAdminLogin({
  email,
  password,
  name,
  phone,
  userId,
  role,
  createdBy,
}) {
  const authUid = await createAuthUserWithoutSignIn(email, password);

  await setDoc(doc(db, "users", authUid), {
    name,
    email,
    phone,
    role,
    status: "active",
    userId,
    authorityLevel: 2,
    mustChangePassword: true,
    createdBy: createdBy || "system",
    createdAt: serverTimestamp(),
  });

  return authUid;
}

export function classKeyFor(className) {
  return className;
}

export async function setClassTeacher(className, teacherId, teacherName) {
  if (!className) return;
  await setDoc(doc(db, "classTeachers", classKeyFor(className)), {
    className,
    teacherId,
    teacherName,
    updatedAt: serverTimestamp(),
  });
}

export async function getClassTeacher(className) {
  if (!className) return null;
  const snap = await getDoc(doc(db, "classTeachers", classKeyFor(className)));
  return snap.exists() ? snap.data() : null;
}