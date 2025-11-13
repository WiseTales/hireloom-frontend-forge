import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Calendar, MapPin, Users, Video, Plus } from "lucide-react";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  location: string | null;
  event_url: string | null;
  start_time: string;
  end_time: string;
  max_attendees: number | null;
  image_url: string | null;
  organizer_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
  rsvp_count?: number;
  user_rsvp?: string | null;
}

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "online",
    location: "",
    event_url: "",
    start_time: "",
    end_time: "",
    max_attendees: "",
  });

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          profiles!events_organizer_id_fkey (
            full_name,
            email
          )
        `)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });

      if (error) throw error;

      // Fetch RSVP counts and user's RSVP status
      const eventsWithRsvp = await Promise.all(
        (data || []).map(async (event) => {
          const { count } = await supabase
            .from("event_rsvps")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id)
            .eq("status", "going");

          const { data: userRsvp } = await supabase
            .from("event_rsvps")
            .select("status")
            .eq("event_id", event.id)
            .eq("user_id", user?.id || "")
            .maybeSingle();

          return {
            ...event,
            rsvp_count: count || 0,
            user_rsvp: userRsvp?.status || null,
          };
        })
      );

      setEvents(eventsWithRsvp);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("events").insert({
        ...formData,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        organizer_id: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event created successfully",
      });

      setIsCreateOpen(false);
      setFormData({
        title: "",
        description: "",
        event_type: "online",
        location: "",
        event_url: "",
        start_time: "",
        end_time: "",
        max_attendees: "",
      });
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRSVP = async (eventId: string, status: string) => {
    try {
      const { data: existing } = await supabase
        .from("event_rsvps")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", user?.id || "")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("event_rsvps")
          .update({ status })
          .eq("id", existing.id);
      } else {
        await supabase.from("event_rsvps").insert({
          event_id: eventId,
          user_id: user?.id,
          status,
        });
      }

      toast({
        title: "Success",
        description: `RSVP updated to: ${status}`,
      });

      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading events...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Professional Events</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Organize a professional event for your network
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              <div>
                <Label htmlFor="event_type">Event Type</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="in-person">In Person</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(formData.event_type === "in-person" || formData.event_type === "hybrid") && (
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              )}
              {(formData.event_type === "online" || formData.event_type === "hybrid") && (
                <div>
                  <Label htmlFor="event_url">Event URL</Label>
                  <Input
                    id="event_url"
                    type="url"
                    value={formData.event_url}
                    onChange={(e) => setFormData({ ...formData, event_url: e.target.value })}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="max_attendees">Max Attendees (optional)</Label>
                <Input
                  id="max_attendees"
                  type="number"
                  value={formData.max_attendees}
                  onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">Create Event</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                  <CardDescription className="mt-1">
                    by {event.profiles.full_name}
                  </CardDescription>
                </div>
                {event.event_type === "online" && <Video className="h-5 w-5 text-muted-foreground" />}
                {event.event_type === "in-person" && <MapPin className="h-5 w-5 text-muted-foreground" />}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                {event.description}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(event.start_time), "PPP p")}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{event.rsvp_count} attending</span>
                  {event.max_attendees && <span>/ {event.max_attendees} max</span>}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              {event.user_rsvp === "going" ? (
                <Button variant="secondary" className="flex-1" disabled>
                  ✓ Going
                </Button>
              ) : (
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => handleRSVP(event.id, "going")}
                >
                  Attend
                </Button>
              )}
              {event.user_rsvp === "interested" ? (
                <Button variant="secondary" className="flex-1" disabled>
                  ✓ Interested
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleRSVP(event.id, "interested")}
                >
                  Interested
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No upcoming events. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}
