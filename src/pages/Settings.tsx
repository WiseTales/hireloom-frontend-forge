import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Shield, Bell, User, Download, Trash2 } from "lucide-react";

interface NotificationPreferences {
  email_notifications: boolean;
  connection_requests: boolean;
  messages: boolean;
  post_reactions: boolean;
  comments: boolean;
  job_alerts: boolean;
  event_reminders: boolean;
  article_updates: boolean;
}

export default function Settings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    connection_requests: true,
    messages: true,
    post_reactions: true,
    comments: true,
    job_alerts: true,
    event_reminders: true,
    article_updates: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user?.id || "")
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setPreferences({
          email_notifications: data.email_notifications,
          connection_requests: data.connection_requests,
          messages: data.messages,
          post_reactions: data.post_reactions,
          comments: data.comments,
          job_alerts: data.job_alerts,
          event_reminders: data.event_reminders,
          article_updates: data.article_updates,
        });
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("notification_preferences")
        .select("id")
        .eq("user_id", user?.id || "")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("notification_preferences")
          .update(preferences)
          .eq("user_id", user?.id || "");

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("notification_preferences")
          .insert({
            ...preferences,
            user_id: user?.id,
          });

        if (error) throw error;
      }

      toast.success("Notification preferences saved successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading settings...</div>;
  }

  const [profile, setProfile] = useState<any>(null);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();
    if (data) setProfile(data);
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="data">
            <Download className="h-4 w-4 mr-2" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={profile?.email || ""} disabled />
              </div>
              <div>
                <Label>Full Name</Label>
                <Input value={profile?.full_name || ""} disabled />
              </div>
              <Button onClick={() => toast.info("Password change coming soon")}>
                Change Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Profile visible to everyone</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>Allow connection requests</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>Show profile in search</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>Allow messages from non-connections</Label>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email_notifications"
              checked={preferences.email_notifications}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, email_notifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="connection_requests">Connection Requests</Label>
              <p className="text-sm text-muted-foreground">
                Notify when someone wants to connect
              </p>
            </div>
            <Switch
              id="connection_requests"
              checked={preferences.connection_requests}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, connection_requests: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="messages">Messages</Label>
              <p className="text-sm text-muted-foreground">
                Notify when you receive a message
              </p>
            </div>
            <Switch
              id="messages"
              checked={preferences.messages}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, messages: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="post_reactions">Post Reactions</Label>
              <p className="text-sm text-muted-foreground">
                Notify when someone reacts to your posts
              </p>
            </div>
            <Switch
              id="post_reactions"
              checked={preferences.post_reactions}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, post_reactions: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="comments">Comments</Label>
              <p className="text-sm text-muted-foreground">
                Notify when someone comments on your posts
              </p>
            </div>
            <Switch
              id="comments"
              checked={preferences.comments}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, comments: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="job_alerts">Job Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Notify about new job opportunities
              </p>
            </div>
            <Switch
              id="job_alerts"
              checked={preferences.job_alerts}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, job_alerts: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="event_reminders">Event Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Remind me about upcoming events
              </p>
            </div>
            <Switch
              id="event_reminders"
              checked={preferences.event_reminders}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, event_reminders: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="article_updates">Article Updates</Label>
              <p className="text-sm text-muted-foreground">
                Notify about new articles from your network
              </p>
            </div>
            <Switch
              id="article_updates"
              checked={preferences.article_updates}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, article_updates: checked })
              }
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Export Your Data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Download a copy of all your data including posts, connections, and profile information.
                </p>
                <Button variant="outline" onClick={() => toast.info("Export will be emailed to you shortly")}>
                  <Download className="h-4 w-4 mr-2" />
                  Request Data Export
                </Button>
              </div>
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2 text-destructive">Delete Account</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="destructive" onClick={() => toast.error("Account deletion coming soon")}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
