import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  errorCode?: string;
  details?: string | Record<string, any>;
  onRetry?: () => void;
  height?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = '데이터 조회 중 오류가 발생했습니다',
  message = '일시적인 서버 통신 지연이거나 응답 규격이 올바르지 않습니다.',
  errorCode,
  details,
  onRetry,
  height,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const formattedDetails = typeof details === 'object' ? JSON.stringify(details, null, 2) : details;

  return (
    <div
      className={`w-full flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 gap-3.5 bg-rose-950/10 border border-rose-500/20 rounded-2xl ${className}`}
      style={height ? { minHeight: height } : undefined}
    >
      <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
        <AlertTriangle className="w-7 h-7 stroke-[2]" />
      </div>

      <div className="space-y-1.5 max-w-md">
        <div className="flex items-center justify-center gap-2">
          <h4 className="text-sm font-black text-rose-200 tracking-tight">{title}</h4>
          {errorCode && (
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono text-[10px] font-bold">
              {errorCode}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-300 font-mono leading-relaxed">{message}</p>
      </div>

      <div className="flex items-center gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>다시 시도</span>
          </button>
        )}

        {formattedDetails && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-slate-300 transition-colors"
          >
            <span>상세 로그</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {showDetails && formattedDetails && (
        <div className="w-full max-w-lg mt-2 p-3 rounded-xl bg-black/50 border border-white/10 text-left overflow-x-auto text-[11px] font-mono text-rose-300/90 max-h-40 scrollbar-thin">
          <pre className="whitespace-pre-wrap">{formattedDetails}</pre>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
