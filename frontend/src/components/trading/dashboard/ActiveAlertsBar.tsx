import React from 'react';
import { ShieldAlert, Trash2 } from 'lucide-react';

export interface AlertItem {
  id: number;
  ticker: string;
  targetPrice: number;
  [key: string]: any;
}

interface ActiveAlertsBarProps {
  alerts: AlertItem[];
  onDeleteAlert: (id: number) => void;
}

export const ActiveAlertsBar: React.FC<ActiveAlertsBarProps> = ({ alerts, onDeleteAlert }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-0.5 shrink-0 select-none">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
        <ShieldAlert className="w-3 h-3 text-emerald-400" />
        <span>알림:</span>
      </span>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 text-xs shrink-0 transition-colors"
        >
          <span className="font-bold text-slate-200 uppercase">{alert.ticker}</span>
          <span className="font-mono tabular-nums text-emerald-300 font-bold">
            ₩{alert.targetPrice.toLocaleString()}
          </span>
          <button
            onClick={() => onDeleteAlert(alert.id)}
            className="text-slate-500 hover:text-rose-400 transition-colors p-0.5"
            title="삭제"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ActiveAlertsBar;
