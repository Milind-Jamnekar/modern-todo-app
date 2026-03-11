'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TodoStatus } from '@repo/types';

interface TodoFiltersProps {
  statusFilter?: TodoStatus;
  onStatusChange: (status: TodoStatus | undefined) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: TodoStatus.PENDING },
  { label: 'In Progress', value: TodoStatus.IN_PROGRESS },
  { label: 'Completed', value: TodoStatus.COMPLETED },
];

export function TodoFilters({
  statusFilter,
  onStatusChange,
  search,
  onSearchChange,
}: TodoFiltersProps) {
  const currentTab = statusFilter ?? 'all';

  const handleTabChange = (value: string) => {
    onStatusChange(value === 'all' ? undefined : (value as TodoStatus));
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="relative max-w-xs flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9 pr-8"
          placeholder="Search todos…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
            onClick={() => onSearchChange('')}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Status tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="h-9">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-3">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
