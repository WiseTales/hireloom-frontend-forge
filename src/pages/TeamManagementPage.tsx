import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Mail, UserPlus, Trash2, Shield, Users as UsersIcon } from 'lucide-react';

type Profile = {
  email: string;
  full_name: string | null;
};

type TeamMember = {
  id: string;
  user_id: string;
  role: string;
  created_at: string | null;
  profile?: Profile;
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
};

export default function TeamManagementPage() {
  const [user, setUser] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'recruiter' | 'hiring_manager' | 'viewer'>('recruiter');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);

    // Get company info
    const { data: companyUser } = await supabase
      .from('company_users')
      .select('company_id, role, companies(id, name, slug)')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (!companyUser?.companies) {
      navigate('/dashboard');
      return;
    }

    const company = companyUser.companies as any;
    setCompanyInfo({ ...company, userRole: companyUser.role });

    // Check if user is super_admin
    if (companyUser.role !== 'super_admin') {
      navigate('/dashboard');
      return;
    }

    // Load team members
    const { data: members } = await supabase
      .from('company_users')
      .select('id, user_id, role, created_at')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (members) {
      // Fetch profiles separately
      const memberIds = members.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', memberIds);

      const membersWithProfiles = members.map(member => ({
        ...member,
        profile: profiles?.find(p => p.id === member.user_id),
      }));

      setTeamMembers(membersWithProfiles);
    }

    // Load pending invitations
    const { data: invites } = await supabase
      .from('invitations')
      .select('*')
      .eq('company_id', company.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setInvitations(invites || []);
    setLoading(false);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !companyInfo) return;

    setInviteLoading(true);
    setInviteError('');

    try {
      // Generate token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      // Create invitation
      const { error } = await supabase
        .from('invitations')
        .insert({
          email: inviteEmail.trim().toLowerCase(),
          company_id: companyInfo.id,
          role: inviteRole,
          token,
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      // TODO: Send email with invite link
      // For now, we'll just show the link in the UI
      alert(`Invitation created! Share this link:\n${window.location.origin}/invite/accept?token=${token}`);

      setInviteEmail('');
      setShowInviteModal(false);
      loadData();
    } catch (error: any) {
      setInviteError(error.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;

    const { error } = await supabase
      .from('invitations')
      .update({ status: 'revoked' })
      .eq('id', inviteId);

    if (!error) {
      loadData();
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the team?`)) return;

    const { error } = await supabase
      .from('company_users')
      .delete()
      .eq('id', memberId);

    if (!error) {
      loadData();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-primary/10 text-primary';
      case 'recruiter': return 'bg-blue-500/10 text-blue-600';
      case 'hiring_manager': return 'bg-purple-500/10 text-purple-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'recruiter': return 'Recruiter';
      case 'hiring_manager': return 'Hiring Manager';
      case 'viewer': return 'Viewer';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/50">
      {/* Header */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <UsersIcon className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-heading font-bold text-foreground">Team Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage team members and their roles for {companyInfo.name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invite Section */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-heading font-semibold text-foreground mb-4">
                Invite Team Member
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Send an invitation to add a new team member to your company.
              </p>
              <button
                onClick={() => setShowInviteModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                <UserPlus className="w-4 h-4" />
                Send Invitation
              </button>
            </div>

            {/* Role Descriptions */}
            <div className="bg-card rounded-xl border border-border p-6 mt-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Role Permissions</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="font-medium text-foreground mb-1">Super Admin</div>
                  <p className="text-muted-foreground text-xs">
                    Full access to manage company, team members, jobs, and candidates
                  </p>
                </div>
                <div>
                  <div className="font-medium text-foreground mb-1">Recruiter</div>
                  <p className="text-muted-foreground text-xs">
                    Create and manage jobs, view and manage all candidates
                  </p>
                </div>
                <div>
                  <div className="font-medium text-foreground mb-1">Hiring Manager</div>
                  <p className="text-muted-foreground text-xs">
                    View assigned jobs and candidates, submit hiring decisions
                  </p>
                </div>
                <div>
                  <div className="font-medium text-foreground mb-1">Viewer</div>
                  <p className="text-muted-foreground text-xs">
                    Read-only access to jobs and candidates
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Team Members & Invitations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Team Members */}
            <div className="bg-card rounded-xl border border-border">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-heading font-semibold text-foreground">
                  Team Members ({teamMembers.length})
                </h2>
              </div>
              <div className="divide-y divide-border">
                {teamMembers.length === 0 ? (
                  <div className="px-6 py-8 text-center text-muted-foreground">
                    No team members yet
                  </div>
                ) : (
                  teamMembers.map((member) => (
                    <div key={member.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {member.profiles?.full_name || member.profiles?.email || 'Unknown User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {member.profiles?.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </span>
                        {member.user_id !== user.id && member.role !== 'super_admin' && (
                          <button
                            onClick={() => handleRemoveMember(member.id, member.profiles?.email || '')}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
              <div className="bg-card rounded-xl border border-border">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="text-lg font-heading font-semibold text-foreground">
                    Pending Invitations ({invitations.length})
                  </h2>
                </div>
                <div className="divide-y divide-border">
                  {invitations.map((invite) => (
                    <div key={invite.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{invite.email}</div>
                          <div className="text-sm text-muted-foreground">
                            Invited {new Date(invite.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(invite.role)}`}>
                          {getRoleLabel(invite.role)}
                        </span>
                        <button
                          onClick={() => handleRevokeInvite(invite.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="Revoke invitation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border max-w-md w-full p-6">
            <h2 className="text-xl font-heading font-bold text-foreground mb-4">
              Invite Team Member
            </h2>
            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                  placeholder="colleague@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                >
                  <option value="recruiter">Recruiter</option>
                  <option value="hiring_manager">Hiring Manager</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              {inviteError && (
                <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm">
                  {inviteError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInviteError('');
                  }}
                  className="flex-1 px-4 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
