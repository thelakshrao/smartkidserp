"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardTopbar from "@/dashboardcomponents/Dashboardtopbar";
import Sidebar from "@/dashboardcomponents/Dashboardsidebar";
import { useAuth } from "@/context/AuthContext";
import { db, getClassTeacher, setClassTeacher } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { ArrowLeft, Loader2, Check } from "lucide-react";

const CLASS_OPTIONS = [
  "Nursery",
  "LKG",
  "UKG",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
];
const GENDER_OPTIONS = ["Male", "Female", "Other"];
const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const RELATION_OPTIONS = ["Father", "Mother", "Guardian", "Other"];
const FEE_STATUS_OPTIONS = ["Paid", "Pending", "Partial"];

// ---- Sanitizers: numbers where numbers belong, letters where names belong ----
function sanitizeAlpha(value) {
  return value.replace(/[^a-zA-Z\s'.-]/g, "");
}
function sanitizeDigits(value, maxLen) {
  const digits = value.replace(/\D/g, "");
  return maxLen ? digits.slice(0, maxLen) : digits;
}

export default function EditStudentPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile } = useAuth?.() || {};
  const isAdmin = profile?.role !== "teacher";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [classTeacherName, setClassTeacherName] = useState(null);
  const [teacherOptions, setTeacherOptions] = useState([]);

  useEffect(() => {
    async function loadTeachers() {
      try {
        const snap = await getDocs(collection(db, "teachers"));
        setTeacherOptions(
          snap.docs.map((d) => ({ id: d.id, name: d.data().fullName })),
        );
      } catch (err) {
        console.error("Failed to load teachers:", err);
      }
    }
    loadTeachers();
  }, []);

  useEffect(() => {
    if (form?.className) {
      getClassTeacher(form.className).then((data) => {
        setClassTeacherName(data?.teacherName || null);
      });
    } else {
      setClassTeacherName(null);
    }
  }, [form?.className]);

  useEffect(() => {
    async function fetchStudent() {
      try {
        const snap = await getDoc(doc(db, "students", id));
        if (!snap.exists()) {
          setError("Student not found.");
        } else {
          setForm(snap.data());
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong loading this student.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchStudent();
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleAssignClassTeacher(teacherId) {
    const teacher = teacherOptions.find((t) => t.id === teacherId);
    if (!teacher || !form?.className) return;
    await setClassTeacher(form.className, teacher.id, teacher.name);
    setClassTeacherName(teacher.name);
  }

  async function handleSave(e) {
    e.preventDefault();

    if (form.guardianPhone && !/^\d{10}$/.test(form.guardianPhone)) {
      setError("Guardian Phone must be exactly 10 digits.");
      return;
    }
    if (form.motherPhone && !/^\d{10}$/.test(form.motherPhone)) {
      setError("Mother's Phone must be exactly 10 digits.");
      return;
    }
    if (form.emergencyPhone && !/^\d{10}$/.test(form.emergencyPhone)) {
      setError("Emergency Contact Number must be exactly 10 digits.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const computedPending = Math.max(
        0,
        (Number(form.feeTotal) || 0) - (Number(form.feePaid) || 0),
      );
      await updateDoc(doc(db, "students", id), {
        ...form,
        feePending: form.feeStatus === "Paid" ? 0 : computedPending,
      });
      setSaved(true);
      setTimeout(() => router.push(`/dashboard/students/${id}`), 1000);
    } catch (err) {
      console.error(err);
      setError("Couldn't save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col">
      <DashboardTopbar
        profile={profile}
        notificationCount={5}
        onMenuClick={() => setMobileNavOpen((o) => !o)}
      />
      <div className="flex flex-1 min-w-0">
        <Sidebar
          dashboardType={isAdmin ? "admin" : "teacher"}
          activeItem="Students"
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-5 sm:p-8 max-w-5xl">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="text-[13px] text-gray-500 flex items-center gap-1.5">
                <span>Dashboard</span>
                <span>&gt;</span>
                <span>Students</span>
                <span>&gt;</span>
                <span className="text-gray-900 font-semibold">
                  Edit Student
                </span>
              </div>
              <Link
                href={`/dashboard/students/${id}`}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft size={15} />
                Back to Profile
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-24 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : error && !form ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-rose-600 text-sm">
                {error}
              </div>
            ) : (
              <form
                onSubmit={handleSave}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7"
              >
                <h1 className="text-lg font-bold text-gray-900 mb-1">
                  Edit Student
                </h1>
                <p className="text-[12.5px] text-gray-500 mb-6">
                  Update {form.fullName}'s details.
                </p>

                <h2 className="text-[13.5px] font-bold text-gray-900 mb-3">
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                  <Select
                    label="Class"
                    name="className"
                    value={form.className}
                    onChange={handleChange}
                    options={CLASS_OPTIONS}
                  />
                  <Select
                    label="Gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    options={GENDER_OPTIONS}
                  />
                </div>

                {form.className && (
                  <div className="mb-4">
                    {classTeacherName ? (
                      <p className="text-[11.5px] text-gray-500">
                        Class Incharge:{" "}
                        <span className="font-semibold text-gray-700">
                          {classTeacherName}
                        </span>
                      </p>
                    ) : isAdmin ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11.5px] font-semibold text-rose-600">
                          No class incharge assigned yet — assign one to
                          continue *
                        </span>
                        <select
                          required
                          onChange={(e) =>
                            handleAssignClassTeacher(e.target.value)
                          }
                          defaultValue=""
                          className="text-[13px] font-semibold px-3 py-1.5 rounded-lg border border-orange-300 bg-white text-gray-900 outline-none cursor-pointer focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                        >
                          <option value="" disabled>
                            Select a teacher...
                          </option>
                          {teacherOptions.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <p className="text-[11.5px] text-gray-400 italic">
                        No class incharge assigned yet.
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <Field
                    label="Date of Birth"
                    name="dob"
                    type="date"
                    value={form.dob}
                    onChange={handleChange}
                  />
                  <Select
                    label="Blood Group"
                    name="bloodGroup"
                    value={form.bloodGroup}
                    onChange={handleChange}
                    options={BLOOD_GROUP_OPTIONS}
                  />
                  <Field
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-[12px] font-semibold text-gray-900 mb-1.5">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={form.address || ""}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 bg-gray-50 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <Field
                    label="City"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    filter="alpha"
                  />
                  <Field
                    label="State"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    filter="alpha"
                  />
                  <Field
                    label="Pincode"
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    filter="digits"
                    maxLength={6}
                  />
                </div>

                <h2 className="text-[13.5px] font-bold text-gray-900 mb-3 pt-4 border-t border-gray-100">
                  Guardian Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <Field
                    label="Guardian Name"
                    name="guardianName"
                    value={form.guardianName}
                    onChange={handleChange}
                    filter="alpha"
                    required
                  />
                  <Select
                    label="Relation"
                    name="guardianRelation"
                    value={form.guardianRelation}
                    onChange={handleChange}
                    options={RELATION_OPTIONS}
                  />
                  <PhoneField
                    label="Guardian Phone"
                    name="guardianPhone"
                    value={form.guardianPhone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <Field
                    label="Guardian Email"
                    name="guardianEmail"
                    type="email"
                    value={form.guardianEmail}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <Field
                    label="Mother's Name"
                    name="motherName"
                    value={form.motherName}
                    onChange={handleChange}
                    filter="alpha"
                  />
                  <PhoneField
                    label="Mother's Phone"
                    name="motherPhone"
                    value={form.motherPhone}
                    onChange={handleChange}
                  />
                  <Field
                    label="Mother's Email"
                    name="motherEmail"
                    type="email"
                    value={form.motherEmail}
                    onChange={handleChange}
                  />
                </div>

                {isAdmin && (
                  <>
                    <h2 className="text-[13.5px] font-bold text-gray-900 mb-3 pt-4 border-t border-gray-100">
                      Fee Information
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <Field
                        label="Total Fee"
                        name="feeTotal"
                        type="number"
                        value={form.feeTotal}
                        onChange={handleChange}
                        required
                      />
                      <Field
                        label="Amount Paid"
                        name="feePaid"
                        type="number"
                        value={form.feePaid}
                        onChange={handleChange}
                        required
                      />
                      <Select
                        label="Fee Status"
                        name="feeStatus"
                        value={form.feeStatus}
                        onChange={handleChange}
                        options={FEE_STATUS_OPTIONS}
                      />
                    </div>
                    {form.feeStatus && form.feeStatus !== "Paid" && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div>
                          <label className="block text-[12px] font-semibold text-gray-900 mb-1.5">
                            Pending Amount
                          </label>
                          <div className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-900 bg-gray-100">
                            ₹
                            {Math.max(
                              0,
                              (Number(form.feeTotal) || 0) -
                                (Number(form.feePaid) || 0),
                            ).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <h2 className="text-[13.5px] font-bold text-gray-900 mb-3 pt-4 border-t border-gray-100">
                  Emergency Contact
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <Field
                    label="Emergency Contact Name"
                    name="emergencyName"
                    value={form.emergencyName}
                    onChange={handleChange}
                    filter="alpha"
                  />
                  <PhoneField
                    label="Emergency Contact Number"
                    name="emergencyPhone"
                    value={form.emergencyPhone}
                    onChange={handleChange}
                  />
                </div>

                {error && (
                  <p className="text-[12.5px] font-semibold text-red-600 mb-4">
                    {error}
                  </p>
                )}

                <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                  <Link
                    href={`/dashboard/students/${id}`}
                    className="rounded-xl border border-gray-200 px-5 py-2.5 text-[13.5px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={saving || saved}
                    className="flex items-center gap-1.5 rounded-xl bg-[#ff5722] px-6 py-2.5 text-[13.5px] font-bold text-white hover:bg-[#f4511e] transition-colors cursor-pointer shadow-sm disabled:opacity-60"
                  >
                    {saving && <Loader2 size={15} className="animate-spin" />}
                    {saved && <Check size={15} />}
                    {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  filter,
  maxLength,
}) {
  function handleInputChange(e) {
    let val = e.target.value;
    if (filter === "alpha") val = sanitizeAlpha(val);
    if (filter === "digits") val = sanitizeDigits(val, maxLength);
    onChange({ target: { name, value: val } });
  }

  return (
    <div>
      <label className="block text-[12px] font-semibold text-gray-900 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={handleInputChange}
        required={required}
        maxLength={maxLength}
        inputMode={filter === "digits" ? "numeric" : undefined}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 bg-gray-50 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
      />
    </div>
  );
}

function Select({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-gray-900 mb-1.5">
        {label}
      </label>
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 bg-gray-50 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 cursor-pointer"
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function PhoneField({ label, name, value, onChange, required }) {
  function handlePhoneChange(e) {
    const digitsOnly = sanitizeDigits(e.target.value, 10);
    onChange({ target: { name, value: digitsOnly } });
  }

  const val = value || "";
  const showWarning = val.length > 0 && val.length < 10;

  return (
    <div>
      <label className="block text-[12px] font-semibold text-gray-900 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="tel"
        inputMode="numeric"
        name={name}
        value={val}
        onChange={handlePhoneChange}
        required={required}
        maxLength={10}
        pattern="[0-9]{10}"
        title="Enter exactly 10 digits"
        placeholder="10-digit number"
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 bg-gray-50 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
      />
      {showWarning && (
        <p className="text-[11px] text-amber-600 mt-1">
          {10 - val.length} more digit{10 - val.length !== 1 ? "s" : ""} needed
        </p>
      )}
    </div>
  );
}
