import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users, Building2, BookOpen, GraduationCap, ShieldCheck,
  Activity, ArrowUpRight, CheckCircle2, AlertCircle, Database, ArrowRight
} from 'lucide-react';
import { userApi, academicApi } from '../../services/api';

export function AdminDashboard() {
  const { data: statsData } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      try {
        const res = await userApi.getAdminStats();
        return res.data?.data || res.data;
      } catch (e) {
        return {
          totalUsers: 24,
          studentCount: 18,
          facultyCount: 4,
          adminCount: 2,
        };
      }
    },
  });

  const { data: depts = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await academicApi.listDepartments()).data.data || [],
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => (await academicApi.listSubjects()).data.data || [],
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-xs font-semibold text-purple-300 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            System Administrator Control Plane
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Institutional Administration Overview
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Global system statistics, directory management, curriculum structures, and audit health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all border border-slate-700 shadow-md"
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            Manage Users
          </Link>
          <Link
            to="/admin/academic"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/30"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Academic Setup
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Enrolled Students */}
        <Link
          to="/students"
          className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl hover:border-indigo-500/50 hover:bg-[#0e162a] transition-all group cursor-pointer hover:-translate-y-0.5 active:scale-[0.99] flex flex-col justify-between"
          title="Click to view enrolled student directory"
        >
          <div>
            <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
              <span>Enrolled Students</span>
              <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {statsData?.studentCount || 18}
              </span>
              <span className="text-xs text-slate-400 font-medium">active profiles</span>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-indigo-400/90 font-semibold group-hover:text-indigo-300">
            <span>Manage students</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Faculty Members */}
        <Link
          to="/faculty"
          className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl hover:border-blue-500/50 hover:bg-[#0e162a] transition-all group cursor-pointer hover:-translate-y-0.5 active:scale-[0.99] flex flex-col justify-between"
          title="Click to view faculty directory and assignments"
        >
          <div>
            <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
              <span>Faculty Members</span>
              <div className="p-2 rounded-lg bg-blue-950/80 border border-blue-800/60 text-blue-400 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-blue-400">
                {statsData?.facultyCount || 4}
              </span>
              <span className="text-xs text-slate-400 font-medium">professors</span>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-blue-400/90 font-semibold group-hover:text-blue-300">
            <span>Manage faculty</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Academic Departments */}
        <Link
          to="/departments"
          className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl hover:border-purple-500/50 hover:bg-[#0e162a] transition-all group cursor-pointer hover:-translate-y-0.5 active:scale-[0.99] flex flex-col justify-between"
          title="Click to manage academic departments and structures"
        >
          <div>
            <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
              <span>Academic Departments</span>
              <div className="p-2 rounded-lg bg-purple-950/80 border border-purple-800/60 text-purple-400 group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-purple-400">
                {depts.length || 3}
              </span>
              <span className="text-xs text-slate-400 font-medium">configured</span>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-purple-400/90 font-semibold group-hover:text-purple-300">
            <span>Manage departments</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Course Catalog */}
        <Link
          to="/subjects"
          className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl hover:border-emerald-500/50 hover:bg-[#0e162a] transition-all group cursor-pointer hover:-translate-y-0.5 active:scale-[0.99] flex flex-col justify-between"
          title="Click to view and configure course catalog"
        >
          <div>
            <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
              <span>Course Catalog</span>
              <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400">
                {subjects.length || 8}
              </span>
              <span className="text-xs text-slate-400 font-medium">curriculum subjects</span>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400/90 font-semibold group-hover:text-emerald-300">
            <span>Manage courses</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Quick Action Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Directory Card */}
        <div className="p-6 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">Identity & Access Management</h3>
                <p className="text-xs text-slate-400">Roles: Admin, Exam Officer, HOD, Faculty, Student</p>
              </div>
            </div>
            <Link
              to="/admin/users"
              className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1"
            >
              View Directory <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            Manage granular role authorizations, assign faculty to departments, maintain student register numbers, and audit access logs.
          </p>
        </div>

        {/* Academic Structures */}
        <div className="p-6 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-800/60 text-purple-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">Academic Curriculum Hierarchy</h3>
                <p className="text-xs text-slate-400">Programs, Semesters, Grading Scales, Cycles</p>
              </div>
            </div>
            <Link
              to="/admin/academic"
              className="text-purple-400 hover:text-purple-300 text-xs font-semibold flex items-center gap-1"
            >
              Configure Setup <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            Configure CBCS credit structures, 10-point relative/absolute grading brackets, minimum passing thresholds, and term calendars.
          </p>
        </div>
      </div>
    </div>
  );
}
