import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send, AlertTriangle, CheckCircle2, ShieldCheck, Lock,
  Calendar, FileSpreadsheet, Eye, Bell, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { academicApi, resultApi } from '../../services/api';
import { cn } from '../../lib/utils';

export function ResultPublishPage() {
  const queryClient = useQueryClient();
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState('');

  const { data: examinations = [], isLoading: loadingExams } = useQuery({
    queryKey: ['examinations'],
    queryFn: async () => (await academicApi.listExaminations()).data.data || [],
  });

  const { data: results = [] } = useQuery({
    queryKey: ['resultsForPublish', selectedExamId],
    queryFn: async () => {
      const res = await resultApi.listResults({
        examinationId: selectedExamId || undefined,
        limit: 100,
      });
      return res.data?.data || [];
    },
  });

  const selectedExam = examinations.find((e: any) => e._id === selectedExamId);

  const approvedCount = results.filter((r: any) => r.status === 'APPROVED').length;
  const publishedCount = results.filter((r: any) => r.status === 'PUBLISHED').length;
  const draftOrSubmitted = results.filter((r: any) => r.status === 'DRAFT' || r.status === 'SUBMITTED').length;

  const handlePublish = async () => {
    if (!selectedExamId) {
      setPublishError('Please select an examination cycle first.');
      return;
    }

    try {
      setIsPublishing(true);
      setPublishError('');
      await resultApi.publishExam(selectedExamId);
      setPublishSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['resultsForPublish'] });
      queryClient.invalidateQueries({ queryKey: ['examOfficerResults'] });
    } catch (err: any) {
      setPublishError(err?.response?.data?.message || 'Error occurred during result publication.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <Link
            to="/exam-officer/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Moderation Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Send className="w-6 h-6 text-indigo-400" />
            Official Examination Result Publication Portal
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Publish results officially to student portals, generate grade cards, recalculate CGPA, and trigger automated alerts.
          </p>
        </div>
      </div>

      {/* Warnings & Feedback */}
      {publishSuccess && (
        <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Publication Successfully Executed!
          </div>
          <p className="text-sm text-emerald-300/90 font-medium">
            Results have been officially published. SGPA and CGPA have been recalculated for all affected students, and notifications have been dispatched.
          </p>
        </div>
      )}

      {publishError && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2 font-medium">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {publishError}
        </div>
      )}

      {/* Selector */}
      <div className="bg-[#0a0f1d] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <label className="block text-sm font-bold text-white">
          Select Examination Cycle to Publish
        </label>
        <select
          value={selectedExamId}
          onChange={(e) => {
            setSelectedExamId(e.target.value);
            setPublishSuccess(false);
            setPublishError('');
          }}
          className="w-full sm:w-1/2 bg-[#030712] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner"
        >
          <option value="">-- Choose Examination Cycle --</option>
          {examinations.map((ex: any) => (
            <option key={ex._id} value={ex._id}>
              {ex.title} ({ex.session}) — Status: {ex.status}
            </option>
          ))}
        </select>
      </div>

      {selectedExam && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl">
            <span className="text-xs text-slate-300 uppercase font-semibold">Approved & Ready to Publish</span>
            <div className="text-3xl font-extrabold text-blue-400 mt-2">{approvedCount}</div>
            <span className="text-xs text-slate-400 mt-1 block font-medium">Grades finalized by Controller</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl">
            <span className="text-xs text-slate-300 uppercase font-semibold">Already Published</span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2">{publishedCount}</div>
            <span className="text-xs text-slate-400 mt-1 block font-medium">Live in student portals</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl">
            <span className="text-xs text-slate-300 uppercase font-semibold">Incomplete / Draft</span>
            <div className="text-3xl font-extrabold text-amber-400 mt-2">{draftOrSubmitted}</div>
            <span className="text-xs text-slate-400 mt-1 block font-medium">Requires faculty or HOD signoff</span>
          </div>
        </div>
      )}

      {/* Critical Publication Card */}
      <div className="p-6 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Authorize & Dispatch Publication</h3>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Publishing will make the selected examination marks visible to students, lock individual subject records against further faculty edits, and trigger the SGPA/CGPA recalculation engine.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
          <div className="text-xs text-slate-400 flex items-center gap-2 font-medium">
            <Lock className="w-4 h-4 text-amber-400" />
            Publication actions are cryptographically logged in the system Audit Trail.
          </div>

          <button
            onClick={handlePublish}
            disabled={!selectedExamId || isPublishing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {isPublishing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publishing Results...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Confirm & Publish Examination
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
