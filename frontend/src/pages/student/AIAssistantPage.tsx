import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Send, Bot, User, Loader2, BrainCircuit, Sparkles, Trash2, Copy, Check, RotateCcw, AlertCircle } from 'lucide-react';
import { aiApi, studentApi } from '../../services/api';
import { cn } from '../../lib/utils';
import { ConfirmModal } from '../../components/ConfirmModal';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  mode?: string;
  suggestions?: string[];
  isError?: boolean;
  failedText?: string;
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: "Hello! I am your AI Academic Assistant. Grounded directly in your university records, I can evaluate your CGPA progression, identify backlogs, explain CBCS grading criteria, and build a tailored study timetable. How can I help you today?",
  suggestions: [
    "How much SGPA do I need next semester to reach target CGPA 9.0?",
    "Explain how my SGPA was calculated",
    "Compare my last two semesters",
    "What is my current CGPA?",
  ],
};

const DEFAULT_SUGGESTED_QUESTIONS = [
  "How much SGPA do I need next semester to reach target CGPA 9.0?",
  "Explain how my SGPA was calculated",
  "Compare my last two semesters",
  "What is my current CGPA?",
  "Which subjects have I failed or have arrears in?",
  "Explain why my CGPA decreased",
  "Create a study plan for my weak subjects",
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(DEFAULT_SUGGESTED_QUESTIONS);

  const { data: summaryRes } = useQuery({
    queryKey: ['performance-summary'],
    queryFn: () => aiApi.performanceSummary(),
    retry: false,
  });

  const summary = summaryRes?.data?.data || null;

  const { data: arrearsRes } = useQuery({
    queryKey: ['myArrears'],
    queryFn: () => studentApi.getArrears(),
    retry: false,
  });

  const arrearsData = arrearsRes?.data?.data || arrearsRes?.data;

  const sendMessage = async (text: string, isRetry: boolean = false) => {
    if (!text.trim() || isLoading) return;

    const queryText = text.trim();
    if (!isRetry) {
      const userMsg: Message = { role: 'user', content: queryText };
      setMessages((prev) => [...prev, userMsg]);
    }
    setInput('');
    setIsLoading(true);

    try {
      // Build history excluding errors and excluding the current question
      const currentHistory = messages
        .filter((m) => !m.isError && m.content !== queryText)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await aiApi.chat(queryText, currentHistory);
      const aiData = res.data?.data || res.data;
      const answer = aiData?.answer || aiData?.response || "Academic inquiry completed successfully.";
      const newSuggestions: string[] = Array.isArray(aiData?.suggestions) && aiData.suggestions.length > 0
        ? aiData.suggestions
        : suggestedQuestions;

      setMessages((prev) => [
        ...prev.filter((m) => !m.isError),
        {
          role: 'assistant',
          content: answer,
          mode: aiData?.mode || 'gemini',
          suggestions: newSuggestions,
        },
      ]);

      setSuggestedQuestions(newSuggestions);
    } catch (err: any) {
      let errorMsg = "The AI assistant encountered an unexpected processing issue. Please click below to retry.";
      if (err.response) {
        if (err.response.status === 401) {
          errorMsg = "Your session has expired. Please log in again to continue.";
        } else if (err.response.status === 429) {
          errorMsg = err.response.data?.message || "AI inquiry rate limit reached. Please wait a moment before trying again.";
        } else if (err.response.status === 503) {
          errorMsg = "The academic records or AI service is temporarily unavailable. Please click below to retry.";
        } else if (err.response.data?.message && typeof err.response.data.message === 'string' && !err.response.data.message.includes('Internal server error')) {
          errorMsg = err.response.data.message;
        } else {
          errorMsg = "Unable to process inquiry at this moment. Please click below to retry.";
        }
      } else if (err.request) {
        errorMsg = "Unable to reach the CEHP server. Please check your network connection and retry.";
      }

      setMessages((prev) => [
        ...prev.filter((m) => !m.isError),
        {
          role: 'assistant',
          content: errorMsg,
          mode: 'error',
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryLastMessage = () => {
    const lastErrorMsg = [...messages].reverse().find((m) => m.isError);
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    const retryText = lastUserMsg?.content || lastErrorMsg?.failedText;
    if (retryText) {
      // Remove trailing error message and retry the question
      setMessages((prev) => prev.filter((m) => !m.isError));
      sendMessage(retryText, Boolean(lastUserMsg));
    }
  };

  const handleConfirmClearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setSuggestedQuestions(DEFAULT_SUGGESTED_QUESTIONS);
    setShowClearConfirm(false);
  };

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={showClearConfirm}
        title="Clear Chat Conversation?"
        message="Are you sure you want to clear your current conversation history with the AI Assistant? All previous responses will be removed."
        confirmLabel="Yes, Clear Chat"
        cancelLabel="Cancel"
        onConfirm={handleConfirmClearChat}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* Header */}
      <div className="bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <BrainCircuit className="w-7 h-7 text-indigo-400" />
            AI Academic Assistant & Advisory Console
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Context-aware guidance grounded directly in your institutional academic records and CBCS grading rules.
          </p>
        </div>

        {messages.length > 1 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-600 dark:hover:text-rose-300 text-slate-700 dark:text-slate-400 text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Chat
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Performance quick summary */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Performance Telemetry</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Cumulative CGPA</span>
                <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                  {summary?.overallCGPA !== undefined ? summary.overallCGPA.toFixed(2) : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Trajectory</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                  {summary?.performanceTrend || 'STABLE'}
                </span>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-1.5">Top Scoring Courses</p>
                {summary?.strongSubjects && summary.strongSubjects.length > 0 ? (
                  summary.strongSubjects.slice(0, 3).map((sub: any, i: number) => (
                    <span
                      key={i}
                      className="block text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-lg mb-1 font-mono text-xs truncate"
                      title={sub.name}
                    >
                      {sub.name}{sub.grade ? ` (${sub.grade})` : ''}
                    </span>
                  ))
                ) : (
                  <span className="block text-slate-400 italic text-xs py-1">
                    No high-scoring courses recorded yet
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Suggested Inquiries Panel */}
          <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Suggested Inquiries
              </h3>
            </div>
            <div className="space-y-1.5">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(q)}
                  disabled={isLoading}
                  className="w-full text-left text-xs px-3 py-2.5 bg-white dark:bg-[#030712] hover:bg-indigo-50 dark:hover:bg-indigo-950/70 rounded-xl transition-all text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-300 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group"
                >
                  <span className="line-clamp-2">{q}</span>
                  <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                    Ask →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="lg:col-span-3 flex flex-col bg-[#0a0f1d] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden" style={{ height: '620px' }}>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md group relative',
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-tr-sm font-medium'
                      : msg.isError
                      ? 'bg-rose-950/40 text-rose-200 border border-rose-800/60 rounded-tl-sm'
                      : 'bg-slate-100 dark:bg-[#121a2d] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/60 rounded-tl-sm'
                  )}
                >
                  {msg.role === 'assistant' && !msg.isError && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(msg.content);
                        setCopiedIdx(idx);
                        setTimeout(() => setCopiedIdx(null), 2000);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center gap-1 shadow-sm"
                      title="Copy response to clipboard"
                    >
                      {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  {msg.isError && (
                    <div className="flex items-center gap-2 text-rose-300 font-semibold mb-1">
                      <AlertCircle className="w-4 h-4" />
                      Inquiry Processing Error
                    </div>
                  )}

                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
                  ))}

                  {msg.isError && (
                    <button
                      type="button"
                      aria-label="Retry Question"
                      disabled={isLoading}
                      onClick={handleRetryLastMessage}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-semibold border border-rose-700 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>Retry Question</span>
                    </button>
                  )}

                  {msg.mode && !msg.isError && (
                    <p className="text-[10px] mt-1.5 text-indigo-400 font-mono flex items-center gap-1">
                      {msg.mode === 'gemini' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          Generated by Google Gemini AI (Grounded in Verified Records)
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          Verified via institutional calculation engine ({msg.mode})
                        </span>
                      )}
                    </p>
                  )}

                  {/* Contextual Suggested Quick-Followups right below the message */}
                  {msg.suggestions && msg.suggestions.length > 0 && idx === messages.length - 1 && !isLoading && (
                    <div className="mt-3 pt-2.5 border-t border-slate-700/50 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        Relevant Follow-up Inquiries:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestions.map((s, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => sendMessage(s)}
                            disabled={isLoading}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 hover:text-white transition-all text-left shadow-sm disabled:opacity-50"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-700/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-100 dark:bg-[#121a2d] border border-slate-200 dark:border-slate-700/60 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 text-xs text-indigo-300">
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  Analyzing institutional records & formulating response...
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-[#080d19]">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex gap-2"
            >
              <input
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your CGPA, arrear backlogs, study timetable..."
                className="flex-1 px-4 py-2.5 bg-white dark:bg-[#030712] border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-inner"
                disabled={isLoading}
              />
              <button
                id="chat-send"
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-40 flex items-center gap-1.5 text-sm font-semibold active:scale-95"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Responses are computed directly from official academic records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
