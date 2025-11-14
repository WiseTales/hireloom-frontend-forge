import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, Search, Bookmark, Briefcase, X, Users, MessageSquare, Bell, Shield, Calendar, FileText, BarChart, Settings } from 'lucide-react';
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

  const navItems = isAuthenticated ? [
    { label: 'Search Jobs', href: '/dashboard', icon: Search },
    { label: 'Feed', href: '/feed', icon: Users },
    { label: 'Groups', href: '/groups', icon: Users },
    { label: 'Events', href: '/events', icon: Calendar },
    { label: 'Articles', href: '/articles', icon: FileText },
    { label: 'Messages', href: '/messages', icon: MessageSquare },
    { label: 'Saved Jobs', href: '/saved', icon: Bookmark },
    { label: 'Applied Jobs', href: '/applied', icon: Briefcase },
    { label: 'Analytics', href: '/analytics', icon: BarChart },
    ...(userRole === 'admin' ? [{ label: 'Moderation', href: '/moderation', icon: Shield }] : []),
  ] : [];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-hero">
              <Briefcase className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">HireLoom</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                asChild
                className="text-foreground hover:bg-accent"
              >
                <Link to={item.href} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="relative"
              >
                <Link to="/notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
              </Button>
            )}
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Welcome, {user?.user_metadata?.full_name || user?.email}
                </span>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/settings">
                    <Settings className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 hover:bg-accent rounded-md transition-smooth"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <div className="border-t pt-2 mt-2 px-4 space-y-2">
              {isAuthenticated ? (
                <>
                  <p className="text-sm text-muted-foreground py-2">
                    Welcome, {user?.user_metadata?.full_name || user?.email}
                  </p>
                  <Button variant="ghost" asChild className="w-full">
                    <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={handleLogout} className="w-full">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild className="w-full">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
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
