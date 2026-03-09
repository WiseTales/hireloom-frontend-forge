import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Building2, CheckCircle2, XCircle } from 'lucide-react';

export default function InviteAcceptPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    validateToken();
  }, []);

  const validateToken = async () => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    // Fetch invitation
    const { data: invite, error: inviteError } = await supabase
      .from('invitations')
      .select('*, companies(id, name, slug)')
      .eq('token', token)
      .eq('status', 'pending')
      .maybeSingle();

    if (inviteError || !invite) {
      setError('Invitation not found or has expired');
      setLoading(false);
      return;
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      setError('This invitation has expired');
      setLoading(false);
      return;
    }

    setInvitation(invite);
    setCompanyInfo(invite.companies);
    setLoading(false);
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation || !companyInfo) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setAccepting(true);
    setError('');

    try {
      // Create user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Failed to create user account');

      // Add user to company
      const { error: companyUserError } = await supabase
        .from('company_users')
        .insert({
          user_id: authData.user.id,
          company_id: companyInfo.id,
          role: invitation.role,
        });

      if (companyUserError) throw companyUserError;

      // Mark invitation as accepted
      await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Failed to accept invitation');
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Validating invitation...
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-secondary/50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-xl border border-border p-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full mx-auto mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
              Invalid Invitation
            </h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
          <div className="flex items-center justify-center w-14 h-14 bg-primary/10 rounded-xl mx-auto mb-6">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground text-center mb-2">
            Join {companyInfo.name}
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            You've been invited to join the team as a{' '}
            <span className="font-medium text-foreground">
              {invitation.role.replace('_', ' ')}
            </span>
          </p>

          <form onSubmit={handleAcceptInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <input
                type="email"
                value={invitation.email}
                disabled
                className="w-full px-4 py-3 border border-border rounded-lg bg-muted text-muted-foreground text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Create Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                placeholder="Re-enter password"
              />
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={accepting}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
            >
              {accepting ? 'Creating Account...' : 'Accept Invitation & Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              By accepting this invitation, you agree to join {companyInfo.name}'s team
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
