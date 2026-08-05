"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  RefreshCcw,
  Copy,
  Check,
  User,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import DashboardSidebar from "@/dashboardcomponents/Dashboardsidebar";
import DashboardTopbar from "@/dashboardcomponents/Dashboardtopbar";
import { useAuth } from "@/context/AuthContext";
import { db, createTeacherLogin, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { logActivity } from "@/lib/activityLog";

const STEPS = [
  { id: 1, label: "Basic Information" },
  { id: 2, label: "Professional Details" },
  { id: 3, label: "Review & Confirm" },
];

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

// ---- Sanitizers: numbers where numbers belong, letters where names belong ----
function sanitizeAlpha(value) {
  return value.replace(/[^a-zA-Z\s'.-]/g, "");
}
function sanitizeDigits(value, maxLen) {
  const digits = value.replace(/\D/g, "");
  return maxLen ? digits.slice(0, maxLen) : digits;
}

function generateDefaultPassword() {
  const year = new Date().getFullYear();
  const symbols = ["@", "#", "!", "$"];
  const sym1 = symbols[Math.floor(Math.random() * symbols.length)];
  const sym2 = symbols[Math.floor(Math.random() * symbols.length)];
  const rand = Math.floor(100 + Math.random() * 900);
  return `Skcs${sym1}${year}${sym2}${rand}`;
}

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  teacherId: "",
  subject: "",
  gender: "",
  dob: "",
  maritalStatus: "",
  qualification: "",
  experience: "",
  employmentType: "",
  department: "",
  joiningDate: "",
  previousSchool: "",
  classSubjectMappings: [{ className: "", subjects: [] }],
  address: "",
  city: "",
  state: "",
  pincode: "",
  emergencyName: "",
  emergencyPhone: "",
  bloodGroup: "",
};

export default function AddTeacherPage() {
  const router = useRouter();
  const { profile } = useAuth?.() || {};
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [defaultPassword, setDefaultPassword] = useState(
    generateDefaultPassword(),
  );
  const [copied, setCopied] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [stepError, setStepError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function isPhoneValid(val) {
    return !val || /^\d{10}$/.test(val);
  }

  function isStepValid(currentStep) {
    if (currentStep === 1) {
      return (
        form.fullName.trim() &&
        form.email.trim() &&
        /^\d{10}$/.test(form.phone) &&
        form.teacherId.trim() &&
        form.subject &&
        form.gender &&
        form.dob
      );
    }
    if (currentStep === 2) {
      return (
        form.qualification.trim() &&
        form.experience !== "" &&
        form.employmentType &&
        form.department &&
        form.joiningDate &&
        isPhoneValid(form.emergencyPhone)
      );
    }
    return true;
  }

  function goNext() {
    if (!isStepValid(step)) {
      setStepError(
        "Please fill in all required fields correctly before continuing (phone numbers must be exactly 10 digits).",
      );
      return;
    }
    setStepError("");
    setStep((s) => Math.min(s + 1, 3));
  }

  function goBack() {
    setStepError("");
    setStep((s) => Math.max(s - 1, 1));
  }

  function handleCopyPassword() {
    navigator.clipboard?.writeText(defaultPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleCreateTeacher() {
    if (!confirmChecked) {
      setStepError(
        "Please confirm the information is correct before creating the account.",
      );
      return;
    }
    setStepError("");
    setError("");
    setSubmitting(true);
    try {
      const classesAssignedStr = form.classSubjectMappings
        .map((m) => m.className)
        .filter(Boolean)
        .join(", ");

      const subjectsTaughtStr = Array.from(
        new Set(form.classSubjectMappings.flatMap((m) => m.subjects)),
      ).join(", ");

      const authUid = await createTeacherLogin({
        email: form.email,
        password: defaultPassword,
        fullName: form.fullName,
        phone: form.phone,
        teacherId: form.teacherId,
        classIds: form.classSubjectMappings
          .map((m) => m.className)
          .filter(Boolean),
        createdBy: profile?.uid || profile?.name,
      });

      console.log(
        "Current admin auth after createTeacherLogin:",
        auth.currentUser?.uid,
        auth.currentUser?.email,
      );

      await addDoc(collection(db, "teachers"), {
        ...form,
        classesAssigned: classesAssignedStr,
        subjectsTaught: subjectsTaughtStr,
        authUid,
        role: "teacher",
        status: "active",
        createdBy: profile?.uid || profile?.name || null,
        createdAt: serverTimestamp(),
      });

      await logActivity("teacher_added", {
        actorName: profile?.name,
        targetName: form.fullName,
        meta: { subject: form.subject },
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/teachers");
      }, 1400);
    } catch (err) {
      console.error("Failed to create teacher:", err);
      if (err.code === "auth/email-already-in-use") {
        setError(
          "This email already has a login account. Use a different email.",
        );
      } else if (err.code === "auth/weak-password") {
        setError(
          "Generated password was too weak. Click regenerate and try again.",
        );
      } else {
        setError(
          "Something went wrong while creating the teacher. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
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
        <DashboardSidebar
          dashboardType="admin"
          activeItem="Teachers"
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-5 sm:p-8">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="text-[13px] text-gray-500 flex items-center gap-1.5">
                <span>Dashboard</span>
                <span>&gt;</span>
                <span>Teachers</span>
                <span>&gt;</span>
                <span className="text-gray-900 font-semibold">Add Teacher</span>
              </div>
              <Link
                href="/dashboard/teachers"
                className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft size={15} />
                Back to Teachers
              </Link>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              Add New Teacher
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              Fill in the basic information to create a new teacher account.
            </p>

            <Stepper currentStep={step} />

            <div className="flex flex-col lg:flex-row gap-5 items-start">
              <div className="flex-1 w-full bg-white rounded-2xl p-5 sm:p-7 border border-gray-100 shadow-sm">
                {step === 1 && (
                  <BasicInformationStep form={form} onChange={handleChange} />
                )}
                {step === 2 && (
                  <ProfessionalDetailsStep
                    form={form}
                    setForm={setForm}
                    onChange={handleChange}
                  />
                )}
                {step === 3 && (
                  <ReviewStep
                    form={form}
                    defaultPassword={defaultPassword}
                    copied={copied}
                    onCopyPassword={handleCopyPassword}
                    confirmChecked={confirmChecked}
                    setConfirmChecked={setConfirmChecked}
                    success={success}
                    error={error}
                  />
                )}

                {step === 1 && (
                  <LoginCredentialsBox
                    defaultPassword={defaultPassword}
                    onRegenerate={() =>
                      setDefaultPassword(generateDefaultPassword())
                    }
                  />
                )}

                {stepError && (
                  <p className="text-[12.5px] font-semibold text-red-600 mt-4">
                    {stepError}
                  </p>
                )}

                <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
                  {step === 1 ? (
                    <Link
                      href="/dashboard/teachers"
                      className="rounded-xl border border-gray-200 px-5 py-2.5 text-[13.5px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </Link>
                  ) : (
                    <button
                      onClick={goBack}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-5 py-2.5 text-[13.5px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={15} />
                      Back
                    </button>
                  )}

                  {step < 3 ? (
                    <button
                      onClick={goNext}
                      className="flex items-center gap-1.5 rounded-xl bg-[#ff5722] px-6 py-2.5 text-[13.5px] font-bold text-white hover:bg-[#f4511e] transition-colors cursor-pointer shadow-sm"
                    >
                      Next
                      <ArrowRight size={15} />
                    </button>
                  ) : (
                    <button
                      onClick={handleCreateTeacher}
                      disabled={submitting || success}
                      className="flex items-center gap-1.5 rounded-xl bg-[#ff5722] px-6 py-2.5 text-[13.5px] font-bold text-white hover:bg-[#f4511e] transition-colors cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting && (
                        <Loader2 size={15} className="animate-spin" />
                      )}
                      {success
                        ? "Teacher Created!"
                        : submitting
                          ? "Creating..."
                          : "Create Teacher"}
                    </button>
                  )}
                </div>
              </div>

              <TeacherPreview form={form} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Stepper({ currentStep }) {
  return (
    <div className="flex items-center mb-8 overflow-x-auto">
      {STEPS.map((s, idx) => (
        <div
          key={s.id}
          className="flex items-center flex-1 min-w-37.5 last:flex-none last:min-w-0"
        >
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 transition-colors
                ${
                  currentStep === s.id
                    ? "bg-[#ff5722] text-white"
                    : currentStep > s.id
                      ? "bg-[#ff5722]/70 text-white"
                      : "bg-gray-100 text-gray-400"
                }`}
            >
              {s.id}
            </div>
            <span
              className={`text-[13px] font-semibold whitespace-nowrap ${
                currentStep >= s.id ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {s.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-3 transition-colors ${
                currentStep > s.id ? "bg-[#ff5722]/50" : "bg-gray-100"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function BasicInformationStep({ form, onChange }) {
  return (
    <div>
      <h2 className="text-[15px] font-bold text-gray-900 mb-1">
        Basic Information
      </h2>
      <p className="text-[12.5px] text-gray-500 mb-5">
        Enter the basic details of the teacher. These will be used to create
        their account.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <TextField
          label="Full Name"
          name="fullName"
          value={form.fullName}
          onChange={onChange}
          placeholder="Enter full name"
          filter="alpha"
          required
        />
        <TextField
          label="Email Address"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          placeholder="Enter email address"
          required
        />
        <PhoneField value={form.phone} onChange={onChange} required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <TextField
          label="Teacher ID"
          name="teacherId"
          value={form.teacherId}
          onChange={onChange}
          placeholder="Enter unique teacher ID"
          helper="Example: TCH2025001"
          required
        />
        <SelectField
          label="Primary Specialization"
          name="subject"
          value={form.subject}
          onChange={onChange}
          options={SUBJECT_OPTIONS}
          placeholder="Select core subject"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SelectField
          label="Gender"
          name="gender"
          value={form.gender}
          onChange={onChange}
          options={GENDER_OPTIONS}
          placeholder="Select gender"
          required
        />
        <TextField
          label="Date of Birth"
          name="dob"
          type="date"
          value={form.dob}
          onChange={onChange}
          required
        />
        <SelectField
          label="Marital Status"
          name="maritalStatus"
          value={form.maritalStatus}
          onChange={onChange}
          options={MARITAL_OPTIONS}
          placeholder="Select status"
        />
      </div>
    </div>
  );
}

function TextField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  helper,
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
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        inputMode={filter === "digits" ? "numeric" : undefined}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 bg-gray-50
                   placeholder:text-gray-400 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
      />
      {helper && <p className="text-[11px] text-gray-400 mt-1">{helper}</p>}
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  required,
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-gray-900 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 bg-gray-50
                   outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
      >
        <option value="">{placeholder || "Select option..."}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function PhoneField({
  label = "Phone Number",
  name = "phone",
  value,
  onChange,
  required,
}) {
  function handlePhoneChange(e) {
    const digitsOnly = sanitizeDigits(e.target.value, 10);
    onChange({ target: { name, value: digitsOnly } });
  }

  const showWarning = value && value.length > 0 && value.length < 10;

  return (
    <div>
      <label className="block text-[12px] font-semibold text-gray-900 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-2">
        <select
          disabled
          className="w-18 px-2 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 bg-gray-50 outline-none shrink-0"
        >
          <option>+91</option>
        </select>
        <input
          type="tel"
          inputMode="numeric"
          name={name}
          value={value || ""}
          onChange={handlePhoneChange}
          required={required}
          placeholder="10-digit number"
          maxLength={10}
          pattern="[0-9]{10}"
          title="Enter exactly 10 digits"
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 bg-gray-50
                     placeholder:text-gray-400 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
        />
      </div>
      {showWarning && (
        <p className="text-[11px] text-amber-600 mt-1">
          {10 - value.length} more digit{10 - value.length !== 1 ? "s" : ""}{" "}
          needed
        </p>
      )}
    </div>
  );
}

function LoginCredentialsBox({ defaultPassword, onRegenerate }) {
  const [mountedPassword, setMountedPassword] = useState("");

  useEffect(() => {
    setMountedPassword(defaultPassword || generateDefaultPassword());
  }, [defaultPassword]);

  return (
    <div className="mt-6">
      <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4 flex items-start gap-3 mb-3">
        <span className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
          <Lock size={16} className="text-[#ff5722]" />
        </span>
        <div>
          <div className="font-bold text-gray-900 text-[13.5px]">
            Login Credentials
          </div>
          <p className="text-[12px] text-gray-500">
            A default password will be generated for this teacher. You can share
            these credentials securely.
          </p>
        </div>
      </div>

      <label className="block text-[12px] font-semibold text-gray-900 mb-1.5">
        Default Password (Auto Generated)
      </label>
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
        <span className="text-[13px] font-semibold text-gray-900">
          {mountedPassword || "Loading..."}
        </span>
        <button
          type="button"
          onClick={onRegenerate}
          className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer shrink-0"
          aria-label="Regenerate password"
        >
          <RefreshCcw size={16} />
        </button>
      </div>
    </div>
  );
}

function ProfessionalDetailsStep({ form, setForm, onChange }) {
  const mappings = form.classSubjectMappings || [
    { className: "", subjects: [] },
  ];

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
    setForm((f) => {
      const updated = f.classSubjectMappings.map((item, i) =>
        i === index ? { ...item, className } : item,
      );
      return { ...f, classSubjectMappings: updated };
    });
  }

  function handleSubjectToggle(index, subject) {
    setForm((f) => {
      const updated = f.classSubjectMappings.map((item, i) => {
        if (i !== index) return item;
        const currentSubjects = item.subjects || [];
        const nextSubjects = currentSubjects.includes(subject)
          ? currentSubjects.filter((s) => s !== subject)
          : [...currentSubjects, subject];
        return { ...item, subjects: nextSubjects };
      });
      return { ...f, classSubjectMappings: updated };
    });
  }

  return (
    <div>
      <h2 className="text-[15px] font-bold text-gray-900 mb-1">
        Professional Details & Class-Subject Assignments
      </h2>
      <p className="text-[12.5px] text-gray-500 mb-5">
        Configure qualifications, employment details, and specify which subjects
        this teacher can teach for each class.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <TextField
          label="Highest Qualification"
          name="qualification"
          value={form.qualification}
          onChange={onChange}
          placeholder="e.g. M.Sc, B.Ed"
          required
        />
        <TextField
          label="Years of Experience"
          name="experience"
          type="number"
          value={form.experience}
          onChange={onChange}
          placeholder="e.g. 5"
          required
        />
        <SelectField
          label="Employment Type"
          name="employmentType"
          value={form.employmentType}
          onChange={onChange}
          options={EMPLOYMENT_TYPE_OPTIONS}
          placeholder="Select type"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SelectField
          label="Department"
          name="department"
          value={form.department}
          onChange={onChange}
          options={DEPARTMENT_OPTIONS}
          placeholder="Select department"
          required
        />
        <TextField
          label="Joining Date"
          name="joiningDate"
          type="date"
          value={form.joiningDate}
          onChange={onChange}
          required
        />
        <TextField
          label="Previous School (optional)"
          name="previousSchool"
          value={form.previousSchool}
          onChange={onChange}
          placeholder="Enter previous employer"
        />
      </div>

      <div className="mb-6 border-t border-gray-100 pt-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className="block text-[13px] font-bold text-gray-900">
              Class & Subject Allocation
            </label>
            <p className="text-[11.5px] text-gray-500">
              Select classes and check the specialized subjects taught to each.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddMapping}
            className="flex items-center gap-1.5 text-[12px] font-bold text-[#ff5722] bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <Plus size={14} /> Add Class Assignment
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {mappings.map((mapItem, idx) => (
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
                    onChange={(e) => handleClassChange(idx, e.target.value)}
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
                {mappings.length > 1 && (
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
                    const isSelected = mapItem.subjects?.includes(sub);
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

      <div className="mb-4">
        <label className="block text-[12px] font-semibold text-gray-900 mb-1.5">
          Address
        </label>
        <textarea
          name="address"
          value={form.address}
          onChange={onChange}
          rows={2}
          placeholder="Enter residential address"
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 bg-gray-50
                     placeholder:text-gray-400 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <TextField
          label="City"
          name="city"
          value={form.city}
          onChange={onChange}
          placeholder="Enter city"
          filter="alpha"
        />
        <TextField
          label="State"
          name="state"
          value={form.state}
          onChange={onChange}
          placeholder="Enter state"
          filter="alpha"
        />
        <TextField
          label="Pincode"
          name="pincode"
          value={form.pincode}
          onChange={onChange}
          placeholder="6-digit pincode"
          filter="digits"
          maxLength={6}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TextField
          label="Emergency Contact Name"
          name="emergencyName"
          value={form.emergencyName}
          onChange={onChange}
          placeholder="Contact name"
          filter="alpha"
        />
        <PhoneField
          label="Emergency Contact Number"
          name="emergencyPhone"
          value={form.emergencyPhone}
          onChange={onChange}
        />
        <SelectField
          label="Blood Group"
          name="bloodGroup"
          value={form.bloodGroup}
          onChange={onChange}
          options={BLOOD_GROUP_OPTIONS}
          placeholder="Blood group"
        />
      </div>
    </div>
  );
}

function ReviewStep({
  form,
  defaultPassword,
  copied,
  onCopyPassword,
  confirmChecked,
  setConfirmChecked,
  success,
  error,
}) {
  const basicRows = [
    ["Full Name", form.fullName],
    ["Email", form.email],
    ["Phone", `+91 ${form.phone}`],
    ["Teacher ID", form.teacherId],
    ["Primary Specialization", form.subject],
    ["Gender", form.gender],
    ["Date of Birth", form.dob],
    ["Marital Status", form.maritalStatus],
  ];
  const professionalRows = [
    ["Qualification", form.qualification],
    ["Experience", form.experience && `${form.experience} years`],
    ["Employment Type", form.employmentType],
    ["Department", form.department],
    ["Joining Date", form.joiningDate],
    ["Previous School", form.previousSchool],
    ["Address", form.address],
    ["City", form.city],
    ["State", form.state],
    ["Pincode", form.pincode],
    ["Emergency Contact", form.emergencyName],
    ["Emergency Number", form.emergencyPhone],
    ["Blood Group", form.bloodGroup],
  ];

  return (
    <div>
      <h2 className="text-[15px] font-bold text-gray-900 mb-1">
        Review & Confirm
      </h2>
      <p className="text-[12.5px] text-gray-500 mb-5">
        Double-check the details below before creating the teacher account.
      </p>

      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 mb-5 flex items-center gap-2">
          <Check size={16} className="text-emerald-600" />
          <span className="text-[13px] font-semibold text-emerald-700">
            Teacher account created successfully. Redirecting…
          </span>
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 mb-5">
          <span className="text-[13px] font-semibold text-red-600">
            {error}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
        <SummaryBlock title="Basic Information" rows={basicRows} />
        <SummaryBlock title="Professional Details" rows={professionalRows} />
      </div>

      {/* Class & Subject summary */}
      <div className="rounded-xl border border-gray-100 p-4 mb-5">
        <h3 className="text-[13px] font-bold text-gray-900 mb-3">
          Class & Subject Allocations
        </h3>
        <div className="flex flex-col gap-2">
          {form.classSubjectMappings?.map((item, i) => (
            <div
              key={i}
              className="text-[12.5px] flex items-center justify-between border-b border-gray-50 pb-2"
            >
              <span className="font-semibold text-gray-900">
                Class {item.className || "-"}
              </span>
              <span className="text-gray-600">
                {item.subjects?.join(", ") || "-"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Lock size={15} className="text-violet-600" />
          <span className="font-bold text-gray-900 text-[13.5px]">
            Default Login Password
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white">
          <span className="text-[13px] font-semibold text-gray-900">
            {defaultPassword}
          </span>
          <button
            type="button"
            onClick={onCopyPassword}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-violet-600 hover:text-violet-700 transition-colors cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <Check size={14} /> Copied
              </>
            ) : (
              <>
                <Copy size={14} /> Copy
              </>
            )}
          </button>
        </div>
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmChecked}
          onChange={(e) => setConfirmChecked(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[#ff5722] cursor-pointer"
        />
        <span className="text-[12.5px] text-gray-600">
          I confirm the above information is accurate and this teacher account
          can be created.
        </span>
      </label>
    </div>
  );
}

function SummaryBlock({ title, rows }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <h3 className="text-[13px] font-bold text-gray-900 mb-3">{title}</h3>
      <div className="flex flex-col gap-2">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-3 text-[12.5px]"
          >
            <span className="text-gray-500 shrink-0">{label}</span>
            <span className="font-semibold text-gray-900 text-right wrap-break-words">
              {value || "-"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeacherPreview({ form }) {
  const rows = [
    ["Full Name", form.fullName],
    ["Email", form.email],
    ["Phone", form.phone],
    ["Teacher ID", form.teacherId],
    ["Subject", form.subject],
    ["Gender", form.gender],
    ["Date of Birth", form.dob],
    ["Department", form.department],
    ["Employment Type", form.employmentType],
    ["Joining Date", form.joiningDate],
  ];

  return (
    <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-4">
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-1">Teacher Preview</h3>
        <p className="text-[12.5px] text-gray-500 mb-5">
          Review the entered basic information.
        </p>
        <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4 text-violet-600 font-bold text-xl">
          {form.fullName ? (
            form.fullName.charAt(0).toUpperCase()
          ) : (
            <User size={32} />
          )}
        </div>
        <div className="text-center mb-5">
          <div className="font-bold text-gray-900 text-base">
            {form.fullName || "Teacher Name"}
          </div>
          <div className="text-[12px] text-gray-500">
            {form.subject || "Specialization"}
          </div>
        </div>
        <div className="flex flex-col gap-2.5 border-t border-gray-100 pt-4">
          {rows.map(([label, val]) => (
            <div key={label} className="flex justify-between text-[12px]">
              <span className="text-gray-400">{label}</span>
              <span className="font-medium text-gray-800 text-right truncate max-w-40">
                {val || "-"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
