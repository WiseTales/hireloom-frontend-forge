import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, Mail, Phone, MapPin, Linkedin, Github, Globe, FileText, Sparkles } from 'lucide-react';

interface CandidatePipelineProps {
  jobs: any[];
  applications: any[];
  onRefresh: () => void;
}

const STAGES = [
  { key: 'new', label: 'Applied', color: 'bg-slate-100 border-slate-300' },
  { key: 'shortlisted', label: 'Shortlisted', color: 'bg-blue-100 border-blue-300' },
  { key: 'interview', label: 'Interview', color: 'bg-purple-100 border-purple-300' },
  { key: 'hired', label: 'Hired', color: 'bg-green-100 border-green-300' },
  { key: 'rejected', label: 'Rejected', color: 'bg-red-100 border-red-300' },
];

export default function CandidatePipeline({ jobs, applications, onRefresh }: CandidatePipelineProps) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  const grouped = STAGES.map(stage => ({
    ...stage,
    candidates: applications.filter(a => (a.status || 'new') === stage.key),
  }));

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    setDragging(appId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    if (!dragging) return;

    const newStatus = stageKey === 'new' ? 'new' : stageKey;
    
    const { error } = await supabase
      .from('public_applications')
      .update({ status: newStatus })
      .eq('id', dragging);

    if (!error) {
      onRefresh();
    }
    setDragging(null);
  };

  const getJobTitle = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    return job?.title || 'Unknown Job';
  };

  const generateAISummary = async (candidate: any) => {
    setLoadingSummary(true);
    setAiSummary('');
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-resume-summary', {
        body: {
          full_name: candidate.full_name,
          email: candidate.email,
          resume_url: candidate.resume_url,
          cover_letter: candidate.cover_letter,
          linkedin_url: candidate.linkedin_url,
        },
      });

      if (error) throw error;
      setAiSummary(data?.summary || 'Unable to generate summary.');
    } catch (err) {
      console.error('AI summary error:', err);
      setAiSummary('Failed to generate AI summary.');
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (selectedCandidate) {
      generateAISummary(selectedCandidate);
    }
  }, [selectedCandidate]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-4">
        {grouped.map(stage => (
          <div
            key={stage.key}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.key)}
            className={`rounded-xl border-2 border-dashed p-4 min-h-[500px] ${stage.color}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-foreground">{stage.label}</h3>
              <span className="text-xs font-medium text-muted-foreground bg-card px-2 py-1 rounded-full">
                {stage.candidates.length}
              </span>
            </div>

            <div className="space-y-2">
              {stage.candidates.map(app => (
                <div
                  key={app.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, app.id)}
                  onClick={() => setSelectedCandidate(app)}
                  className="bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                >
                  <p className="font-medium text-sm text-foreground mb-1">{app.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate mb-2">{getJobTitle(app.job_id)}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{app.email}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Candidate Detail Slide-over */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end" onClick={() => setSelectedCandidate(null)}>
          <div className="bg-card w-full max-w-2xl h-full overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-heading font-bold text-foreground">{selectedCandidate.full_name}</h2>
              <button onClick={() => setSelectedCandidate(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* AI Summary */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <h3 className="font-semibold text-sm text-foreground">AI Summary</h3>
                </div>
                {loadingSummary ? (
                  <p className="text-sm text-muted-foreground italic">Generating summary...</p>
                ) : (
                  <p className="text-sm text-foreground leading-relaxed">{aiSummary}</p>
                )}
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${selectedCandidate.email}`} className="hover:text-primary">{selectedCandidate.email}</a>
                  </div>
                  {selectedCandidate.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{selectedCandidate.phone}</span>
                    </div>
                  )}
                  {selectedCandidate.current_location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedCandidate.current_location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Links */}
              {(selectedCandidate.linkedin_url || selectedCandidate.github_url || selectedCandidate.portfolio_url) && (
                <div>
                  <h3 className="font-semibold text-sm text-foreground mb-3">Links</h3>
                  <div className="space-y-2">
                    {selectedCandidate.linkedin_url && (
                      <a href={selectedCandidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <Linkedin className="w-4 h-4" />
                        LinkedIn Profile
                      </a>
                    )}
                    {selectedCandidate.github_url && (
                      <a href={selectedCandidate.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <Github className="w-4 h-4" />
                        GitHub Profile
                      </a>
                    )}
                    {selectedCandidate.portfolio_url && (
                      <a href={selectedCandidate.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <Globe className="w-4 h-4" />
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              {selectedCandidate.cover_letter && (
                <div>
                  <h3 className="font-semibold text-sm text-foreground mb-3">Cover Letter</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedCandidate.cover_letter}</p>
                </div>
              )}

              {/* Resume */}
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-3">Resume</h3>
                {selectedCandidate.resume_url && selectedCandidate.resume_url !== 'not_provided' ? (
                  <div className="border border-border rounded-lg overflow-hidden" style={{ height: '600px' }}>
                    <iframe
                      src={selectedCandidate.resume_url}
                      className="w-full h-full"
                      title="Resume Viewer"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No resume provided</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
