import React from 'react';

const baseShell = 'min-h-screen bg-white dark:bg-[#0f1117] animate-pulse';
const block = 'bg-gray-200 dark:bg-[#252b3b] rounded';

export function HomeSkeleton() {
  return (
    <div className={baseShell} aria-busy="true" aria-label="Loading home page">
      <section className="px-4 pb-12 pt-14 text-center sm:pt-20">
        <div className={`mx-auto mb-6 h-9 w-52 rounded-full ${block}`} />
        <div className={`mx-auto mb-3 h-12 w-4/5 max-w-3xl rounded-lg ${block}`} />
        <div className={`mx-auto mb-6 h-12 w-3/5 max-w-xl rounded-lg ${block}`} />
        <div className={`mx-auto mb-2 h-4 w-full max-w-2xl ${block}`} />
        <div className={`mx-auto mb-8 h-4 w-3/4 max-w-xl ${block}`} />
        <div className={`mx-auto mb-4 h-12 w-full max-w-2xl rounded-xl ${block}`} />
        <div className={`mx-auto mb-10 h-10 w-40 rounded-full ${block}`} />
        <div className="mx-auto flex max-w-4xl justify-center gap-5 overflow-hidden sm:gap-10">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="flex shrink-0 flex-col items-center gap-2"><div className={`h-14 w-14 rounded-xl sm:h-16 sm:w-16 ${block}`} /><div className={`h-3 w-16 ${block}`} /></div>)}
        </div>
      </section>
      <section className="bg-gray-50 px-4 py-12 dark:bg-[#1a1f2e] sm:py-16">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="mx-auto space-y-3 text-center"><div className={`mx-auto h-8 w-64 ${block}`} /><div className={`mx-auto h-4 w-3/4 max-w-xl ${block}`} /></div>
          <div className="grid gap-5 md:grid-cols-2">{Array.from({ length: 2 }, (_, i) => <div key={i} className={`h-64 rounded-2xl ${block}`} />)}</div>
        </div>
      </section>
      <section className="px-4 py-12 sm:py-16"><div className="mx-auto max-w-6xl"><div className={`mx-auto mb-8 h-8 w-56 ${block}`} /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className={`h-40 rounded-2xl ${block}`} />)}</div></div></section>
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
  return <div className={baseShell} aria-busy="true" aria-label="Loading service discovery">
    <div className="relative flex min-h-[460px] flex-col gap-1.5 overflow-hidden">
      {[0,1,2].map(row => <div key={row} className="flex-1 overflow-hidden"><div className="flex h-full w-max gap-1.5">{Array.from({length:8},(_,i)=><div key={i} className={`h-full w-44 shrink-0 ${((row+i)%2===0?'bg-gray-300':'bg-gray-200')} dark:bg-[#252b3b] md:w-56`}/>)}</div></div>)}
      <div className="absolute inset-0 bg-blue-950/50"/><div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-5"><div className="h-10 w-64 rounded-lg bg-white/30"/><div className="h-5 w-96 max-w-full rounded bg-white/20"/><div className="h-12 w-full max-w-2xl rounded-xl bg-white/30"/></div>
    </div>
    <div className="mx-auto max-w-6xl px-5 pt-5"><div className={`h-4 w-32 ${block}`}/></div>
    <div className="mx-auto max-w-6xl px-5 py-12"><div className="mb-7 flex justify-between"><div className={`h-8 w-60 ${block}`}/><div className={`h-4 w-20 ${block}`}/></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">{Array.from({length:7},(_,i)=><div key={i} className="flex h-36 flex-col items-center justify-center gap-3 rounded-2xl border bg-white p-4 dark:bg-[#1a1f2e]"><div className={`h-12 w-12 rounded-xl ${block}`}/><div className={`h-4 w-20 ${block}`}/></div>)}</div></div>
    {[0,1].map(row=><div key={row} className="bg-white px-5 py-8 dark:bg-[#1a1f2e]"><div className="mx-auto max-w-6xl"><div className={`mb-5 h-5 w-40 ${block}`}/><div className="flex gap-4 overflow-hidden">{Array.from({length:5},(_,i)=><div key={i} className="w-64 shrink-0"><div className={`h-44 rounded-xl ${block}`}/><div className={`mt-3 h-4 w-40 ${block}`}/></div>)}</div></div></div>)}
    <div className="bg-white px-5 pb-16 pt-10 dark:bg-[#1a1f2e]"><div className="mx-auto max-w-6xl"><div className="mb-8 flex flex-wrap gap-3">{Array.from({length:4},(_,i)=><div key={i} className={`h-10 w-32 rounded-full ${block}`}/>)}</div><div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{Array.from({length:6},(_,i)=><div key={i} className={`h-44 rounded-xl ${block}`}/>)}</div></div></div>
  </div>;
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

// Append to RouteSkeletons.jsx (uses the file's existing `block` token).
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

const ConversationRowSkeleton = ({ nameW, snippetW }) => (
  <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-[#1e293b]/50">
    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-700/60 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <Bar className={`h-4 ${nameW}`} />
        <Bar className="h-3 w-6 flex-shrink-0" />
      </div>
      <Bar className={`h-3.5 mt-2 ${snippetW}`} />
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
    className="h-full min-h-0 bg-white dark:bg-[#1a1f2e] flex flex-col overflow-hidden animate-pulse"
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
            {ROWS.map(([nameW, snippetW], i) => (
              <ConversationRowSkeleton key={i} nameW={nameW} snippetW={snippetW} />
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

// Auth page matches the current split-screen sign-in/sign-up composition.
export function AuthPageSkeleton() {
  return <div className={`${baseShell} flex min-h-screen animate-pulse flex-col lg:flex-row`} aria-busy="true" aria-label="Loading account form"><div className="hidden min-h-[280px] bg-gradient-to-br from-blue-700 to-teal-700 p-10 lg:flex lg:w-1/2 lg:flex-col lg:justify-between"><div className="h-8 w-24 rounded bg-white/30"/><div className="space-y-4"><div className="h-5 w-40 rounded bg-white/30"/><div className="h-12 w-3/4 rounded bg-white/30"/><div className="h-4 w-2/3 rounded bg-white/20"/></div></div><div className="flex flex-1 items-center justify-center p-5 sm:p-10"><div className="w-full max-w-xl space-y-6"><div className="space-y-3"><div className={`h-4 w-28 ${block}`}/><div className={`h-9 w-3/4 ${block}`}/><div className={`h-4 w-2/3 ${block}`}/></div>{Array.from({length:4},(_,i)=><div key={i} className="space-y-2"><div className={`h-4 w-24 ${block}`}/><div className={`h-11 w-full rounded-xl ${block}`}/></div>)}<div className={`h-12 w-full rounded-xl ${block}`}/><div className={`mx-auto h-4 w-48 ${block}`}/></div></div></div>;
}

export function AllCategoriesPageSkeleton() {
  return <div className={`${baseShell} animate-pulse`} aria-busy="true" aria-label="Loading service categories"><div className="relative flex min-h-48 flex-col items-center justify-center gap-4 bg-gray-300 px-5 py-12"><div className={`h-9 w-44 ${block}`}/><div className={`h-4 w-64 max-w-full ${block}`}/><div className={`h-12 w-full max-w-xl rounded-xl ${block}`}/></div><div className="mx-auto max-w-6xl px-5 pt-5"><div className={`h-4 w-40 ${block}`}/></div><div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-5 py-8 sm:grid-cols-2 lg:grid-cols-3">{Array.from({length:4},(_,i)=><div key={i} className="overflow-hidden rounded-2xl border bg-white dark:bg-[#1a1f2e]"><div className={`h-44 ${block}`}/><div className="space-y-3 p-5"><div className={`h-5 w-40 ${block}`}/><div className={`h-4 w-full ${block}`}/><div className={`h-3 w-24 ${block}`}/></div></div>)}</div></div>;
}

export function CategoryPageSkeleton() {
  return <div className={`${baseShell} animate-pulse`} aria-busy="true" aria-label="Loading service category"><div className={`relative h-56 bg-gray-300 md:h-72`}><div className="absolute inset-0 flex flex-col items-center justify-center gap-3"><div className={`h-12 w-12 rounded-xl ${block}`}/><div className={`h-8 w-56 ${block}`}/><div className={`h-4 w-72 max-w-[85%] ${block}`}/></div></div><div className="mx-auto max-w-6xl px-5 pt-5"><div className={`h-4 w-64 ${block}`}/></div><div className="mx-auto max-w-6xl px-5 py-8"><div className={`mb-6 h-7 w-56 ${block}`}/><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({length:4},(_,i)=><div key={i} className="overflow-hidden rounded-2xl border bg-white dark:bg-[#1a1f2e]"><div className={`h-44 ${block}`}/><div className="flex items-center justify-between p-4"><div className="space-y-2"><div className={`h-4 w-32 ${block}`}/><div className={`h-3 w-24 ${block}`}/></div><div className={`h-5 w-5 ${block}`}/></div></div>)}</div></div><div className="mx-auto max-w-6xl px-5 pb-12"><div className={`mb-4 h-6 w-44 ${block}`}/><div className="flex flex-wrap gap-3">{Array.from({length:4},(_,i)=><div key={i} className={`h-9 w-40 rounded-full ${block}`}/>)}</div></div></div>;
}

export function ServiceDetailPageSkeleton() {
  return <div className={`${baseShell} animate-pulse`} aria-busy="true" aria-label="Loading service details"><div className={`h-52 bg-gray-300 md:h-64 ${block}`}/><div className="mx-auto max-w-6xl px-5 pt-5"><div className={`h-4 w-72 max-w-full ${block}`}/></div><div className="mx-auto max-w-6xl space-y-6 px-5 py-6"><div className="flex flex-col justify-between gap-5 rounded-2xl border bg-white p-6 dark:bg-[#1a1f2e] sm:flex-row sm:items-center"><div className="space-y-3"><div className={`h-4 w-28 ${block}`}/><div className={`h-6 w-64 max-w-full ${block}`}/><div className={`h-4 w-96 max-w-full ${block}`}/></div><div className={`h-12 w-48 rounded-xl ${block}`}/></div><div className="rounded-2xl bg-white p-8 dark:bg-[#1a1f2e]"><div className={`mx-auto h-7 w-72 max-w-full ${block}`}/><div className={`mx-auto mt-4 h-20 max-w-2xl ${block}`}/></div></div></div>;
}

export function WorkspaceOverviewSkeleton() {
  return <div className={`${baseShell} animate-pulse`} aria-busy="true" aria-label="Loading workspace overview"><div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6"><div className="flex items-center justify-between"><div className="space-y-2"><div className={`h-6 w-36 ${block}`}/><div className={`h-4 w-56 ${block}`}/></div><div className={`h-10 w-10 rounded-full ${block}`}/></div><div className="flex flex-col justify-between gap-4 rounded-3xl bg-blue-700 p-6 sm:flex-row sm:items-center sm:p-8"><div className="space-y-3"><div className="h-4 w-36 rounded bg-white/30"/><div className="h-9 w-72 max-w-full rounded bg-white/30"/><div className="h-4 w-96 max-w-full rounded bg-white/20"/></div><div className="h-12 w-40 rounded-xl bg-white/80"/></div><div className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl border bg-white p-5 dark:bg-[#1a1f2e]"><div className={`mb-4 h-5 w-40 ${block}`}/>{Array.from({length:3},(_,i)=><div key={i} className="mb-3 rounded-xl border p-4"><div className={`h-4 w-2/3 ${block}`}/><div className={`mt-3 h-3 w-4/5 ${block}`}/></div>)}</div><div className="rounded-2xl border bg-white p-5 dark:bg-[#1a1f2e]"><div className={`mb-4 h-5 w-36 ${block}`}/>{Array.from({length:3},(_,i)=><div key={i} className={`mb-3 h-16 rounded-xl ${block}`}/>)}</div></div></div></div>;
}

export function AdminWorkbenchSkeleton() {
  return <div className={`${baseShell} animate-pulse`} aria-busy="true" aria-label="Loading Admin workbench"><div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6"><div className="rounded-2xl bg-white p-5 dark:bg-[#1a1f2e]"><div className={`h-4 w-32 ${block}`}/><div className={`mt-3 h-9 w-64 ${block}`}/><div className={`mt-3 h-4 w-2/3 ${block}`}/><div className="mt-5 flex flex-wrap gap-2">{Array.from({length:7},(_,i)=><div key={i} className={`h-9 w-20 rounded-full ${block}`}/>)}</div></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({length:4},(_,i)=><div key={i} className="rounded-2xl bg-white p-5 dark:bg-[#1a1f2e]"><div className={`h-4 w-24 ${block}`}/><div className={`mt-5 h-8 w-16 ${block}`}/></div>)}</div><div className="rounded-2xl bg-white p-5 dark:bg-[#1a1f2e]"><div className={`mb-4 h-6 w-52 ${block}`}/><div className="grid gap-3 sm:grid-cols-3">{Array.from({length:3},(_,i)=><div key={i} className={`h-32 rounded-xl ${block}`}/>)}</div></div></div></div>;
}

export function AdminRecordsSkeleton() {
  return <div className={`${baseShell} animate-pulse`} aria-busy="true" aria-label="Loading financial records"><div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6"><div className={`h-4 w-48 ${block}`}/><div className="flex flex-wrap items-end justify-between gap-3"><div className="space-y-3"><div className={`h-4 w-24 ${block}`}/><div className={`h-9 w-72 ${block}`}/><div className={`h-4 w-96 max-w-full ${block}`}/></div><div className={`h-7 w-24 rounded-full ${block}`}/></div><div className="flex gap-5 border-b pb-3">{Array.from({length:3},(_,i)=><div key={i} className={`h-5 w-28 ${block}`}/>)}</div><div className="grid gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2 xl:grid-cols-5 dark:bg-[#1a1f2e]">{Array.from({length:5},(_,i)=><div key={i} className={`h-11 rounded-lg ${block}`}/>)}</div><div className="flex justify-between"><div className={`h-4 w-36 ${block}`}/><div className={`h-8 w-40 ${block}`}/></div>{Array.from({length:4},(_,i)=><div key={i} className="rounded-xl border bg-white p-4 dark:bg-[#1a1f2e]"><div className={`h-4 w-48 ${block}`}/><div className={`mt-3 h-4 w-full ${block}`}/></div>)}</div></div>;
}

export function FinancePageSkeleton() {
  return <div className={`${baseShell} animate-pulse`} aria-busy="true" aria-label="Loading financial dashboard"><div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6"><div className={`h-4 w-24 ${block}`}/><div className={`h-9 w-64 ${block}`}/><div className={`h-4 w-96 max-w-full ${block}`}/><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({length:4},(_,i)=><div key={i} className="rounded-2xl bg-white p-5 dark:bg-[#1a1f2e]"><div className={`h-4 w-28 ${block}`}/><div className={`mt-5 h-8 w-32 ${block}`}/></div>)}</div><div className="grid gap-5 lg:grid-cols-2"><div className="rounded-2xl bg-white p-5 dark:bg-[#1a1f2e]"><div className={`mb-4 h-5 w-36 ${block}`}/><div className={`h-52 ${block}`}/></div><div className="space-y-3 rounded-2xl bg-white p-5 dark:bg-[#1a1f2e]"><div className={`mb-4 h-5 w-40 ${block}`}/>{Array.from({length:4},(_,i)=><div key={i} className={`h-14 rounded-xl ${block}`}/>)}</div></div></div></div>;
}

export function RequestQueueSkeleton() {
  return <div className={`${baseShell} animate-pulse`} aria-busy="true" aria-label="Loading requests"><div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6"><div className="rounded-3xl bg-white p-6 dark:bg-[#1a1f2e]"><div className={`h-4 w-32 ${block}`}/><div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="space-y-3"><div className={`h-9 w-56 ${block}`}/><div className={`h-4 w-96 max-w-full ${block}`}/></div><div className={`h-11 w-40 rounded-xl ${block}`}/></div></div><div className="rounded-2xl bg-white p-5 dark:bg-[#1a1f2e]"><div className="flex flex-wrap justify-between gap-4"><div className="flex gap-2">{Array.from({length:4},(_,i)=><div key={i} className={`h-9 w-20 rounded-full ${block}`}/>)}</div><div className={`h-11 w-64 rounded-xl ${block}`}/></div></div>{Array.from({length:3},(_,i)=><div key={i} className="rounded-2xl border bg-white p-5 dark:bg-[#1a1f2e]"><div className="flex justify-between gap-4"><div className="space-y-3"><div className={`h-5 w-56 ${block}`}/><div className={`h-4 w-72 max-w-full ${block}`}/><div className={`h-3 w-48 ${block}`}/></div><div className={`h-10 w-28 rounded-lg ${block}`}/></div></div>)}</div></div>;
}

export function CaseDetailSkeleton() {
  return <div className={`${baseShell} animate-pulse`} aria-busy="true" aria-label="Loading request details"><div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6"><div className={`h-4 w-24 ${block}`}/><div className="rounded-2xl bg-white p-6 dark:bg-[#1a1f2e]"><div className="flex justify-between gap-4"><div className="space-y-3"><div className={`h-4 w-32 ${block}`}/><div className={`h-8 w-80 max-w-full ${block}`}/><div className={`h-4 w-56 ${block}`}/></div><div className={`h-8 w-28 rounded-full ${block}`}/></div></div><div className="grid gap-5 lg:grid-cols-[1fr_20rem]"><div className="space-y-5">{Array.from({length:3},(_,i)=><div key={i} className="rounded-2xl bg-white p-5 dark:bg-[#1a1f2e]"><div className={`mb-4 h-5 w-40 ${block}`}/><div className={`h-20 ${block}`}/></div>)}</div><div className="space-y-4"><div className={`h-40 rounded-2xl ${block}`}/><div className={`h-52 rounded-2xl ${block}`}/></div></div></div></div>;
}

export function RequestFormSkeleton() {
  return <div className={`${baseShell} animate-pulse`} aria-busy="true" aria-label="Loading service request form"><div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6"><div className={`h-4 w-32 ${block}`}/><div className="grid gap-6 lg:grid-cols-[1fr_18rem]"><div className="space-y-5 rounded-2xl bg-white p-5 sm:p-7 dark:bg-[#1a1f2e]"><div className={`h-9 w-72 max-w-full ${block}`}/><div className={`h-4 w-full ${block}`}/><div className="space-y-4">{Array.from({length:5},(_,i)=><div key={i}><div className={`mb-2 h-4 w-32 ${block}`}/><div className={`h-11 w-full rounded-lg ${block}`}/></div>)}</div><div className={`h-12 w-full rounded-xl ${block}`}/></div><div className="h-56 rounded-2xl bg-white p-5 dark:bg-[#1a1f2e]"><div className={`h-5 w-40 ${block}`}/><div className={`mt-4 h-4 w-full ${block}`}/></div></div></div></div>;
}

export function AccountProfilePageSkeleton() {
  return <div className={`${baseShell} animate-pulse`} aria-busy="true" aria-label="Loading account profile"><div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6"><div className={`h-4 w-36 ${block}`}/><div className="rounded-3xl bg-white p-6 dark:bg-[#1a1f2e]"><div className="flex items-center gap-4"><div className={`h-16 w-16 rounded-full ${block}`}/><div className="space-y-3"><div className={`h-4 w-28 ${block}`}/><div className={`h-8 w-56 ${block}`}/></div></div><div className={`mt-4 h-4 w-44 ${block}`}/><div className={`mt-5 h-10 w-32 rounded-xl ${block}`}/></div><div className="rounded-2xl bg-white p-6 dark:bg-[#1a1f2e]"><div className={`h-5 w-40 ${block}`}/><div className="mt-4 grid grid-cols-2 gap-4">{Array.from({length:6},(_,i)=><div key={i} className={`h-12 rounded ${block}`}/>)}</div></div><div className="rounded-2xl bg-white p-6 dark:bg-[#1a1f2e]"><div className={`h-5 w-36 ${block}`}/><div className="mt-4 grid grid-cols-2 gap-4">{Array.from({length:2},(_,i)=><div key={i} className={`h-40 rounded-xl ${block}`}/>)}</div></div></div></div>;
}

export function ProfileEditorPageSkeleton() {
  return <div className={`${baseShell} animate-pulse`} aria-busy="true" aria-label="Loading profile setup"><div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6"><div className={`h-4 w-40 ${block}`}/><div className="space-y-2"><div className={`h-8 w-72 ${block}`}/><div className={`h-4 w-96 max-w-full ${block}`}/></div><div className="rounded-2xl bg-white p-5 sm:p-7 dark:bg-[#1a1f2e]"><div className={`mb-5 h-5 w-40 ${block}`}/><div className="grid gap-4 sm:grid-cols-2">{Array.from({length:6},(_,i)=><div key={i}><div className={`mb-2 h-4 w-28 ${block}`}/><div className={`h-11 rounded-lg ${block}`}/></div>)}</div></div><div className="rounded-2xl bg-white p-5 sm:p-7 dark:bg-[#1a1f2e]"><div className={`mb-4 h-5 w-60 ${block}`}/>{Array.from({length:3},(_,i)=><div key={i} className={`mb-3 h-24 rounded-xl ${block}`}/>)}</div><div className="rounded-2xl bg-white p-5 sm:p-7 dark:bg-[#1a1f2e]"><div className={`mb-4 h-5 w-40 ${block}`}/><div className={`h-44 rounded-xl ${block}`}/></div><div className={`h-12 w-full rounded-xl ${block}`}/></div></div>;
}

export function AccountSettingsPageSkeleton() {
  return <div className={`${baseShell} animate-pulse`} aria-busy="true" aria-label="Loading account settings"><div className="mx-auto max-w-4xl px-4 py-6 sm:px-6"><div className={`mb-5 h-4 w-32 ${block}`}/><div className="rounded-3xl bg-white p-6 dark:bg-[#1a1f2e]"><div className={`h-9 w-64 ${block}`}/></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{Array.from({length:4},(_,i)=><div key={i} className="flex gap-4 rounded-2xl border bg-white p-5 dark:bg-[#1a1f2e]"><div className={`h-14 w-14 shrink-0 rounded-xl ${block}`}/><div className="flex-1 space-y-3"><div className={`h-5 w-36 ${block}`}/><div className={`h-4 w-full ${block}`}/><div className={`h-4 w-4/5 ${block}`}/></div></div>)}</div></div></div>;
}

export function NotificationSettingsPageSkeleton() {
  return <div className={`${baseShell} animate-pulse`} aria-busy="true" aria-label="Loading notification preferences"><div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6"><div className={`h-4 w-24 ${block}`}/><div className="rounded-2xl bg-white p-6 dark:bg-[#1a1f2e]"><div className={`h-8 w-64 ${block}`}/><div className={`mt-3 h-4 w-96 max-w-full ${block}`}/></div><div className="rounded-2xl bg-white p-5 dark:bg-[#1a1f2e]"><div className={`mb-5 h-5 w-48 ${block}`}/>{Array.from({length:4},(_,i)=><div key={i} className="flex items-center justify-between border-b py-4 last:border-0"><div className="space-y-2"><div className={`h-4 w-44 ${block}`}/><div className={`h-3 w-64 ${block}`}/></div><div className={`h-6 w-11 rounded-full ${block}`}/></div>)}</div><div className={`h-40 rounded-2xl ${block}`}/></div></div>;
}

export function TransactionsPageSkeleton() {
  return <div className={`${baseShell} animate-pulse`} aria-busy="true" aria-label="Loading transactions"><div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6"><div className={`h-4 w-24 ${block}`}/><div className={`h-9 w-72 ${block}`}/><div className={`h-4 w-96 max-w-full ${block}`}/><div className="rounded-2xl bg-white p-5 dark:bg-[#1a1f2e]"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({length:4},(_,i)=><div key={i} className={`h-11 rounded-lg ${block}`}/>)}</div><div className="mt-4 flex justify-between"><div className={`h-4 w-32 ${block}`}/><div className={`h-8 w-36 ${block}`}/></div></div><div className="overflow-hidden rounded-2xl bg-white dark:bg-[#1a1f2e]"><div className={`h-11 ${block}`}/>{Array.from({length:6},(_,i)=><div key={i} className="grid grid-cols-4 gap-4 border-b p-4 lg:grid-cols-6">{Array.from({length:6},(_,j)=><div key={j} className={`h-4 ${block}`}/>)}</div>)}</div></div></div>;
}
