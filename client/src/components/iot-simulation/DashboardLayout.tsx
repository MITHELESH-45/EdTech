import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, className }) => {
  return (
    <div className={cn("flex flex-col h-full min-h-0 bg-background text-foreground transition-colors duration-300", className)}>
      {children}
    </div>
  );
};
