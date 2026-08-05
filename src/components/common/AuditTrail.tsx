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
    <div className={cn("flex flex-col border border-[#141414] bg-white overflow-hidden shadow-[4px_4px_0px_0px_#141414]", className)}>
      <div className="col-header bg-[#D4D3D0]/30 border-b border-[#141414] flex items-center gap-2">
        <History className="w-3 h-3" />
        <span>Immutable Audit Trail</span>
      </div>
      <div className="divide-y divide-[#141414]/10">
        {entries.map((entry) => (
          <div key={entry.id} className="p-4 hover:bg-[#141414]/5 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                {entry.timestamp}
              </span>
              <span className="text-[10px] font-bold uppercase text-emerald-600">
                {entry.user}
              </span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-tight mb-2">
              {entry.action}
            </p>
            <div className="flex items-center gap-3 audit-font bg-[#F9F9F8] p-2 border border-[#141414]/5 italic">
              <span className="opacity-50 line-through truncate max-w-[120px]">{entry.oldValue}</span>
              <ArrowRight className="w-3 h-3 opacity-30" />
              <span className="font-bold">{entry.newValue}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
