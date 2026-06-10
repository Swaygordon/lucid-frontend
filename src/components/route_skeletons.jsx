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

export function MessagesListSkeleton() {
  return (
    <div className={`${baseShell} bg-gray-50`}>
      <div className="bg-white dark:bg-[#1a1f2e] border-b dark:border-[#1e293b] px-6 py-5 flex items-center gap-4">
        <div className={`w-8 h-8 rounded-lg ${block}`} />
        <div className={`h-6 w-32 ${block} rounded-lg`} />
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 space-y-2">
        <div className={`h-11 w-full ${block} rounded-lg mb-4`} />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#1a1f2e] rounded-xl border dark:border-[#1e293b] p-4 flex gap-3 items-center">
            <div className={`w-12 h-12 rounded-full ${block} flex-shrink-0`} />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <div className={`h-4 w-32 ${block}`} />
                <div className={`h-3 w-12 ${block}`} />
              </div>
              <div className={`h-3 w-2/3 ${block}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className={`${baseShell} bg-gray-50 flex flex-col`}>
      <div className="bg-white dark:bg-[#1a1f2e] border-b dark:border-[#1e293b] px-4 py-3 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${block}`} />
        <div className={`w-10 h-10 rounded-full ${block}`} />
        <div className="flex-1 space-y-2">
          <div className={`h-4 w-32 ${block}`} />
          <div className={`h-3 w-16 ${block}`} />
        </div>
      </div>
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 space-y-4">
        {[
          { side: 'left',  w: 'w-56' },
          { side: 'right', w: 'w-40' },
          { side: 'left',  w: 'w-64' },
          { side: 'right', w: 'w-32' },
          { side: 'left',  w: 'w-48' },
        ].map((m, i) => (
          <div key={i} className={`flex ${m.side === 'right' ? 'justify-end' : 'justify-start'}`}>
            <div className={`h-12 ${m.w} ${block} rounded-2xl`} />
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-[#1a1f2e] border-t dark:border-[#1e293b] px-4 py-3 flex gap-2">
        <div className={`flex-1 h-11 ${block} rounded-full`} />
        <div className={`w-11 h-11 ${block} rounded-full`} />
      </div>
    </div>
  );
}

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
