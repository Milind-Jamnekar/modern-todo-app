'use client';

import { ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useTodos } from '@/hooks/useTodos';
import { TodoItem } from './TodoItem';
import type { TodoStatus } from '@repo/types';

interface TodoListProps {
  statusFilter?: TodoStatus;
  search: string;
  page: number;
  onPageChange: (page: number) => void;
}

const LIMIT = 10;

function TodoSkeleton() {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="mt-0.5 h-5 w-5 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-14 rounded-md" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TodoList({ statusFilter, search, page, onPageChange }: TodoListProps) {
  const { data, isLoading, isError } = useTodos({
    page,
    limit: LIMIT,
    status: statusFilter,
    search: search || undefined,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <TodoSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="py-12 text-center text-sm text-destructive">
          Failed to load todos. Please refresh.
        </CardContent>
      </Card>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <Card className="border-border/50 border-dashed">
        <CardContent className="flex flex-col items-center py-16 text-center animate-fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">No todos found</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            {search || statusFilter
              ? 'Try adjusting your search or filters'
              : 'Create your first todo using the button above'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalPages = Math.ceil(data.total / LIMIT);

  return (
    <div className="space-y-2 animate-fade-in">
      {data.data.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, data.total)} of {data.total}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium text-muted-foreground px-1">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
