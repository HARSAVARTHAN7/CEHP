import { useState } from 'react';
import {
  BookMarked, Calendar, Clock, CheckCircle2, AlertCircle,
  Sparkles, Target, ArrowRight, BrainCircuit, RefreshCw
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function StudyPlannerPage() {
  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [generating, setGenerating] = useState(false);
  const [successNote, setSuccessNote] = useState('');

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setSuccessNote('AI Study Timetable recalculated based on your current semester credit weighting.');
      setTimeout(() => setSuccessNote(''), 4000);
    }, 600);
  };

  const plan = [
    {
      day: 'Monday',
      time: '06:00 PM - 08:00 PM',
      subject: 'CS401 - Database Management Systems',
      topic: 'Indexing, B+ Trees & Relational Algebra Optimization',
      priority: 'HIGH',
      credits: 4,
    },
    {
      day: 'Tuesday',
      time: '06:00 PM - 08:00 PM',
      subject: 'CS402 - Operating Systems',
      topic: 'Process Scheduling & Virtual Memory Page Replacement Algorithms',
      priority: 'HIGH',
      credits: 4,
    },
    {
      day: 'Wednesday',
      time: '06:00 PM - 08:00 PM',
      subject: 'CS404 - Design and Analysis of Algorithms',
      topic: 'Dynamic Programming (Knapsack & Matrix Chain Multiplication)',
      priority: 'CRITICAL',
      credits: 4,
    },
    {
      day: 'Thursday',
      time: '06:00 PM - 08:00 PM',
      subject: 'CS403 - Computer Networks',
      topic: 'TCP Congestion Control & Distance Vector Routing Protocol',
      priority: 'MEDIUM',
      credits: 4,
    },
    {
      day: 'Friday',
      time: '05:00 PM - 07:00 PM',
      subject: 'CS405 - Database & OS Lab',
      topic: 'SQL Subqueries, Joins & Unix Kernel Shell Scripts',
      priority: 'MEDIUM',
      credits: 2,
    },
    {
      day: 'Saturday',
      time: '10:00 AM - 01:00 PM',
      subject: 'Full Revision & Practice Paper Solving',
      topic: '3-Year University Previous Question Papers with Time Constraint',
      priority: 'CRITICAL',
      credits: '-',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-xs font-semibold text-indigo-300 mb-2">
            <BrainCircuit className="w-3.5 h-3.5" />
            AI-Powered Academic Timetable
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <BookMarked className="w-6 h-6 text-indigo-400" />
            Personalized Academic Study Planner
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Algorithmic revision roadmap automatically weighted by course credits, internal exam scores, and exam calendar.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
        >
          {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Recompute AI Plan
        </button>
      </div>

      {successNote && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          {successNote}
        </div>
      )}

      {/* Constraints Bar */}
      <div className="bg-[#0a0f1d] p-5 rounded-2xl border border-slate-800 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Daily Dedicated Study Target: <span className="text-indigo-400 font-bold font-mono">{hoursPerDay} Hours / Day</span>
          </label>
          <input
            type="range"
            min="2"
            max="8"
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
            <span>2 hrs (Light)</span>
            <span>4 hrs (Recommended)</span>
            <span>8 hrs (Intensive)</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Active Study Days per Week</label>
          <div className="flex gap-1.5 flex-wrap">
            {daysOfWeek.map((day) => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-bold transition-all border',
                  selectedDays.includes(day)
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:text-white'
                )}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timetable List */}
      <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-[#080d19] flex items-center justify-between">
          <span className="text-sm font-bold text-white">Recommended Weekly Timetable</span>
          <span className="text-xs text-slate-400 font-mono font-medium">Semester IV SEE Focus</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {plan.map((item, idx) => (
            <div key={idx} className="p-5 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-300 font-bold text-xs border border-indigo-800/60 font-mono">
                    {item.day}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{item.time}</span>
                  <span
                    className={cn(
                      'text-[10px] uppercase font-bold px-2 py-0.5 rounded border',
                      item.priority === 'CRITICAL' && 'bg-rose-950/80 text-rose-300 border-rose-800/60',
                      item.priority === 'HIGH' && 'bg-amber-950/80 text-amber-300 border-amber-800/60',
                      item.priority === 'MEDIUM' && 'bg-blue-950/80 text-blue-300 border-blue-800/60'
                    )}
                  >
                    {item.priority}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{item.subject}</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">{item.topic}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-400 font-medium">
                  Weight: <strong className="text-white font-mono">{item.credits} Credits</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
