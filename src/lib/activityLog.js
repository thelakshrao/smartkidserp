import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import {
  UserPlus,
  UserCog,
  Power,
  IndianRupee,
  ShieldPlus,
} from "lucide-react";

export async function logActivity(type, { actorName, targetName, meta = {} }) {
  try {
    await addDoc(collection(db, "activityLog"), {
      type,
      actorName: actorName || "System",
      targetName: targetName || "",
      meta,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

export function describeActivity(raw) {
  const { type, actorName, targetName, meta = {} } = raw;

  switch (type) {
    case "student_added":
      return {
        text: `${targetName} was added as a new student in Class ${meta.className || "-"}${meta.section ? ` - ${meta.section}` : ""}`,
        icon: UserPlus,
        bg: "bg-[#efe7fb]",
        fg: "text-[#8c5cf0]",
      };
    case "teacher_added":
      return {
        text: `${targetName} joined as a teacher${meta.subject ? ` (${meta.subject})` : ""}`,
        icon: UserCog,
        bg: "bg-[#e3f0fd]",
        fg: "text-[#2f8fe0]",
      };
    case "admin_added":
      return {
        text: `${targetName} was given ${meta.role || "admin"} access`,
        icon: ShieldPlus,
        bg: "bg-[#fdecec]",
        fg: "text-[#ed1c24]",
      };
    case "student_status_changed":
      return {
        text: `${targetName}'s account was ${meta.newStatus === "active" ? "activated" : "deactivated"}`,
        icon: Power,
        bg: meta.newStatus === "active" ? "bg-[#e2f7ea]" : "bg-[#fdecec]",
        fg: meta.newStatus === "active" ? "text-[#2fa860]" : "text-[#ed1c24]",
      };
    case "teacher_status_changed":
      return {
        text: `${targetName}'s teacher account was ${meta.newStatus === "active" ? "activated" : "deactivated"}`,
        icon: Power,
        bg: meta.newStatus === "active" ? "bg-[#e2f7ea]" : "bg-[#fdecec]",
        fg: meta.newStatus === "active" ? "text-[#2fa860]" : "text-[#ed1c24]",
      };
    case "fee_updated":
      return {
        text: `Fee for ${targetName} updated — ₹${meta.feePaid || 0} paid of ₹${meta.feeTotal || 0}${meta.feeStatus === "Paid" ? " (fully paid)" : ""}`,
        icon: IndianRupee,
        bg: "bg-[#e2f7ea]",
        fg: "text-[#2fa860]",
      };
    default:
      return {
        text: `${actorName} made an update`,
        icon: UserPlus,
        bg: "bg-gray-50",
        fg: "text-gray-500",
      };
  }
}

export function formatRelativeTime(ts) {
  if (!ts?.toDate) return "Just now";
  const diffMs = Date.now() - ts.toDate().getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export function subscribeToRecentActivity(callback, count = 8) {
  const q = query(
    collection(db, "activityLog"),
    orderBy("createdAt", "desc"),
    limit(count),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
