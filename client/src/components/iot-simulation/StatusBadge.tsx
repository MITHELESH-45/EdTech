import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'normal' | 'warning' | 'critical';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const styles = {
    normal: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <div className={cn(
      "px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide border",
      styles[status],
      className
    )}>
      {status}
    </div>
  );
};
