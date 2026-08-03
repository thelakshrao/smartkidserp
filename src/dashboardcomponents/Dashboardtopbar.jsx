"use client";
import { Search, Bell, Calendar, ChevronDown, Menu } from "lucide-react";
import Image from "next/image";
import logo from "../images/logo.png";

const ROLE_LABELS = {
  developer: "Developer",
  owner: "Owner",
  principal: "Principal",
  admin: "Administrator",
  clerk: "Clerk",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
};

export default function DashboardTopbar({
  profile,
  notificationCount = 0,
  onMenuClick = () => {},
}) {
  return (
    <header
      className="h-20 shrink-0 bg-white border-b border-gray-100 flex items-center gap-4 px-5 sm:px-8
                 sticky top-0 z-30 w-full"
    >
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-700 cursor-pointer"
      >
        <Menu size={22} />
      </button>

      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center overflow-hidden">
          <Image
            src={logo}
            alt=""
            width={30}
            height={30}
            className="object-contain"
          />
        </div>
        <div className="leading-tight hidden sm:block">
          <div className="font-bold text-[13.5px] text-gray-900">
            Smart Kids Convent School
          </div>
          <div className="text-[10.5px] text-gray-500 font-medium">
            Heera Nagar, Gurugram
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-md ml-2 hidden md:block">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search students, staff, parents..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-900
                       placeholder:text-gray-400 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3 ml-auto">
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 transition cursor-pointer">
          <Calendar size={18} />
        </button>

        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 transition cursor-pointer">
          <Bell size={18} />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 min-w-4.5 h-4.5 px-1 rounded-full bg-[#ff5722] text-white text-[10px] font-bold flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 ml-1 border-l border-gray-100 cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center font-bold text-[13px] text-orange-600 overflow-hidden shrink-0">
            {profile?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              profile?.name?.[0]?.toUpperCase() || "?"
            )}
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="text-[13px] font-bold text-gray-900">
              {profile?.name}
            </div>
            <div className="text-[10.5px] text-gray-500 font-medium">
              {ROLE_LABELS[profile?.role] || profile?.role}
            </div>
          </div>
          <ChevronDown size={16} className="text-gray-400 hidden sm:block" />
        </div>
      </div>
    </header>
  );
}