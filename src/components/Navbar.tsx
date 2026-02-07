import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, Briefcase, X, MessageSquare, Bell, Shield, Calendar, Settings, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

export const Navbar = () => {
  const { user, logout, isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      subscribeToNotifications();
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id)
      .eq('read', false);

    setUnreadCount(count || 0);
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('navbar-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        () => fetchUnreadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const navItems = [
    { label: 'Jobs', href: '/jobs', icon: Briefcase },
    ...(isAuthenticated ? [
      { label: 'Dashboard', href: '/dashboard', icon: Briefcase },
      { label: 'Interviews', href: '/interviews', icon: Calendar },
      { label: 'Referrals', href: '/referrals', icon: UserPlus },
      { label: 'Messages', href: '/messages', icon: MessageSquare },
      ...(userRole === 'admin' ? [{ label: 'Moderation', href: '/moderation', icon: Shield }] : []),
    ] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-heading font-bold tracking-tight">HireLoom</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                asChild
                className="text-muted-foreground hover:text-foreground hover:bg-accent h-9 px-3 text-sm font-medium"
              >
                <Link to={item.href} className="flex items-center gap-1.5">
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="relative h-9 w-9"
              >
                <Link to="/notifications">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full px-1 flex items-center justify-center text-[10px]">
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
              </Button>
            )}
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground max-w-[140px] truncate">
                  {user?.user_metadata?.full_name || user?.email}
                </span>
                <Button variant="ghost" size="icon" asChild className="h-9 w-9">
                  <Link to="/settings">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout} className="h-9 text-sm">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="h-9 text-sm">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild className="h-9 text-sm">
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-3 space-y-1 animate-fade-in">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <div className="border-t pt-2 mt-2 px-3 space-y-2">
              {isAuthenticated ? (
                <>
                  <p className="text-sm text-muted-foreground py-1 truncate">
                    {user?.user_metadata?.full_name || user?.email}
                  </p>
                  <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                    <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild className="w-full">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                  </Button>
                  <Button size="sm" asChild className="w-full">
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};