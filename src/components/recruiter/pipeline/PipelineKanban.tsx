import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Phone, Calendar, MoreHorizontal, UserPlus, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { PipelineColumn } from './PipelineColumn';
import { PipelineCard } from './PipelineCard';
import { Stage, Candidate, STAGES } from './types';

export const PipelineKanban = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const { data: publicApps, error: publicError } = await supabase
        .from('public_applications')
        .select('*, jobs(title)');

      if (publicError) throw publicError;

      const { data: authApps, error: authError } = await supabase
        .from('job_applications')
        .select('*, jobs(title), profiles(full_name, email)');

      if (authError) throw authError;

      const unified: Candidate[] = [
        ...(publicApps || []).map(app => ({
          id: app.id,
          full_name: app.full_name,
          email: app.email,
          status: (app.status as Stage) || 'applied',
          job_title: (app.jobs as any)?.title || 'Unknown Job',
          applied_at: app.created_at || '',
          resume_url: app.resume_url
        })),
        ...(authApps || []).map(app => ({
          id: app.id,
          full_name: (app.profiles as any)?.full_name || app.applicant_name,
          email: (app.profiles as any)?.email || app.applicant_email,
          status: (app.status as Stage) || 'applied',
          job_title: (app.jobs as any)?.title || 'Unknown Job',
          applied_at: app.applied_at,
          resume_url: (app.profiles as any)?.resume_url
        }))
      ];

      setCandidates(unified);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const updateCandidateStatus = async (id: string, newStatus: Stage) => {
    try {
      // Try updating in both tables since we have a unified view
      // This is a bit brute-force, in a real app you'd know which table it's in
      const { error: publicError } = await supabase
        .from('public_applications')
        .update({ status: newStatus })
        .eq('id', id);

      const { error: authError } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', id);

      // If one of them succeeded, it's good
      if (publicError && authError) {
        throw new Error('Update failed in all tables');
      }

      setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      toast.success(`Moved to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to move candidate');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCandidate = candidates.find(c => c.id === activeId);
    if (!activeCandidate) return;

    // If over a column
    const overStage = STAGES.find(s => s.id === overId);
    if (overStage && activeCandidate.status !== overStage.id) {
      // Just visual feedback for now, the real update happens on DragEnd
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const candidateId = active.id as string;
    const overId = over.id as string;

    // Determine the new status
    let newStatus: Stage | null = null;

    // If over a column
    const overStage = STAGES.find(s => s.id === overId);
    if (overStage) {
      newStatus = overStage.id;
    } else {
      // If over another card
      const overCandidate = candidates.find(c => c.id === overId);
      if (overCandidate) {
        newStatus = overCandidate.status;
      }
    }

    if (newStatus) {
      const activeCandidate = candidates.find(c => c.id === candidateId);
      if (activeCandidate && activeCandidate.status !== newStatus) {
        updateCandidateStatus(candidateId, newStatus);
      }
    }
  };

  const activeCandidate = candidates.find(c => c.id === activeId);

  if (loading) {
    return <div className="flex justify-center p-12">Loading pipeline...</div>;
  }

  return (
    <div className="h-full overflow-x-auto pb-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 min-w-max p-4 h-[calc(100vh-250px)]">
          {STAGES.map((stage) => (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              candidates={candidates.filter(c => c.status === stage.id)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeCandidate ? (
            <PipelineCard candidate={activeCandidate} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
