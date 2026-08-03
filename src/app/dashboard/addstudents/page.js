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
} from "lucide-react";
import DashboardSidebar from "@/dashboardcomponents/Dashboardsidebar";
import DashboardTopbar from "@/dashboardcomponents/Dashboardtopbar";
import { useAuth } from "@/context/AuthContext";
import {
  db,
  createStudentLogin,
  getClassTeacher,
  setClassTeacher,
} from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";

const STEPS = [
  { id: 1, label: "Basic Information" },
  { id: 2, label: "Guardian & Fee Info" },
  { id: 3, label: "Review & Confirm" },
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
  "11-Science",
  "11-Commerce",
  "11-Arts",
  "12-Science",
  "12-Commerce",
  "12-Arts",
];
const SECTION_OPTIONS = ["A", "B", "C", "D"];
const GENDER_OPTIONS = ["Male", "Female", "Other"];
const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const RELATION_OPTIONS = ["Father", "Mother", "Guardian", "Other"];
const FEE_STATUS_OPTIONS = ["Paid", "Pending", "Partial"];

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
  admissionNumber: "",
  className: "",
  section: "",
  gender: "",
  dob: "",
  bloodGroup: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  guardianName: "",
  guardianRelation: "",
  guardianPhone: "",
  guardianEmail: "",
  motherName: "",
  motherPhone: "",
  motherEmail: "",
  feeTotal: "",
  feePaid: "",
  feePending: "",
  feeStatus: "",
  emergencyName: "",
  emergencyPhone: "",
};

export default function AddStudentPage() {
  const router = useRouter();
  const { profile } = useAuth?.() || {};
  const isAdmin = profile?.role !== "teacher";
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
    if (form.className && form.section) {
      getClassTeacher(form.className, form.section).then((data) => {
        setClassTeacherName(data?.teacherName || null);
      });
    } else {
      setClassTeacherName(null);
    }
  }, [form.className, form.section]);

  async function handleAssignClassTeacher(teacherId) {
    const teacher = teacherOptions.find((t) => t.id === teacherId);
    if (!teacher || !form.className || !form.section) return;
    await setClassTeacher(
      form.className,
      form.section,
      teacher.id,
      teacher.name,
    );
    setClassTeacherName(teacher.name);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function isStepValid(currentStep) {
    if (currentStep === 1) {
      return (
        form.fullName.trim() &&
        form.admissionNumber.trim() &&
        form.className &&
        form.gender &&
        form.dob &&
        form.email.trim()
      );
    }
    if (currentStep === 2) {
      return (
        form.guardianName.trim() &&
        form.guardianPhone.trim() &&
        form.feeTotal !== "" &&
        form.feePaid !== "" &&
        form.feeStatus
      );
    }
    return true;
  }

  function goNext() {
    if (!isStepValid(step)) {
      setStepError("Please fill in all required fields before continuing.");
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

  async function handleCreateStudent() {
    if (!confirmChecked) {
      setStepError(
        "Please confirm the information is accurate before creating the account.",
      );
      return;
    }
    setStepError("");
    setError("");
    setSubmitting(true);
    try {
      const authUid = await createStudentLogin({
        email: form.email,
        password: defaultPassword,
        fullName: form.fullName,
        phone: form.phone,
        admissionNumber: form.admissionNumber,
        className: form.className,
        createdBy: profile?.uid || profile?.name,
      });

      const computedPending = Math.max(
        0,
        (Number(form.feeTotal) || 0) - (Number(form.feePaid) || 0),
      );

      await addDoc(collection(db, "students"), {
        ...form,
        feePending: form.feeStatus === "Paid" ? 0 : computedPending,
        authUid,
        role: "student",
        status: "active",
        createdBy: profile?.uid || profile?.name || null,
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/students");
      }, 1400);
    } catch (err) {
      console.error("Failed to create student:", err);
      if (err.code === "auth/email-already-in-use") {
        setError(
          "This email already has a login account. Use a different email.",
        );
      } else {
        setError(
          "Something went wrong while creating the student. Please try again.",
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
          dashboardType={isAdmin ? "admin" : "teacher"}
          activeItem="Students"
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-5 sm:p-8">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="text-[13px] text-gray-500 flex items-center gap-1.5">
                <span>Dashboard</span>
                <span>&gt;</span>
                <span>Students</span>
                <span>&gt;</span>
                <span className="text-gray-900 font-semibold">Add Student</span>
              </div>
              <Link
                href="/dashboard/students"
                className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft size={15} />
                Back to Students
              </Link>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              Add New Student
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              Fill in the basic information to create a new student record.
            </p>

            <Stepper currentStep={step} />

            <div className="flex flex-col lg:flex-row gap-5 items-start">
              <div className="flex-1 w-full bg-white rounded-2xl p-5 sm:p-7 border border-gray-100 shadow-sm">
                {step === 1 && (
                  <BasicInformationStep
                    form={form}
                    onChange={handleChange}
                    classTeacherName={classTeacherName}
                    teacherOptions={teacherOptions}
                    onAssignClassTeacher={handleAssignClassTeacher}
                    isAdmin={isAdmin}
                  />
                )}
                {step === 2 && (
                  <GuardianFeeStep form={form} onChange={handleChange} />
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
                      href="/dashboard/students"
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
                      onClick={handleCreateStudent}
                      disabled={submitting || success}
                      className="flex items-center gap-1.5 rounded-xl bg-[#ff5722] px-6 py-2.5 text-[13.5px] font-bold text-white hover:bg-[#f4511e] transition-colors cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting && (
                        <Loader2 size={15} className="animate-spin" />
                      )}
                      {success
                        ? "Student Created!"
                        : submitting
                          ? "Creating..."
                          : "Create Student"}
                    </button>
                  )}
                </div>
              </div>

              <StudentPreview form={form} />
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
                ${currentStep === s.id ? "bg-[#ff5722] text-white" : currentStep > s.id ? "bg-[#ff5722]/70 text-white" : "bg-gray-100 text-gray-400"}`}
            >
              {s.id}
            </div>
            <span
              className={`text-[13px] font-semibold whitespace-nowrap ${currentStep >= s.id ? "text-gray-900" : "text-gray-400"}`}
            >
              {s.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-3 transition-colors ${currentStep > s.id ? "bg-[#ff5722]/50" : "bg-gray-100"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function BasicInformationStep({
  form,
  onChange,
  classTeacherName,
  teacherOptions,
  onAssignClassTeacher,
  isAdmin,
}) {
  return (
    <div>
      <h2 className="text-[15px] font-bold text-gray-900 mb-1">
        Basic Information
      </h2>
      <p className="text-[12.5px] text-gray-500 mb-5">
        Enter the student's basic details and class assignment.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <TextField
          label="Full Name"
          name="fullName"
          value={form.fullName}
          onChange={onChange}
          placeholder="Enter full name"
          required
        />
        <TextField
          label="Admission Number"
          name="admissionNumber"
          value={form.admissionNumber}
          onChange={onChange}
          placeholder="Enter admission number"
          helper="Example: STU2026001"
          required
        />
        <PhoneField value={form.phone} onChange={onChange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        <SelectField
          label="Class"
          name="className"
          value={form.className}
          onChange={onChange}
          options={CLASS_OPTIONS}
          placeholder="Select class"
          required
        />
        <SelectField
          label="Section"
          name="section"
          value={form.section}
          onChange={onChange}
          options={SECTION_OPTIONS}
          placeholder="Select section"
        />
        <SelectField
          label="Gender"
          name="gender"
          value={form.gender}
          onChange={onChange}
          options={GENDER_OPTIONS}
          placeholder="Select gender"
          required
        />
      </div>

      {form.className && form.section && (
        <div className="mb-4">
          {classTeacherName ? (
            <p className="text-[11.5px] text-gray-500">
              Class Teacher:{" "}
              <span className="font-semibold text-gray-700">
                {classTeacherName}
              </span>
            </p>
          ) : isAdmin ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11.5px] text-gray-500">
                No class teacher assigned yet —
              </span>
              <select
                onChange={(e) => onAssignClassTeacher(e.target.value)}
                defaultValue=""
                className="text-[12px] px-2 py-1 rounded-lg border border-gray-200 bg-gray-50 outline-none cursor-pointer"
              >
                <option value="" disabled>
                  Assign one...
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
              No class teacher assigned yet.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <TextField
          label="Date of Birth"
          name="dob"
          type="date"
          value={form.dob}
          onChange={onChange}
          required
        />
        <SelectField
          label="Blood Group"
          name="bloodGroup"
          value={form.bloodGroup}
          onChange={onChange}
          options={BLOOD_GROUP_OPTIONS}
          placeholder="Select blood group"
        />
        <TextField
          label="Email Address"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          placeholder="Enter email address"
          helper="Used to create the student's login account"
          required
        />
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
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 bg-gray-50 placeholder:text-gray-400 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TextField
          label="City"
          name="city"
          value={form.city}
          onChange={onChange}
          placeholder="Enter city"
        />
        <TextField
          label="State"
          name="state"
          value={form.state}
          onChange={onChange}
          placeholder="Enter state"
        />
        <TextField
          label="Pincode"
          name="pincode"
          value={form.pincode}
          onChange={onChange}
          placeholder="Enter pincode"
        />
      </div>
    </div>
  );
}

function GuardianFeeStep({ form, onChange }) {
  return (
    <div>
      <h2 className="text-[15px] font-bold text-gray-900 mb-1">
        Guardian & Fee Information
      </h2>
      <p className="text-[12.5px] text-gray-500 mb-5">
        Enter guardian contact details and initial fee information.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <TextField
          label="Guardian Name"
          name="guardianName"
          value={form.guardianName}
          onChange={onChange}
          placeholder="Enter guardian name"
          required
        />
        <SelectField
          label="Relation"
          name="guardianRelation"
          value={form.guardianRelation}
          onChange={onChange}
          options={RELATION_OPTIONS}
          placeholder="Select relation"
        />
        <TextField
          label="Guardian Phone"
          name="guardianPhone"
          type="tel"
          value={form.guardianPhone}
          onChange={onChange}
          placeholder="Enter guardian phone"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <TextField
          label="Guardian Email (optional)"
          name="guardianEmail"
          type="email"
          value={form.guardianEmail}
          onChange={onChange}
          placeholder="Enter guardian email"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 border-t border-gray-100 pt-5">
        <TextField
          label="Mother's Name (optional)"
          name="motherName"
          value={form.motherName}
          onChange={onChange}
          placeholder="Enter mother's name"
        />
        <TextField
          label="Mother's Phone (optional)"
          name="motherPhone"
          type="tel"
          value={form.motherPhone}
          onChange={onChange}
          placeholder="Enter mother's phone"
        />
        <TextField
          label="Mother's Email (optional)"
          name="motherEmail"
          type="email"
          value={form.motherEmail}
          onChange={onChange}
          placeholder="Enter mother's email"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 border-t border-gray-100 pt-5">
        <TextField
          label="Total Fee"
          name="feeTotal"
          type="number"
          value={form.feeTotal}
          onChange={onChange}
          placeholder="e.g. 45000"
          required
        />
        <TextField
          label="Amount Paid"
          name="feePaid"
          type="number"
          value={form.feePaid}
          onChange={onChange}
          placeholder="e.g. 45000"
          required
        />
        <SelectField
          label="Fee Status"
          name="feeStatus"
          value={form.feeStatus}
          onChange={onChange}
          options={FEE_STATUS_OPTIONS}
          placeholder="Select status"
          required
        />
      </div>

      {form.feeStatus && form.feeStatus !== "Paid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-[12px] font-semibold text-gray-900 mb-1.5">
              Pending Amount
            </label>
            <div className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-900 bg-gray-100">
              ₹
              {Math.max(
                0,
                (Number(form.feeTotal) || 0) - (Number(form.feePaid) || 0),
              ).toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Calculated automatically from Total Fee − Amount Paid
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          label="Emergency Contact Name"
          name="emergencyName"
          value={form.emergencyName}
          onChange={onChange}
          placeholder="Contact name"
        />
        <TextField
          label="Emergency Contact Number"
          name="emergencyPhone"
          type="tel"
          value={form.emergencyPhone}
          onChange={onChange}
          placeholder="Contact number"
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
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-gray-900 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 bg-gray-50 placeholder:text-gray-400 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
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
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 bg-gray-50 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
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

function PhoneField({ value, onChange }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-gray-900 mb-1.5">
        Phone Number
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
          name="phone"
          value={value}
          onChange={onChange}
          placeholder="Enter phone number"
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 bg-gray-50 placeholder:text-gray-400 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
        />
      </div>
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
            A default password will be generated for this student. Share it
            securely.
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
    ["Admission Number", form.admissionNumber],
    ["Class", form.className],
    ["Section", form.section],
    ["Gender", form.gender],
    ["Date of Birth", form.dob],
    ["Blood Group", form.bloodGroup],
    ["Email", form.email],
    ["Phone", form.phone && `+91 ${form.phone}`],
  ];
  const guardianRows = [
    ["Guardian Name", form.guardianName],
    ["Relation", form.guardianRelation],
    ["Guardian Phone", form.guardianPhone],
    ["Guardian Email", form.guardianEmail],
    ["Mother's Name", form.motherName],
    ["Mother's Phone", form.motherPhone],
    ["Mother's Email", form.motherEmail],
    ["Total Fee", form.feeTotal && `₹${form.feeTotal}`],
    ["Amount Paid", form.feePaid && `₹${form.feePaid}`],
    [
      "Pending Amount",
      form.feeStatus !== "Paid" && form.feePending
        ? `₹${form.feePending}`
        : "-",
    ],
    ["Fee Status", form.feeStatus],
    ["Emergency Contact", form.emergencyName],
    ["Emergency Number", form.emergencyPhone],
  ];

  return (
    <div>
      <h2 className="text-[15px] font-bold text-gray-900 mb-1">
        Review & Confirm
      </h2>
      <p className="text-[12.5px] text-gray-500 mb-5">
        Double-check the details below before creating the student record.
      </p>

      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 mb-5 flex items-center gap-2">
          <Check size={16} className="text-emerald-600" />
          <span className="text-[13px] font-semibold text-emerald-700">
            Student record created successfully. Redirecting…
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
        <SummaryBlock title="Guardian & Fee Details" rows={guardianRows} />
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
          I confirm the above information is accurate and this student record
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

function StudentPreview({ form }) {
  const rows = [
    ["Full Name", form.fullName],
    ["Admission Number", form.admissionNumber],
    ["Class", form.className],
    ["Section", form.section],
    ["Gender", form.gender],
    ["Date of Birth", form.dob],
    ["Guardian", form.guardianName],
    ["Guardian Phone", form.guardianPhone],
  ];

  return (
    <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-4">
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-1">Student Preview</h3>
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
            {form.fullName || "Student Name"}
          </div>
          <div className="text-[12px] text-gray-500">
            {form.className
              ? `Class ${form.className}${form.section ? ` - ${form.section}` : ""}`
              : "Class"}
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
