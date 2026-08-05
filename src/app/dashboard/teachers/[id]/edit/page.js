"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardTopbar from "@/dashboardcomponents/Dashboardtopbar";
import Sidebar from "@/dashboardcomponents/Dashboardsidebar";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ArrowLeft, Loader2, Check, Plus, Trash2 } from "lucide-react";

const SUBJECT_OPTIONS = [
  "English",
  "Mathematics",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "Social Studies",
  "History",
  "Geography",
  "Hindi",
  "Sanskrit",
  "Computer Science",
  "Physical Education",
  "Arts & Craft",
  "Music",
  "Economics",
  "Business Studies",
  "Accountancy",
  "Environmental Science",
];
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
const MARITAL_OPTIONS = ["Single", "Married", "Divorced", "Widowed"];
const EMPLOYMENT_TYPE_OPTIONS = [
  "Full-Time",
  "Part-Time",
  "Contract",
  "Visiting Faculty",
];
const DEPARTMENT_OPTIONS = [
  "Pre-Primary",
  "Primary",
  "Middle School",
  "Secondary",
  "Senior Secondary",
];
const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function sanitizeAlpha(value) {
  return value.replace(/[^a-zA-Z\s'.-]/g, "");
}
function sanitizeDigits(value, maxLen) {
  const digits = value.replace(/\D/g, "");
  return maxLen ? digits.slice(0, maxLen) : digits;
}

export default function EditTeacherPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile } = useAuth?.() || {};
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchTeacher() {
      try {
        const snap = await getDoc(doc(db, "teachers", id));
        if (!snap.exists()) {
          setError("Teacher not found.");
        } else {
          const data = snap.data();
          setForm({
            ...data,
            classSubjectMappings: data.classSubjectMappings?.length
              ? data.classSubjectMappings
              : [{ className: "", subjects: [] }],
          });
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong loading this teacher.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchTeacher();
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleAddMapping() {
    setForm((f) => ({
      ...f,
      classSubjectMappings: [
        ...f.classSubjectMappings,
        { className: "", subjects: [] },
      ],
    }));
  }

  function handleRemoveMapping(index) {
    setForm((f) => ({
      ...f,
      classSubjectMappings: f.classSubjectMappings.filter(
        (_, i) => i !== index,
      ),
    }));
  }

  function handleClassChange(index, className) {
    setForm((f) => ({
      ...f,
      classSubjectMappings: f.classSubjectMappings.map((item, i) =>
        i === index ? { ...item, className } : item,
      ),
    }));
  }

  function handleSubjectToggle(index, subject) {
    setForm((f) => ({
      ...f,
      classSubjectMappings: f.classSubjectMappings.map((item, i) => {
        if (i !== index) return item;
        const current = item.subjects || [];
        const next = current.includes(subject)
          ? current.filter((s) => s !== subject)
          : [...current, subject];
        return { ...item, subjects: next };
      }),
    }));
  }

  async function handleSave(e) {
    e.preventDefault();

    if (!/^\d{10}$/.test(form.phone || "")) {
      setError("Phone must be exactly 10 digits.");
      return;
    }
    if (form.emergencyPhone && !/^\d{10}$/.test(form.emergencyPhone)) {
      setError("Emergency Contact Number must be exactly 10 digits.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const classesAssignedStr = form.classSubjectMappings
        .map((m) => m.className)
        .filter(Boolean)
        .join(", ");
      const subjectsTaughtStr = Array.from(
        new Set(form.classSubjectMappings.flatMap((m) => m.subjects || [])),
      ).join(", ");

      await updateDoc(doc(db, "teachers", id), {
        ...form,
        classesAssigned: classesAssignedStr,
        subjectsTaught: subjectsTaughtStr,
      });
      setSaved(true);
      setTimeout(() => router.push(`/dashboard/teachers/${id}`), 1000);
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
          dashboardType="admin"
          activeItem="Teachers"
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-5 sm:p-8 max-w-5xl">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="text-[13px] text-gray-500 flex items-center gap-1.5">
                <span>Dashboard</span>
                <span>&gt;</span>
                <span>Teachers</span>
                <span>&gt;</span>
                <span className="text-gray-900 font-semibold">
                  Edit Teacher
                </span>
              </div>
              <Link
                href={`/dashboard/teachers/${id}`}
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
                  Edit Teacher
                </h1>
                <p className="text-[12.5px] text-gray-500 mb-6">
                  Update {form.fullName}'s details.
                </p>

                <h2 className="text-[13.5px] font-bold text-gray-900 mb-3">
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <Field
                    label="Full Name"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    filter="alpha"
                    required
                  />
                  <Field
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                  <PhoneField
                    label="Phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <Field
                    label="Teacher ID"
                    name="teacherId"
                    value={form.teacherId}
                    onChange={handleChange}
                    required
                  />
                  <Select
                    label="Primary Specialization"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    options={SUBJECT_OPTIONS}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <Select
                    label="Gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    options={GENDER_OPTIONS}
                  />
                  <Field
                    label="Date of Birth"
                    name="dob"
                    type="date"
                    value={form.dob}
                    onChange={handleChange}
                  />
                  <Select
                    label="Marital Status"
                    name="maritalStatus"
                    value={form.maritalStatus}
                    onChange={handleChange}
                    options={MARITAL_OPTIONS}
                  />
                </div>

                <h2 className="text-[13.5px] font-bold text-gray-900 mb-3 pt-4 border-t border-gray-100">
                  Professional Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <Field
                    label="Qualification"
                    name="qualification"
                    value={form.qualification}
                    onChange={handleChange}
                  />
                  <Field
                    label="Experience (years)"
                    name="experience"
                    type="number"
                    value={form.experience}
                    onChange={handleChange}
                  />
                  <Select
                    label="Employment Type"
                    name="employmentType"
                    value={form.employmentType}
                    onChange={handleChange}
                    options={EMPLOYMENT_TYPE_OPTIONS}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <Select
                    label="Department"
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    options={DEPARTMENT_OPTIONS}
                  />
                  <Field
                    label="Joining Date"
                    name="joiningDate"
                    type="date"
                    value={form.joiningDate}
                    onChange={handleChange}
                  />
                  <Field
                    label="Previous School"
                    name="previousSchool"
                    value={form.previousSchool}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-6 border-t border-gray-100 pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-[13px] font-bold text-gray-900">
                      Class & Subject Allocation
                    </label>
                    <button
                      type="button"
                      onClick={handleAddMapping}
                      className="flex items-center gap-1.5 text-[12px] font-bold text-[#ff5722] bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      <Plus size={14} /> Add Class Assignment
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    {form.classSubjectMappings.map((mapItem, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/80 flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="w-full sm:w-1/3">
                            <label className="block text-[11.5px] font-semibold text-gray-700 mb-1">
                              Select Class
                            </label>
                            <select
                              value={mapItem.className}
                              onChange={(e) =>
                                handleClassChange(idx, e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-[13px] text-gray-900 bg-white outline-none focus:border-orange-500"
                            >
                              <option value="">Select class...</option>
                              {CLASS_OPTIONS.map((c) => (
                                <option key={c} value={c}>
                                  Class {c}
                                </option>
                              ))}
                            </select>
                          </div>
                          {form.classSubjectMappings.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMapping(idx)}
                              className="text-rose-500 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 transition-colors mt-5 cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11.5px] font-semibold text-gray-700 mb-1.5">
                            Select Specialized Subjects Taught for this Class
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {SUBJECT_OPTIONS.map((sub) => {
                              const isSelected =
                                mapItem.subjects?.includes(sub);
                              return (
                                <button
                                  key={sub}
                                  type="button"
                                  onClick={() => handleSubjectToggle(idx, sub)}
                                  className={`text-[11.5px] font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-[#ff5722] text-white border-[#ff5722] shadow-sm"
                                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                  }`}
                                >
                                  {sub}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <h2 className="text-[13.5px] font-bold text-gray-900 mb-3 pt-4 border-t border-gray-100">
                  Address & Emergency Contact
                </h2>
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
                  <Select
                    label="Blood Group"
                    name="bloodGroup"
                    value={form.bloodGroup}
                    onChange={handleChange}
                    options={BLOOD_GROUP_OPTIONS}
                  />
                </div>

                {error && (
                  <p className="text-[12.5px] font-semibold text-red-600 mb-4">
                    {error}
                  </p>
                )}

                <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                  <Link
                    href={`/dashboard/teachers/${id}`}
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
  placeholder,
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
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={filter === "digits" ? "numeric" : undefined}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 bg-gray-50 placeholder:text-gray-400 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
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
