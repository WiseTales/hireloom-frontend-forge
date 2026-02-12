import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Candidate } from './types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail, FileText, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Props {
  candidate: Candidate;
  isOverlay?: boolean;
}

export const PipelineCard = ({ candidate, isOverlay }: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const initials = candidate.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group cursor-grab active:cursor-grabbing",
        isOverlay && "cursor-grabbing shadow-elevated"
      )}
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <Card className={cn(
          "border-slate-200/60 shadow-soft hover:shadow-medium transition-smooth bg-white",
          isOverlay && "border-primary/20 ring-1 ring-primary/10"
        )}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 border border-white shadow-soft">
                  <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">
                    {candidate.full_name}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium truncate max-w-[150px]">
                    {candidate.job_title}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] h-4 px-1 border-slate-200 text-slate-500">
                {format(new Date(candidate.applied_at), 'MMM d')}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
                <Mail className="h-3 w-3" />
                <span>Contact</span>
              </div>
              {candidate.resume_url && (
                <div className="flex items-center gap-1.5 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                  <FileText className="h-3 w-3" />
                  <span>Resume</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex -space-x-2">
                {/* Assigned to initials block or empty */}
                <div className="h-6 w-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">
                  {candidate.assigned_to ? candidate.assigned_to[0] : <UserPlus className="h-2.5 w-2.5" />}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Last activity: {format(new Date(), 'h:mm a')}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
