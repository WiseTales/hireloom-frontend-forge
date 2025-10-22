import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Briefcase, Users, BookOpen, MapPin, DollarSign, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export const Recommendations = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [easyApplyOnly, setEasyApplyOnly] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    // Fetch jobs
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (jobsData) setJobs(jobsData);

    // Fetch people (excluding current user)
    const { data: peopleData } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user?.id)
      .limit(5);
    
    if (peopleData) setPeople(peopleData);

    // Fetch groups
    const { data: groupsData } = await supabase
      .from('groups')
      .select('*')
      .limit(3);
    
    if (groupsData) setGroups(groupsData);
  };

  return (
    <div className="space-y-4">
      {/* Job Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Jobs for you
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="easy-apply"
              checked={easyApplyOnly}
              onCheckedChange={setEasyApplyOnly}
            />
            <Label htmlFor="easy-apply" className="text-sm">Easy Apply Only</Label>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {jobs.slice(0, 3).map((job) => (
            <div key={job.id} className="space-y-2 pb-4 border-b last:border-0">
              <h4 className="font-semibold text-sm line-clamp-1">{job.title}</h4>
              <p className="text-sm text-muted-foreground">{job.company}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{job.location}</span>
              </div>
              <Button size="sm" variant="outline" className="w-full">
                View Job
              </Button>
            </div>
          ))}
          <Button variant="link" className="w-full text-sm p-0">
            Show all jobs
          </Button>
        </CardContent>
      </Card>

      {/* People Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            People to follow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {people.slice(0, 5).map((person) => {
            const initials = person.full_name
              ?.split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase() || person.email?.[0]?.toUpperCase() || 'U';

            return (
              <div key={person.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium line-clamp-1">
                      {person.full_name || person.email}
                    </p>
                    <p className="text-xs text-muted-foreground">Professional</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Follow
                </Button>
              </div>
            );
          })}
          <Button variant="link" className="w-full text-sm p-0">
            Show all
          </Button>
        </CardContent>
      </Card>

      {/* Groups Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Groups for you
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {groups.length > 0 ? (
            <>
              {groups.map((group) => (
                <div key={group.id} className="space-y-2 pb-3 border-b last:border-0">
                  <h4 className="font-semibold text-sm line-clamp-1">{group.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {group.description || 'Professional networking group'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{group.member_count || 0} members</span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    Join
                  </Button>
                </div>
              ))}
              <Button variant="link" className="w-full text-sm p-0">
                Show all groups
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No groups available yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};