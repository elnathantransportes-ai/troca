import React from 'react';

export const FeedItemSkeleton: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-[#020617] overflow-hidden border-b border-white/5 snap-start">
      {/* Video Placeholder */}
      <div className="absolute inset-0 bg-slate-900 animate-pulse">
         <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 opacity-50"></div>
      </div>

      {/* Info Layer Placeholder */}
      <div className="absolute bottom-28 left-4 right-20 z-20 flex flex-col gap-3">
         <div className="w-16 h-6 bg-slate-700/50 rounded-md animate-pulse"></div>
         <div className="space-y-2">
            <div className="w-3/4 h-8 bg-slate-700/50 rounded-lg animate-pulse"></div>
            <div className="w-1/2 h-4 bg-slate-700/30 rounded animate-pulse"></div>
         </div>
         <div className="w-24 h-10 bg-slate-700/30 rounded-xl animate-pulse"></div>
      </div>

      {/* Right Action Bar Placeholder */}
      <div className="absolute bottom-28 right-2 z-30 flex flex-col gap-5 items-center w-14 pb-2">
         <div className="w-12 h-12 rounded-full bg-slate-700/50 animate-pulse"></div>
         <div className="w-12 h-12 rounded-full bg-slate-700/30 animate-pulse"></div>
         <div className="w-12 h-12 rounded-full bg-slate-700/30 animate-pulse"></div>
      </div>
    </div>
  );
};
