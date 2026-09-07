import type { LucideIcon } from 'lucide-react';
import { Inbox, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  height?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon = RefreshCw,
  height,
  className = '',
}) => {
  return (
    <div
      className={`w-full flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-3.5 bg-white/[0.015] border border-white/5 rounded-2xl ${className}`}
      style={height ? { minHeight: height } : undefined}
    >
      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-slate-400 shadow-inner">
        <Icon className="w-7 h-7 stroke-[1.75]" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-bold text-slate-200 tracking-tight">{title}</h4>
        {description && (
          <p className="text-xs text-slate-400 font-mono leading-relaxed">{description}</p>
        )}
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-1 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-all active:scale-95 shadow-sm"
        >
          <ActionIcon className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
