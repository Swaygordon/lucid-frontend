import React from 'react';

const baseShell = 'min-h-screen bg-white dark:bg-[#0f1117] animate-pulse';
const block = 'bg-gray-200 dark:bg-[#252b3b] rounded';

export function HomeSkeleton() {
  return (
    <div className={baseShell}>
      <div className="flex flex-col items-center justify-center py-16 sm:py-24 px-4 text-center">
        <div className={`h-9 w-48 ${block} rounded-full mb-6`} />
        <div className={`h-10 sm:h-12 w-3/4 max-w-lg ${block} rounded-lg mb-3`} />
        <div className={`h-10 sm:h-12 w-1/2 max-w-xs ${block} rounded-lg mb-6`} />
        <div className={`h-4 w-full max-w-md ${block} mb-2`} />
        <div className={`h-4 w-3/4 max-w-sm ${block} mb-8`} />
        <div className={`w-full max-w-2xl h-12 ${block} rounded-xl mb-14`} />
        <div className="flex justify-center gap-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className={`w-16 h-16 rounded-lg ${block}`} />
              <div className={`w-12 h-3 ${block}`} />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-[#1a1f2e] px-4 py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className={`h-8 w-48 ${block}`} />
            <div className={`h-4 w-full ${block}`} />
            <div className={`h-4 w-4/5 ${block}`} />
            <div className={`h-10 w-36 ${block} rounded-lg mt-2`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`h-28 ${block} rounded-xl`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthFormSkeleton() {
  return (
    <div className={`${baseShell} flex items-center justify-center px-4 py-12`}>
      <div className="w-full max-w-md bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-xl p-8 space-y-5 border dark:border-[#1e293b]">
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className={`w-14 h-14 rounded-full ${block}`} />
          <div className={`h-6 w-40 ${block}`} />
          <div className={`h-4 w-56 ${block}`} />
        </div>
        <div className="space-y-2">
          <div className={`h-4 w-20 ${block}`} />
          <div className={`h-11 w-full ${block} rounded-lg`} />
        </div>
        <div className="space-y-2">
          <div className={`h-4 w-24 ${block}`} />
          <div className={`h-11 w-full ${block} rounded-lg`} />
        </div>
        <div className={`h-11 w-full ${block} rounded-lg mt-2`} />
        <div className="flex justify-center">
          <div className={`h-4 w-44 ${block}`} />
        </div>
      </div>
    </div>
  );
}

export function ServicesSkeleton() {
  return (
    <div className={baseShell}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className={`h-5 w-64 ${block}`} />
        <div className={`h-12 w-full max-w-2xl ${block} rounded-xl`} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1a1f2e] rounded-2xl border dark:border-[#1e293b] p-4 space-y-3">
              <div className={`w-full aspect-square ${block} rounded-xl`} />
              <div className={`h-4 w-3/4 ${block}`} />
              <div className={`h-3 w-1/2 ${block}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className={baseShell}>
      <div className={`h-60 w-full ${block} rounded-none`} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 relative">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 mb-8">
          <div className={`w-32 h-32 rounded-full ${block} border-4 border-white dark:border-[#0f1117]`} />
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div className={`h-7 w-56 ${block} mx-auto sm:mx-0`} />
            <div className={`h-4 w-40 ${block} mx-auto sm:mx-0`} />
          </div>
          <div className={`h-10 w-32 ${block} rounded-lg`} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`h-24 ${block} rounded-xl`} />
          ))}
        </div>
        <div className="space-y-4">
          <div className={`h-6 w-40 ${block}`} />
          <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border dark:border-[#1e293b] p-6 space-y-3">
            <div className={`h-4 w-full ${block}`} />
            <div className={`h-4 w-5/6 ${block}`} />
            <div className={`h-4 w-2/3 ${block}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BookingsSkeleton() {
  return (
    <div className={`${baseShell} bg-gray-50`}>
      <div className="bg-white dark:bg-[#1a1f2e] border-b dark:border-[#1e293b] px-6 py-5 flex items-center gap-4">
        <div className={`w-8 h-8 rounded-lg ${block}`} />
        <div className="space-y-2">
          <div className={`h-6 w-36 ${block} rounded-lg`} />
          <div className={`h-4 w-52 ${block} rounded-lg`} />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="flex gap-3">
          <div className={`h-9 w-24 ${block} rounded-lg`} />
          <div className={`h-9 w-20 ${block} rounded-lg`} />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-[#1a1f2e] rounded-2xl border dark:border-[#1e293b] p-5 flex gap-4">
            <div className={`w-12 h-12 rounded-full ${block} flex-shrink-0`} />
            <div className="flex-1 space-y-3">
              <div className="flex justify-between">
                <div className={`h-5 w-40 ${block}`} />
                <div className={`h-5 w-20 ${block}`} />
              </div>
              <div className={`h-4 w-56 ${block}`} />
              <div className="flex gap-2">
                <div className={`h-8 w-24 ${block} rounded-lg`} />
                <div className={`h-8 w-24 ${block} rounded-lg`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className={`${baseShell} bg-gray-50`}>
      <div className="bg-white dark:bg-[#1a1f2e] border-b dark:border-[#1e293b] px-6 py-5 flex items-center justify-between">
        <div className="space-y-2">
          <div className={`h-6 w-44 ${block} rounded-lg`} />
          <div className={`h-4 w-64 ${block} rounded-lg`} />
        </div>
        <div className={`w-10 h-10 rounded-full ${block}`} />
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 border dark:border-[#1e293b] h-28 flex flex-col justify-between">
              <div className={`h-4 w-3/4 ${block}`} />
              <div className={`h-7 w-1/2 ${block}`} />
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border dark:border-[#1e293b] p-5 space-y-3 h-64">
            <div className={`h-5 w-36 ${block}`} />
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-14 ${block} rounded-xl`} />
            ))}
          </div>
          <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border dark:border-[#1e293b] p-5 h-64">
            <div className={`h-5 w-28 ${block} mb-4`} />
            <div className={`h-48 ${block} rounded-xl`} />
          </div>
        </div>
      </div>
    </div>
  );
}



// ChatSkeleton — Suspense fallback for /lucid/messages.
// Mirrors messages.jsx: header → card (calc(100vh - 180px)) → [list | pane].
const Bar = ({ className = '' }) => (
  <div className={`rounded bg-gray-200 dark:bg-slate-700/60 ${className}`} />
);

// Append to route_skeletons.jsx (uses the file's existing `block` token).
// Mirrors notification_page.jsx: sticky header (back / title / settings) →
// filter pills → date-grouped notification cards.

const NOTIF_GROUPS = [
  { label: 'w-16', cards: [['w-40', 'w-4/5'], ['w-32', 'w-2/3'], ['w-48', 'w-11/12']] },
  { label: 'w-24', cards: [['w-36', 'w-3/4'], ['w-44', 'w-3/5']] },
];

const NOTIF_PILL_WIDTHS = ['w-14', 'w-20', 'w-16', 'w-20', 'w-20', 'w-24', 'w-16'];

export function NotificationsSkeleton() {
  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-[#0f1117] animate-pulse"
      aria-busy="true"
      aria-label="Loading notifications"
    >
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1f2e] border-b border-gray-200 dark:border-[#1e293b]">
        <div className="w-full mx-auto px-10 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-full ${block}`} />
            <div className={`h-8 w-52 ${block} rounded-lg`} />
            <div className={`w-10 h-10 rounded-full ${block}`} />
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 overflow-hidden pb-2">
            {NOTIF_PILL_WIDTHS.map((w, i) => (
              <div key={i} className={`my-2 h-9 ${w} ${block} rounded-full flex-shrink-0`} />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full mx-auto px-10 py-6">
        {/* Mark all read / Clear all */}
        <div className="flex justify-between items-center mb-4">
          <div className={`h-4 w-32 ${block}`} />
          <div className={`h-4 w-20 ${block}`} />
        </div>

        {NOTIF_GROUPS.map((group, gi) => (
          <div key={gi} className="mb-6">
            <div className={`h-4 ${group.label} ${block} mb-3`} />
            <div className="space-y-3">
              {group.cards.map(([titleW, msgW], ci) => (
                <div
                  key={ci}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#1e293b]"
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full ${block}`} />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className={`h-4 ${titleW} max-w-[60%] ${block}`} />
                      <div className={`h-3 w-12 flex-shrink-0 ${block}`} />
                    </div>
                    <div className={`h-3.5 ${msgW} ${block}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ConversationRowSkeleton = ({ nameW, previewW }) => (
  <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-[#1e293b]/50">
    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-700/60 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <Bar className={`h-4 ${nameW}`} />
        <Bar className="h-3 w-6 flex-shrink-0" />
      </div>
      <Bar className={`h-3.5 mt-2 ${previewW}`} />
      <Bar className="h-2.5 w-24 mt-2" />
    </div>
  </div>
);

const ROWS = [
  ['w-28', 'w-4/5'],
  ['w-36', 'w-2/3'],
  ['w-24', 'w-11/12'],
  ['w-32', 'w-3/5'],
  ['w-28', 'w-3/4'],
  ['w-40', 'w-2/3'],
  ['w-24', 'w-4/5'],
];

export const ChatSkeleton = () => (
  <div
    className="h-screen bg-white dark:bg-[#1a1f2e] flex flex-col overflow-hidden animate-pulse"
    style={{ height: '100dvh' }}
    aria-busy="true"
    aria-label="Loading messages"
  >
    {/* PageHeader */}
    <div className="bg-white dark:bg-[#1a1f2e] px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-slate-700/60" />
        <div className="space-y-2">
          <Bar className="h-5 w-28" />
          <Bar className="h-3 w-56" />
        </div>
      </div>
    </div>
 
    <div className="flex-1 min-h-0 w-full border-t border-gray-200 dark:border-[#1e293b]">
      <div className="flex h-full">
        {/* Conversation list */}
        <div className="w-full lg:w-80 xl:w-96 border-r border-gray-200 dark:border-[#1e293b] flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-[#1e293b]">
            <Bar className="h-5 w-32" />
          </div>
          <div className="flex-1 overflow-hidden">
            {ROWS.map(([nameW, previewW], i) => (
              <ConversationRowSkeleton key={i} nameW={nameW} previewW={previewW} />
            ))}
          </div>
        </div>
 
        {/* Right pane (desktop only) */}
        <div className="flex-1 hidden lg:flex items-center justify-center bg-gray-50 dark:bg-[#0f1117]">
          <div className="flex flex-col items-center gap-3 px-6">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-slate-700/60" />
            <Bar className="h-4 w-40" />
            <Bar className="h-3 w-56" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export function ContentPageSkeleton() {
  return (
    <div className={baseShell}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="text-center space-y-4">
          <div className={`h-4 w-32 ${block} mx-auto`} />
          <div className={`h-10 w-2/3 ${block} mx-auto`} />
          <div className={`h-4 w-1/2 ${block} mx-auto`} />
        </div>
        <div className="space-y-3">
          {[95, 88, 92, 78, 85, 70].map((w, i) => (
            <div key={i} className={`h-4 ${block}`} style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`h-32 ${block} rounded-xl`} />
          ))}
        </div>
      </div>
    </div>
  );
}
