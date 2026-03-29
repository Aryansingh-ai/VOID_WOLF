"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Plus, Trash2, ArrowRight, Video, Calendar, Clock, Loader2, Sparkles, AlertCircle, FileText, ExternalLink } from "lucide-react";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export default function EmailIntelligencePage() {
  const [isFetching, setIsFetching] = useState(false);
  const [emailData, setEmailData] = useState<any>(null);
  
  const [emailCount, setEmailCount] = useState<number | string>(3);
  
  const [trackedEmails, setTrackedEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  
  const [trackedEvents, setTrackedEvents] = useState<string[]>([]);
  const [newEvent, setNewEvent] = useState("");
  
  const handleEmailCountBlur = () => {
    let count = Number(emailCount);
    if (!emailCount || isNaN(count) || count < 1) {
      setEmailCount(1);
    } else if (count > 20) {
      setEmailCount(20);
    }
  };

  const addEmail = () => {
    if (newEmail && !trackedEmails.includes(newEmail)) {
      setTrackedEmails([...trackedEmails, newEmail]);
      setNewEmail("");
    }
  }

  const addEvent = () => {
    if (newEvent && !trackedEvents.includes(newEvent)) {
      setTrackedEvents([...trackedEvents, newEvent]);
      setNewEvent("");
    }
  }
  
  const handleFetch = async () => {
    setIsFetching(true);
    try {
      const data = await api.fetchEmails(Number(emailCount), trackedEmails, trackedEvents);
      setEmailData(data);
    } catch (error) {
      console.error("Failed to fetch emails", error);
    } finally {
      setIsFetching(false);
    }
  };

  const getSortedEmails = () => {
    if (!emailData?.emails) return [];
    const priorityMap: Record<string, number> = { "high": 3, "medium": 2, "low": 1 };
    return [...emailData.emails].sort((a: any, b: any) => {
      const pA = priorityMap[a.classification?.importance?.toLowerCase()] || 0;
      const pB = priorityMap[b.classification?.importance?.toLowerCase()] || 0;
      return pB - pA;
    });
  };

  const sortedEmails = getSortedEmails();

  const formatAIContent = (text: string) => {
    if (!text) return "";
    let safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    // First strip markdown to avoid random highlights
    safeText = safeText.replace(/\*\*([^*]+)\*\*/g, "$1");
    safeText = safeText.replace(/\*([^*]+)\*/g, "$1");

    // ===== TIER 1: CRITICAL RED HIGHLIGHTS ONLY =====
    // Only for truly urgent/critical terms
    safeText = safeText.replace(
      /\b(urgent|deadline|action required|critical|asap|immediately)\b/gi,
      '<span class="inline-block bg-red-500/20 text-red-300 px-2 py-0.5 rounded-md text-xs font-semibold mx-0.5 border border-red-500/30">$1</span>'
    );

    // ===== TIER 2: DATES (soft purple, no badge) =====
    safeText = safeText.replace(
      /\b((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[,]?\s*\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December))\b/gi,
      '<span class="text-purple-300 font-medium">$1</span>'
    );
    safeText = safeText.replace(
      /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[A-Za-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?)\b/gi,
      '<span class="text-purple-300 font-medium">$1</span>'
    );

    // ===== TIER 3: TIMES (soft blue, no badge) =====
    safeText = safeText.replace(
      /\b(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM|a\.m\.|p\.m\.))\b/g,
      '<span class="text-blue-300 font-semibold">$1</span>'
    );

    // ===== TIER 4: EMAIL ADDRESSES (cyan, underline on context) =====
    safeText = safeText.replace(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      '<span class="text-cyan-400 font-medium">$1</span>'
    );

    // ===== TIER 5: NUMBERS / METRICS (bright white only) =====
    safeText = safeText.replace(
      /\b(\$\d+(?:\.\d+)?(?:[kKmMbB]?)|(?:[0-9]+(?:\.\d+)?)%)\b/g,
      '<strong class="text-white font-semibold">$1</strong>'
    );

    // 4. Links: Convert to clean clickable text, float right or end of bullet
    // We will do this per-line so they neatly sit at the end
    const lines = safeText.split('\n');
    let inList = false;
    let newHtml = "";

    lines.forEach(line => {
      let trimmed = line.trim();
      
      // Handle links per line to format them correctly
      const urlRegex = /(https?:\/\/[^\s*]+)/g;
      const links = trimmed.match(urlRegex) || [];
      if (links.length > 0) {
        // Strip the raw URLs from text
        trimmed = trimmed.replace(urlRegex, '').trim();
        // Append them as beautiful action links at the end
        links.forEach(url => {
          // Check if url ended with a punctuation we left behind
          const cleanUrl = url.replace(/[.,;)]+$/, '');
          trimmed += ` <a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[#60A5FA] hover:text-[#93C5FD] underline font-medium transition-colors align-middle ml-2">View Link <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>`;
        });
      }

      // Cleanup stray prefixes like "Link provided to view the opportunity:" left empty by stripping the URL
      trimmed = trimmed.replace(/[-:]\s*(<a href)/, "$1").trim();
      if (trimmed === '-') return; // Skip empty bullet

      if (trimmed.startsWith('-')) {
         if (!inList) {
           newHtml += '<ul class="space-y-2 mt-2 mb-2">';
           inList = true;
         }
         let content = trimmed.substring(1).trim();
         
         // Capitalize first letter cleanly
         if (content && !content.startsWith('<a')) {
           content = content.charAt(0).toUpperCase() + content.slice(1);
         }

         newHtml += `<li class="flex items-start leading-relaxed text-[#A1A1AA]"><span class="mt-2 mr-3 w-1.5 h-1.5 rounded-full bg-[#8B5CF6] shrink-0 opacity-80"></span><span class="flex-1">${content}</span></li>`;
      } else {
         if (inList) {
           newHtml += '</ul>';
           inList = false;
         }
         if (trimmed) {
           newHtml += `<div class="mb-2 text-[#A1A1AA] leading-relaxed">${trimmed}</div>`;
         }
      }
    });
    
    if (inList) newHtml += '</ul>';
    
    return newHtml;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      <div className="w-full rounded-2xl overflow-hidden border border-[#1F1F22] relative bg-[#0A0A0A]">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/[0.03] to-transparent pointer-events-none" />
        <BackgroundPaths title="Email Intelligence" />
      </div>

      {/* TOP ROW: Filters & Priority Ranking List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Advanced Options (col-span-1) */}
        <div className="lg:col-span-1">
          <GlassCard className="p-6 h-full flex flex-col">
            <h2 className="text-lg font-bold text-[#EAEAEA] mb-4">Advanced Filters</h2>
            
            <div className="space-y-4 mb-6 flex-1">
              <div>
                <label className="text-xs font-medium text-[#D4D4D8] mb-2 block">Tracked Emails</label>
                <div className="flex gap-2 mb-2">
                  <Input 
                    placeholder="investor@example.com" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                    className="bg-[#0A0A0A] border-[#1F1F22] text-[#E5E5E5] placeholder:text-[#6B7280] focus-visible:border-[#3A3A3F] focus-visible:ring-1 focus-visible:ring-[#3A3A3F]/50 h-10 text-sm" 
                  />
                  <Button onClick={addEmail} variant="outline" size="icon" className="shrink-0 h-10 w-10 border-[#2A2A2E] bg-transparent text-[#D1D5DB] hover:text-white hover:bg-[#1F1F22] hover:border-[#3A3A3F]"><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trackedEmails.map((email, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-[#1F1F22] bg-[#0A0A0A] text-[#E5E5E5]">
                      <Mail className="w-3 h-3 text-[#A1A1AA]"/> {email} 
                      <button onClick={() => setTrackedEmails(trackedEmails.filter(e => e !== email))}><Trash2 className="w-3 h-3 text-[#6B7280] hover:text-[#EAEAEA] ml-1 transition-colors"/></button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#D4D4D8] mb-2 block mt-6">Tracked Projects</label>
                <div className="flex gap-2 mb-2">
                  <Input 
                    placeholder="Project Alpha" 
                    value={newEvent}
                    onChange={(e) => setNewEvent(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addEvent()}
                    className="bg-[#0A0A0A] border-[#1F1F22] text-[#E5E5E5] placeholder:text-[#6B7280] focus-visible:border-[#3A3A3F] focus-visible:ring-1 focus-visible:ring-[#3A3A3F]/50 h-10 text-sm" 
                  />
                  <Button onClick={addEvent} variant="outline" size="icon" className="shrink-0 h-10 w-10 border-[#2A2A2E] bg-transparent text-[#D1D5DB] hover:text-white hover:bg-[#1F1F22] hover:border-[#3A3A3F]"><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trackedEvents.map((evt, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-[#1F1F22] bg-[#0A0A0A] text-[#E5E5E5]">
                      {evt} 
                      <button onClick={() => setTrackedEvents(trackedEvents.filter(e => e !== evt))}><Trash2 className="w-3 h-3 text-[#6B7280] hover:text-[#EAEAEA] ml-1 transition-colors"/></button>
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-[#D4D4D8] mb-2 block mt-6">Emails to Summarize</label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    min={1} 
                    max={20}
                    value={emailCount}
                    onChange={(e) => setEmailCount(e.target.value)}
                    onBlur={handleEmailCountBlur}
                    className="bg-[#0A0A0A] border-[#1F1F22] text-[#E5E5E5] placeholder:text-[#6B7280] focus-visible:border-[#3A3A3F] focus-visible:ring-1 focus-visible:ring-[#3A3A3F]/50 h-10 text-sm w-full" 
                  />
                </div>
                <p className="text-[10px] text-[#6B7280] mt-1">Select between 1 and 20 emails.</p>
              </div>
            </div>

            <Button onClick={handleFetch} disabled={isFetching} className="w-full h-12 mt-auto bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#050505] font-semibold border border-transparent transition-all">
              {isFetching ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
              {isFetching ? "Analyzing Inbox..." : "Fetch Emails"}
            </Button>
          </GlassCard>
        </div>

        {/* Right Column: Priority Ranking (col-span-2) */}
        <div className="lg:col-span-2 h-full">
          {(!emailData && !isFetching) ? (
            <GlassCard className="h-full min-h-[400px] p-6 flex flex-col items-center justify-center text-center">
              <Mail className="w-16 h-16 text-[#A1A1AA] mb-4 group-hover:text-[#EAEAEA] transition-colors opacity-50" />
              <p className="text-xl font-medium text-[#E5E5E5] mb-2">Inbox is waiting</p>
              <p className="text-[#6B7280] max-w-sm">Click Fetch Emails to run the intelligence pipeline through your unread messages.</p>
            </GlassCard>
          ) : (
            <GlassCard className="p-6 h-full flex flex-col">
              <h2 className="text-lg font-bold text-[#EAEAEA] mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#A1A1AA]" /> Priority Ranking
              </h2>
              
              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[400px] lg:max-h-none">
                {emailData?.priority_ranking?.map((email: any, i: number) => {
                  const priority = email.priority?.toLowerCase() || 'medium';
                  const isHigh = priority === 'high';
                  const isMedium = priority === 'medium';
                  const isLow = priority === 'low';
                  
                  const color = isHigh ? "text-red-400 bg-red-400/10 border-red-400/20" 
                              : isMedium ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
                              : isLow ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                              : "text-[#A1A1AA] bg-transparent border-[#1F1F22]";

                  const mailLink = sortedEmails?.find((e: any) => e.subject === email.subject)?.mail_link || "#";

                  return (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-5 rounded-2xl bg-white/[0.02] backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#E5E5E5] truncate mb-2 text-base">{email.subject}</h3>
                        <p className="text-sm text-[#A1A1AA] line-clamp-1">{email.reason}</p>
                      </div>
                      <div className="flex flex-col items-end gap-3 shrink-0 mt-1 sm:mt-0">
                        <span className={cn("px-2.5 py-1 rounded-md text-[11px] font-bold border w-fit uppercase tracking-widest", color)}>{email.priority}</span>
                        <Button
                          onClick={() => mailLink !== "#" && window.open(mailLink, '_blank')}
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs font-semibold text-[#8B5CF6] hover:text-[#A78BFA] hover:bg-transparent transition-all hover:scale-105 uppercase tracking-wide flex items-center group"
                        >
                          View Email <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
                {(!emailData?.priority_ranking || emailData.priority_ranking.length === 0) && isFetching && (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 text-[#A1A1AA] animate-spin" />
                  </div>
                )}
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* SECOND ROW: Full Width Summaries */}
      {emailData && sortedEmails.length > 0 && (
        <section className="animate-in slide-in-from-bottom-8 duration-500 delay-150">
          <h2 className="text-2xl font-bold text-[#EAEAEA] mb-6 border-b border-[#1F1F22] pb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#8B5CF6]" /> Email Summaries
          </h2>
          
          <div className="grid grid-cols-1 gap-8">
            {sortedEmails.map((email: any, i: number) => {
              const priority = email.classification?.importance?.toLowerCase() || 'medium';
              const isHigh = priority === 'high';
              const isMedium = priority === 'medium';
              const isLow = priority === 'low';
              
              const color = isHigh ? "text-red-300 bg-red-500/20 border-red-500/30" 
                          : isMedium ? "text-amber-300 bg-amber-500/15 border-amber-500/25" 
                          : isLow ? "text-emerald-300 bg-emerald-500/15 border-emerald-500/25"
                          : "text-zinc-400 bg-white/5 border-white/10";

              // Try to find a deadline inside the summary
              // A very simple look-around for the word deadline or an explicit date
              const deadlineMatch = email.summary?.match(/(?:deadline.*?(is|:|for)?\s*\*?([^.*]*?\\d{1,2}:?\\d{2}\\s*(?:am|pm).*?)\*?)/i);
              const deadlinePill = deadlineMatch ? deadlineMatch[2].replace(/[*]*/g, '').trim() : null;

              return (
                <GlassCard key={i} className="p-4 sm:p-5 flex flex-col gap-4 relative overflow-hidden group bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  {/* Priority Accent */}
                  {isHigh && <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 via-red-500/30 to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />}
                  
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                       <div className="flex items-center gap-2 mb-2">
                         <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-widest", color)}>{priority}</span>
                         {deadlinePill && (
                           <span className="px-2.5 py-1 rounded-md text-[10px] font-bold border border-orange-500/40 bg-orange-500/15 text-orange-300 uppercase tracking-widest flex items-center gap-1.5">
                             <Clock className="w-3 h-3" /> {deadlinePill}
                           </span>
                         )}
                       </div>
                       <h3 className="text-lg sm:text-xl font-bold text-[#EAEAEA] mb-1">{email.subject}</h3>
                       <p className="text-xs text-[#A1A1AA]">
                         From: <strong className="text-[#E5E5E5] font-semibold">{email.sender}</strong>
                       </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Button 
                        onClick={() => window.open(email.mail_link, '_blank')}
                        size="sm" 
                        className="bg-gradient-to-br from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-700/40 hover:shadow-emerald-600/50 hover:scale-105 transition-all duration-200 h-10 px-4 group"
                      >
                        View Email <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      {email.calendar_link && (
                        <Button 
                          onClick={() => window.open(email.calendar_link, '_blank')}
                          variant="outline" 
                          size="sm" 
                          className="border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/15 hover:text-blue-200 transition-all duration-200 hover:scale-103 h-10 px-4 group w-full"
                          title="View in Calendar"
                        >
                          <Calendar className="w-4 h-4 mr-2" /> Calendar
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Summary Content */}
                  <div className="w-full">
                    <div 
                      className="text-base font-normal text-zinc-300 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatAIContent(email.summary) || "No summary available." }}
                    />
                  </div>

                  {/* Documents */}
                  {email.document_detected && email.attachments?.length > 0 && (
                    <div className="mt-3 space-y-3 pt-4 border-t border-white/5">
                      <h4 className="text-xs font-semibold text-purple-300 flex items-center gap-2 uppercase tracking-widest pl-3 border-l-3 border-purple-600/60">
                        <FileText className="w-3 h-3"/> Attached Documents
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {email.attachments.map((att: any, attIdx: number) => (
                          <div key={attIdx} className="bg-white/[0.02] p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200">
                            <p className="text-sm font-semibold text-white mb-2">{att.filename}</p>
                            <div 
                              className="text-sm text-[#A1A1AA] font-normal leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: formatAIContent(att.summary) || "" }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </GlassCard>
              )
            })}
          </div>
        </section>
      )}

      {/* THIRD ROW: Meetings Block */}
      {emailData && emailData.meetings_detected && emailData.meetings_detected.length > 0 && (
        <section className="animate-in slide-in-from-bottom-8 duration-500 delay-300 pt-8">
          <h2 className="text-2xl font-bold text-[#EAEAEA] mb-6 border-b border-[#1F1F22] pb-4 flex items-center gap-2">
            <Video className="w-6 h-6 text-[#3B82F6]" /> Extracted Meetings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {emailData.meetings_detected.map((mtg: any, i: number) => (
              <GlassCard key={i} className="p-5 flex flex-col h-full bg-white/[0.02] backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300 group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4 text-[#3B82F6]" />
                  </div>
                  <div className="mt-0.5">
                    <h3 className="font-semibold text-base text-[#EAEAEA] group-hover:text-white transition-colors">{mtg.title}</h3>
                    {mtg.reason && <p className="text-xs text-[#A1A1AA] mt-1 line-clamp-2 leading-relaxed">{mtg.reason}</p>}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-[#D4D4D8] mt-auto">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="flex items-center gap-2 text-[#A1A1AA]"><Calendar className="w-4 h-4" /> Date</span>
                    <span className="text-[#EAEAEA] font-semibold">{mtg.date || "TBD"}</span>
                  </div>
                  
                  {mtg.time && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0A0A] border border-[#1F1F22]">
                      <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Time</span>
                      <span className="text-[#EAEAEA] font-medium">{mtg.time}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 mt-6">
                  {mtg.meeting_link && mtg.meeting_link !== "N/A" && (
                     <Button 
                       onClick={() => window.open(mtg.meeting_link, '_blank')} 
                       className="w-full bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#050505]"
                     >
                       <ExternalLink className="w-4 h-4 mr-2" /> Join Meeting
                     </Button>
                  )}
                  {mtg.calendar_link && (
                     <Button 
                       variant="outline"
                       onClick={() => window.open(mtg.calendar_link, '_blank')} 
                       className="w-full border-[#2A2A2E] hover:bg-[#111111] text-[#EAEAEA]"
                     >
                       <Calendar className="w-4 h-4 mr-2" /> View in Calendar
                     </Button>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
