"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Video, Calendar, Clock, ExternalLink, CalendarPlus, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([
    {
      title: "Q1 Product Roadmap Review",
      date: "Monday, April 7",
      time: "2:00 PM - 3:00 PM",
      meeting_link: "https://meet.google.com/jvf-uyez-rxy",
      calendar_link: "https://calendar.google.com/calendar/r/eventedit",
      reason: "Discuss upcoming features and priorities for Q1 2026"
    },
    {
      title: "Engineering Team Sync",
      date: "Wednesday, April 9",
      time: "10:00 AM - 10:30 AM",
      meeting_link: "https://meet.google.com/kbc-mnyj-xab",
      calendar_link: "https://calendar.google.com/calendar/r/eventedit",
      reason: "Weekly sync to align on current tasks and blockers"
    },
    {
      title: "Client Presentation - ACME Corp",
      date: "Thursday, April 10",
      time: "3:30 PM - 4:30 PM",
      meeting_link: "https://meet.google.com/qwe-asdf-zxcv",
      calendar_link: "https://calendar.google.com/calendar/r/eventedit",
      reason: "Present new AI features and capabilities"
    },
    {
      title: "Design System Workshop",
      date: "Friday, April 11",
      time: "11:00 AM - 12:30 PM",
      meeting_link: "https://meet.google.com/aaa-bbbb-cccc",
      calendar_link: "https://calendar.google.com/calendar/r/eventedit",
      reason: "Review and refine design system components"
    },
    {
      title: "Executive Standup",
      date: "Monday, April 14",
      time: "9:00 AM - 9:15 AM",
      meeting_link: "https://meet.google.com/xyz-123-abc",
      calendar_link: "https://calendar.google.com/calendar/r/eventedit",
      reason: "Daily executive team status update"
    },
    {
      title: "Customer Success Review",
      date: "Tuesday, April 15",
      time: "1:00 PM - 2:00 PM",
      meeting_link: "https://meet.google.com/pqr-stuv-wxyz",
      calendar_link: "https://calendar.google.com/calendar/r/eventedit",
      reason: "Review customer metrics and success stories"
    }
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadMeetings() {
      try {
        // Fetch a larger set to increase chances of finding meetings
        const data = await api.fetchEmails(20);
        if (mounted && data.meetings_detected && data.meetings_detected.length > 0) {
          setMeetings(data.meetings_detected);
        }
      } catch (err) {
        console.error("Failed to load meetings", err);
        // Keep mock data on error
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    
    // Show mock data immediately, then try to load real data
    setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 500);
    
    loadMeetings();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Meetings Overview</h1>
        <p className="text-muted-foreground">Detected meetings from your integrations and emails.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : meetings.length === 0 ? (
        <GlassCard className="p-12 flex flex-col items-center text-center opacity-70">
          <Video className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">No Meetings Found</h3>
          <p className="text-sm text-muted-foreground">No upcoming meetings were detected in your recent emails.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {meetings.map((meeting, i) => (
            <GlassCard key={i} className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                  <Video className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{meeting.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {meeting.date || "TBA"}</span>
                    {meeting.time && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {meeting.time}</span>}
                    <span className="px-2 py-0.5 rounded text-xs bg-white/10">Source: Email Intelligence</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white">
                  <CalendarPlus className="w-4 h-4 mr-2" /> Add
                </Button>
                {meeting.meeting_link ? (
                  <Button 
                    onClick={() => window.open(meeting.meeting_link, '_blank')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_10px_rgba(0,255,255,0.3)] hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> Join
                  </Button>
                ) : (
                  <Button disabled variant="outline" className="border-white/10 bg-transparent text-white/50">
                    No Link
                  </Button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
