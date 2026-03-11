'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TodoList } from '@/components/TodoList';
import { TodoForm } from '@/components/TodoForm';
import { StatsBar } from '@/components/StatsBar';
import { TodoFilters } from '@/components/TodoFilters';
import type { TodoStatus } from '@repo/types';

export default function TodosPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TodoStatus | undefined>();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Todos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and track your tasks
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} size="sm">
          <Plus />
          New Todo
        </Button>
      </div>

      {/* Stats */}
      <StatsBar />

      <Separator />

      {/* Filters */}
      <TodoFilters
        statusFilter={statusFilter}
        onStatusChange={(s) => { setStatusFilter(s); setPage(1); }}
        search={search}
        onSearchChange={(s) => { setSearch(s); setPage(1); }}
      />

      {/* List */}
      <TodoList
        statusFilter={statusFilter}
        search={search}
        page={page}
        onPageChange={setPage}
      />

      {/* Modal */}
      {isFormOpen && <TodoForm onClose={() => setIsFormOpen(false)} />}
    </div>
  );
}
