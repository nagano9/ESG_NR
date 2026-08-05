import React from 'react';
import { cn } from '../../lib/utils.ts';
import { History, ArrowRight } from 'lucide-react';

interface AuditEntry {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  oldValue: string;
  newValue: string;
}

interface AuditTrailProps {
  entries: AuditEntry[];
  className?: string;
}

export function AuditTrail({ entries, className }: AuditTrailProps) {
  return (
    <div className={cn("app-panel flex flex-col overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-slate-400" />
          <span className="app-section-title">Immutable Audit Trail</span>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">{entries.length} events</span>
      </div>
      <div className="divide-y divide-slate-100">
        {entries.length > 0 ? entries.map((entry) => (
          <div key={entry.id} className="p-4 transition-colors hover:bg-slate-50">
            <div className="mb-2 flex items-start justify-between gap-4">
              <span className="text-xs font-medium text-slate-500">
                {entry.timestamp}
              </span>
              <span className="truncate text-xs font-semibold text-emerald-700">
                {entry.user}
              </span>
            </div>
            <p className="mb-2 text-sm font-semibold text-slate-900">
              {entry.action}
            </p>
            <div className="audit-font flex items-center gap-3 rounded-md border border-slate-100 bg-slate-50 p-2">
              <span className="max-w-[180px] truncate text-slate-400 line-through">{entry.oldValue}</span>
              <ArrowRight className="h-3 w-3 text-slate-300" />
              <span className="font-semibold text-slate-800">{entry.newValue}</span>
            </div>
          </div>
        )) : (
          <div className="px-6 py-8 text-sm font-medium text-slate-500">No audit events yet.</div>
        )}
      </div>
    </div>
  );
}
