import React from 'react';
import { Loader2, Radio } from 'lucide-react';

export type LoadingVariant = 'spinner' | 'skeleton-cards' | 'skeleton-table' | 'radar' | 'inline';

interface LoadingStateProps {
  variant?: LoadingVariant;
  title?: string;
  description?: string;
  height?: string;
  count?: number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  title,
  description,
  height,
  count = 3,
  className = '',
}) => {
  if (variant === 'skeleton-cards') {
    return (
      <div className={`w-full space-y-3 p-2 animate-pulse ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 bg-white/10 rounded-md" />
              <div className="h-4 w-16 bg-white/10 rounded-md" />
            </div>
            <div className="h-6 w-3/4 bg-white/5 rounded-md" />
            <div className="flex gap-2">
              <div className="h-3 w-16 bg-white/5 rounded" />
              <div className="h-3 w-20 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'skeleton-table') {
    return (
      <div className={`w-full space-y-2 p-3 animate-pulse ${className}`}>
        <div className="h-8 w-full bg-white/[0.04] rounded-xl mb-3" />
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-14 w-full bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between px-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-12 bg-white/10 rounded-lg" />
              <div className="space-y-1">
                <div className="h-3 w-24 bg-white/10 rounded" />
                <div className="h-2 w-16 bg-white/5 rounded" />
              </div>
            </div>
            <div className="h-5 w-20 bg-white/10 rounded" />
            <div className="h-7 w-20 bg-white/10 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'radar') {
    return (
      <div
        className={`w-full flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-4 ${className}`}
        style={height ? { minHeight: height } : undefined}
      >
        <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
          <Radio className="w-8 h-8 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-ping opacity-40" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-white tracking-tight">
            {title || '실시간 레이더 탐색 중...'}
          </p>
          {description && (
            <p className="text-xs text-slate-400 font-mono">{description}</p>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-xs text-slate-400 font-mono ${className}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
        <span>{title || '로딩 중...'}</span>
      </div>
    );
  }

  // 기본 spinner
  return (
    <div
      className={`w-full flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-3 ${className}`}
      style={height ? { minHeight: height } : undefined}
    >
      <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 shadow-lg">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold text-slate-200">
          {title || '데이터를 불러오는 중입니다...'}
        </p>
        {description && (
          <p className="text-[11px] text-slate-400 font-mono">{description}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingState;
