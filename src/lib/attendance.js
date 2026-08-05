import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { logActivity } from "@/lib/activityLog";

export const ATTENDANCE_STATUSES = ["Present", "Absent", "Leave"];

export function todayDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function isFutureDate(dateStr) {
  return dateStr > todayDateString();
}

function attendanceDocId(className, subject, date) {
  const safeSubject = (subject || "General").replace(/\s+/g, "_");
  return `${className}_${safeSubject}_${date}`;
}

export async function getAttendanceRecord(className, subject, date) {
  const id = attendanceDocId(className, subject, date);
  const snap = await getDoc(doc(db, "attendance", id));
  return snap.exists() ? { docId: snap.id, ...snap.data() } : null;
}

export async function saveAttendance({
  className,
  subject,
  date,
  records,
  markedBy,
  markedByName,
  markedByRole,
}) {
  if (isFutureDate(date)) {
    throw new Error("Attendance cannot be marked for a future date.");
  }

  const id = attendanceDocId(className, subject, date);
  const attendanceRef = doc(db, "attendance", id);

  const existing = await getDoc(attendanceRef);
  const isEdit = existing.exists();

  await setDoc(
    attendanceRef,
    {
      className,
      subject: subject || "General",
      date,
      markedBy,
      markedByName,
      markedByRole,
      records,
      createdAt: isEdit ? existing.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: false },
  );

  const batch = writeBatch(db);
  Object.entries(records).forEach(([studentId, status]) => {
    const recId = `${studentId}_${date}`;
    batch.set(doc(db, "studentAttendance", recId), {
      studentId,
      className,
      subject: subject || "General",
      date,
      status,
    });
  });
  await batch.commit();

  await logActivity(isEdit ? "attendance_edited" : "attendance_marked", {
    actorName: markedByName,
    targetName: `Class ${className}`,
    meta: { className, subject, date },
  });

  return { docId: id, isEdit };
}

export async function getStudentAttendanceHistory(studentId) {
  const q = query(
    collection(db, "studentAttendance"),
    where("studentId", "==", studentId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export function computeAttendanceStats(records) {
  const total = records.length;
  const present = records.filter((r) => r.status === "Present").length;
  const absent = records.filter((r) => r.status === "Absent").length;
  const leave = records.filter((r) => r.status === "Leave").length;
  const pct = total > 0 ? Math.round((present / total) * 100) : null;
  return { total, present, absent, leave, pct };
}
