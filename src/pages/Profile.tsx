import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MapPin, Building2, Mail, Calendar, Users, Briefcase } from 'lucide-react';

import { ProfileViews } from '@/components/ProfileViews';
import { Skills } from '@/components/profile/Skills';
import { Recommendations } from '@/components/profile/Recommendations';
import { Certifications } from '@/components/profile/Certifications';
import { Projects } from '@/components/profile/Projects';
import { Experience } from '@/components/profile/Experience';
import { Education } from '@/components/profile/Education';
import { ConnectionSuggestions } from '@/components/ConnectionSuggestions';
import { AboutSection } from '@/components/profile/AboutSection';
import { CoverPhoto } from '@/components/profile/CoverPhoto';
import { ProfileCompletion } from '@/components/profile/ProfileCompletion';
import { ProfileAutofill } from '@/components/profile/ProfileAutofill';
import { AutofillDataReview } from '@/components/profile/AutofillDataReview';

const Profile = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { userId } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ connections: 0, posts: 0 });
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [hasExperience, setHasExperience] = useState(false);
  const [hasEducation, setHasEducation] = useState(false);
  const [hasSkills, setHasSkills] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

  const profileUserId = userId || user?.id;
  const isOwnProfile = user?.id === profileUserId;

  useEffect(() => {
    if (profileUserId) {
      fetchProfile();
      checkProfileCompletion();
    }
  }, [profileUserId]);

  const checkProfileCompletion = async () => {
    const [exp, edu, skills] = await Promise.all([
      supabase.from("work_experience").select("id").eq("profile_id", profileUserId).limit(1),
      supabase.from("education").select("id").eq("profile_id", profileUserId).limit(1),
      supabase.from("profile_skills").select("id").eq("profile_id", profileUserId).limit(1),
    ]);
    setHasExperience((exp.data?.length || 0) > 0);
    setHasEducation((edu.data?.length || 0) > 0);
    setHasSkills((skills.data?.length || 0) > 0);
  };

  const fetchProfile = async () => {
    setLoading(true);
    
    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileUserId)
      .single();
    
    if (profileData) {
      setProfile(profileData);
    }

    // Fetch stats
    const [connectionsRes, postsRes] = await Promise.all([
      supabase
        .from('connections')
        .select('id', { count: 'exact' })
        .or(`requester_id.eq.${profileUserId},recipient_id.eq.${profileUserId}`)
        .eq('status', 'accepted'),
      supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .eq('user_id', profileUserId)
    ]);

    setStats({
      connections: connectionsRes.count || 0,
      posts: postsRes.count || 0
    });

    // Fetch user posts
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', profileUserId)
      .order('created_at', { ascending: false });
    
    if (postsData) setPosts(postsData);

    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  const initials = profile.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || profile.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Photo */}
      <CoverPhoto 
        profileId={profileUserId!}
        coverPhotoUrl={profile?.cover_photo_url}
        isOwnProfile={isOwnProfile}
        onUpdate={fetchProfile}
      />
      {/* Header Card */}
      <Card className="border-b rounded-none -mt-16 relative z-10">
        <CardContent className="pb-0 pt-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarFallback className="text-3xl font-semibold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 pt-16 sm:pt-0">
              <h1 className="text-2xl font-bold">{profile.full_name || profile.email}</h1>
              <p className="text-muted-foreground">Professional at HireLoom</p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Location
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {stats.connections} connections
                </span>
              </div>
            </div>

            {!isOwnProfile && (
              <div className="flex gap-2">
                <Button>Connect</Button>
                <Button variant="outline">Message</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <div className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.connections}</p>
                <p className="text-sm text-muted-foreground">Connections</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.posts}</p>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-4">
            {/* AI Autofill Section - Only for own profile */}
            {isOwnProfile && !extractedData && (
              <ProfileAutofill 
                profileId={profileUserId!}
                onDataExtracted={(data) => setExtractedData(data)}
              />
            )}
            
            {/* Review extracted data before saving */}
            {isOwnProfile && extractedData && (
              <AutofillDataReview
                data={extractedData}
                profileId={profileUserId!}
                onSaveComplete={() => {
                  setExtractedData(null);
                  fetchProfile();
                  checkProfileCompletion();
                }}
              />
            )}

            <AboutSection
              profileId={profileUserId!}
              bio={profile?.bio}
              headline={profile?.headline}
              isOwnProfile={isOwnProfile}
              onUpdate={fetchProfile}
            />
            
            {isOwnProfile && (
              <>
                <ProfileCompletion
                  profile={profile}
                  hasExperience={hasExperience}
                  hasEducation={hasEducation}
                  hasSkills={hasSkills}
                />
                <ProfileViews />
                <ConnectionSuggestions />
              </>
            )}
          </TabsContent>

          <TabsContent value="experience">
            <Experience profileId={profileUserId!} isOwnProfile={isOwnProfile} />
          </TabsContent>

          <TabsContent value="education">
            <Education profileId={profileUserId!} isOwnProfile={isOwnProfile} />
          </TabsContent>

          <TabsContent value="posts">
            <div className="space-y-4">
              {posts.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No posts yet</p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                      <p className="whitespace-pre-wrap">{post.content}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="skills">
            <Skills profileId={profileUserId!} isOwnProfile={isOwnProfile} />
          </TabsContent>

          <TabsContent value="certifications">
            <Certifications profileId={profileUserId!} isOwnProfile={isOwnProfile} />
          </TabsContent>

          <TabsContent value="projects">
            <Projects profileId={profileUserId!} isOwnProfile={isOwnProfile} />
          </TabsContent>

          <TabsContent value="recommendations">
            <Recommendations profileId={profileUserId!} isOwnProfile={isOwnProfile} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;