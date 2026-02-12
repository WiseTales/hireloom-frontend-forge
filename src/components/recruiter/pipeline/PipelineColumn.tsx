import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Stage, Candidate } from './types';
import { PipelineCard } from './PipelineCard';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  stage: { id: Stage; label: string; color: string };
  candidates: Candidate[];
}

export const PipelineColumn = ({ stage, candidates }: Props) => {
  const { setNodeRef } = useDroppable({
    id: stage.id,
  });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col w-80 bg-slate-50/50 rounded-xl border border-slate-200/60 p-3 h-full"
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm tracking-tight text-slate-900">{stage.label}</h3>
          <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] font-bold">
            {candidates.length}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-1 px-1">
        <SortableContext
          id={stage.id}
          items={candidates.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3 pb-4">
            {candidates.map((candidate) => (
              <PipelineCard key={candidate.id} candidate={candidate} />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
};
