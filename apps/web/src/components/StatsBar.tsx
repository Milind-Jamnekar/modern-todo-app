'use client';

import { CheckCircle2, Circle, Clock, LayoutList } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTodoStats } from '@/hooks/useTodos';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
  tileBg: string;
  borderColor: string;
}

function StatCard({ label, value, icon, iconClass, tileBg, borderColor }: StatCardProps) {
  return (
    <Card className={cn('border-border/50 transition-shadow hover:shadow-md border-l-2', borderColor)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
          </div>
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', tileBg)}>
            <span className={iconClass}>{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsBar() {
  const { data: stats, isLoading } = useTodoStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-7 w-10" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        label="Total"
        value={stats?.total ?? 0}
        icon={<LayoutList className="h-5 w-5" />}
        iconClass="text-slate-500 dark:text-slate-400"
        tileBg="bg-slate-100 dark:bg-slate-500/10"
        borderColor="border-l-slate-300 dark:border-l-slate-600"
      />
      <StatCard
        label="Pending"
        value={stats?.pending ?? 0}
        icon={<Circle className="h-5 w-5" />}
        iconClass="text-amber-600 dark:text-amber-400"
        tileBg="bg-amber-50 dark:bg-amber-500/10"
        borderColor="border-l-amber-400 dark:border-l-amber-500"
      />
      <StatCard
        label="In Progress"
        value={stats?.in_progress ?? 0}
        icon={<Clock className="h-5 w-5" />}
        iconClass="text-blue-600 dark:text-blue-400"
        tileBg="bg-blue-50 dark:bg-blue-500/10"
        borderColor="border-l-blue-400 dark:border-l-blue-500"
      />
      <StatCard
        label="Completed"
        value={stats?.completed ?? 0}
        icon={<CheckCircle2 className="h-5 w-5" />}
        iconClass="text-emerald-600 dark:text-emerald-400"
        tileBg="bg-emerald-50 dark:bg-emerald-500/10"
        borderColor="border-l-emerald-400 dark:border-l-emerald-500"
      />
    </div>
  );
}
