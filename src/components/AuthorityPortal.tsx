import React, { useState } from "react";
import {
  Building2,
  Check,
  X,
  Play,
  CheckCircle,
  Search,
  MapPin,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Phone,
  User,
  ShieldAlert,
  Clock,
  Loader2,
  Camera,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Upload,
  Trophy,
  ExternalLink,
  ArrowUpDown
} from "lucide-react";
import { Issue, User as UserType, Category } from "../types";
import DoughnutChart from "./DoughnutChart";

interface AuthorityPortalProps {
  currentUser: UserType;
  issues: Issue[];
  users?: UserType[];
  onRefreshIssues: () => void;
  onRefreshUsers: () => void;
}


// Helper component to render media (images or videos)
const renderMedia = (url: string | null, className: string = "w-full aspect-video object-cover rounded-lg border") => {
  if (!url) return null;
  const isVideo = url.startsWith("data:video/") || url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".ogg") || url.includes("video") || url.startsWith("blob:");
  if (isVideo) {
    return <video src={url} controls className={className} />;
  }
  return <img src={url} className={className} alt="Media evidence" />;
};

export default function AuthorityPortal({
  currentUser,
  issues,
  users = [],
  onRefreshIssues,
  onRefreshUsers
}: AuthorityPortalProps) {

  // Feature module state (track, leaderboard, or null for dashboard)
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  // Filtering & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"upvotes_desc" | "downvotes_desc">("upvotes_desc");
  const [leaderboardSearch, setLeaderboardSearch] = useState("");

  // Status Action Modal states
  const [activeResolveIssueId, setActiveResolveIssueId] = useState<string | null>(null);
  const [resolvedNote, setResolvedNote] = useState("");
  const [resolvedPhoto, setResolvedPhoto] = useState("");
  const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);
  const [actionError, setActionError] = useState("");

  // Rejection modal states
  const [activeRejectIssueId, setActiveRejectIssueId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Process global statistics for Doughnut
  const totalCount = issues.length;
  const submittedCount = issues.filter((i) => i.status === "submitted").length;
  const acceptedCount = issues.filter((i) => i.status === "accepted").length;
  const inProgressCount = issues.filter((i) => i.status === "in_progress").length;
  const waitingCount = issues.filter((i) => i.status === "waiting_verification").length;
  const resolvedCount = issues.filter((i) => i.status === "resolved").length;
  const rejectedCount = issues.filter((i) => i.status === "rejected").length;

  const chartData = [
    { label: "New (Submitted)", count: submittedCount, color: "#3B82F6", statusKey: "submitted" },
    { label: "Accepted Problems", count: acceptedCount, color: "#8B5CF6", statusKey: "accepted" },
    { label: "In Progress Problems", count: inProgressCount, color: "#F59E0B", statusKey: "in_progress" },
    { label: "Waiting Verification", count: waitingCount, color: "#F97316", statusKey: "waiting_verification" },
    { label: "Resolved Problems", count: resolvedCount, color: "#10B981", statusKey: "resolved" },
    { label: "Rejected Problems", count: rejectedCount, color: "#EF4444", statusKey: "rejected" }
  ];

  // Primary status transition handlers
  const handleUpdateStatus = async (issueId: string, status: string, additional = {}) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...additional }),
      });

      if (response.ok) {
        onRefreshIssues();
        onRefreshUsers(); // refresh leaderboard scores
        setActiveResolveIssueId(null);
        setResolvedNote("");
        setResolvedPhoto("");
        setActionError("");
      } else {
        const errData = await response.json();
        setActionError(errData.error || "Failed to update status.");
      }
    } catch (err) {
      setActionError("Server error. Cannot connect to authority endpoint.");
    }
  };

  // Convert uploaded image to base64 with 5MB validation
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
      if (file.size > MAX_SIZE) {
        alert("File size exceeds 5MB limit. Please upload a smaller photo or video.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setResolvedPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResolveIssueId || !resolvedPhoto || !resolvedNote) return;

    setIsSubmittingResolve(true);
    await handleUpdateStatus(activeResolveIssueId, "resolved", {
      resolvedPhotoUrl: resolvedPhoto,
      resolvedNote: resolvedNote
    });
    setIsSubmittingResolve(false);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRejectIssueId || !rejectionNote.trim()) return;
    setIsSubmittingReject(true);
    await handleUpdateStatus(activeRejectIssueId, "rejected", { resolvedNote: rejectionNote });
    setActiveRejectIssueId(null);
    setRejectionNote("");
    setIsSubmittingReject(false);
  };

  // Filter & sort issues list
  const processedIssues = issues
    .filter((issue) => {
      const lowerSearch = searchQuery.toLowerCase();
      const matchesSearch =
        (issue.title || "").toLowerCase().includes(lowerSearch) ||
        (issue.location?.area || "").toLowerCase().includes(lowerSearch) ||
        (issue.location?.city || "").toLowerCase().includes(lowerSearch) ||
        (issue.location?.state || "").toLowerCase().includes(lowerSearch) ||
        (issue.location?.district || "").toLowerCase().includes(lowerSearch) ||
        (issue.location?.pincode || "").toLowerCase().includes(lowerSearch) ||
        (issue.citizenName || "").toLowerCase().includes(lowerSearch);
      const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || issue.category === categoryFilter;
      const matchesRisk = riskFilter === "all" || issue.risk === riskFilter;
      return matchesSearch && matchesStatus && matchesCategory && matchesRisk;
    })
    .sort((a, b) => {
      if (sortOrder === "downvotes_desc") {
        return b.downvotes.length - a.downvotes.length;
      }
      return b.upvotes.length - a.upvotes.length;
    });

  // Find the selected issue if activeResolveIssueId is set
  const selectedIssueForResolve = activeResolveIssueId
    ? issues.find((i) => i.id === activeResolveIssueId)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">

      {/* Rejection Note Modal Overlay */}
      {activeRejectIssueId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-rose-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <X className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Reject Issue — Reason Required</h3>
                <p className="text-xs text-slate-600 mt-0.5">Explain why this issue is being rejected so the citizen understands.</p>
              </div>
            </div>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. This complaint falls outside our municipal jurisdiction. Please contact the State Highway Authority for road issues on national highways. Or: Insufficient proof provided — photo does not match the described location."
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-rose-400 outline-none text-slate-800 font-medium bg-slate-50 shadow-sm resize-none"
                />
              </div>
              {actionError && <p className="text-xs text-rose-600 font-semibold">{actionError}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setActiveRejectIssueId(null); setRejectionNote(""); setActionError(""); }}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReject || !rejectionNote.trim()}
                  className="flex-[2] py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingReject ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</>
                  ) : (
                    <><X className="w-3.5 h-3.5" /> Confirm Rejection</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Admin Title Bar */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Municipal Command Center</h2>
            <span className="bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              Administration
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Logged in as: <strong className="text-violet-600">{currentUser.name}</strong> ({currentUser.phone}). Monitor overall complaints and execute resolutions.
          </p>
        </div>
        <div className="p-3 bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-xl flex items-center gap-3 shrink-0">
          <Building2 className="w-5 h-5 text-violet-600" />
          <div className="text-xs">
            <p className="font-bold text-slate-800">State Civic Node</p>
            <p className="text-slate-600 text-[10px] mt-0.5">🟢 Online • Syncing Real-Time</p>
          </div>
        </div>
      </div>

      {/* RENDER VIEW 1: RESOLUTION REDIRECT PAGE */}
      {activeResolveIssueId !== null && selectedIssueForResolve ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-6 sm:p-8 animate-fadeIn mb-12">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 mb-6 gap-4">
            <div>
              <span className="text-xs text-amber-600 font-bold tracking-widest uppercase mb-1 block">RESOLUTION SUBMISSION GATEWAY</span>
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Camera className="w-6 h-6 text-amber-600" />
                Submit Resolution Proof: Issue #{selectedIssueForResolve.id}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                You are redirected to the dedicated resolution page for: <strong className="text-slate-800">"{selectedIssueForResolve.title}"</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveResolveIssueId(null)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Cancel & Go Back
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Column: Complaint Details */}
            <div className="lg:col-span-5 space-y-5">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Issue Overview</span>
                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                  <img src={selectedIssueForResolve.photoUrl} alt={selectedIssueForResolve.title} className="w-full h-full object-cover" />
                  <span className="absolute bottom-3 left-3 bg-blue-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                    {selectedIssueForResolve.category}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{selectedIssueForResolve.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    {selectedIssueForResolve.location?.area || "N/A"}, {selectedIssueForResolve.location?.city || "N/A"}, PIN: {selectedIssueForResolve.location?.pincode || "N/A"}
                  </p>
                  {selectedIssueForResolve.location?.latitude && selectedIssueForResolve.location?.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${selectedIssueForResolve.location.latitude},${selectedIssueForResolve.location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline transition-all"
                    >
                      <ExternalLink className="w-3 h-3" />
                      📍 View Exact Location on Map
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/50 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-600 uppercase font-bold block">Filing Date</span>
                    <span className="font-semibold text-slate-700">{new Date(selectedIssueForResolve.raisedDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-600 uppercase font-bold block">Risk Priority</span>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${selectedIssueForResolve.risk === "low" ? "bg-slate-100 text-slate-600" :
                      selectedIssueForResolve.risk === "moderate" ? "bg-amber-100 text-amber-700" :
                        selectedIssueForResolve.risk === "high" ? "bg-orange-100 text-orange-700" :
                          "bg-rose-100 text-rose-700"
                      }`}>
                      {selectedIssueForResolve.risk}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/50 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-600 uppercase font-bold block">Citizen Name</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-600" />
                      {selectedIssueForResolve.citizenName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-600 uppercase font-bold block">Citizen Contact</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-600" />
                      +91 {selectedIssueForResolve.citizenPhone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description box */}
              <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-xl text-xs space-y-2">
                <div>
                  <h5 className="text-[10px] text-blue-700 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Translated Summary
                  </h5>
                  <p className="text-slate-700 font-semibold leading-relaxed mt-0.5">
                    "{selectedIssueForResolve.translatedDescription}"
                  </p>
                </div>
                {selectedIssueForResolve.description !== selectedIssueForResolve.translatedDescription && (
                  <div className="border-t border-blue-100/60 pt-2">
                    <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Original Native Language Complaint
                    </h5>
                    <p className="text-slate-600 font-medium leading-relaxed italic mt-0.5">
                      "{selectedIssueForResolve.description}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Resolution Proof Form */}
            <form onSubmit={handleResolveSubmit} className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">

              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">1. Evidence Document Upload</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Provide real, unedited evidence photos of the resolved asset to convince community voters.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Proof Photo Selector - Full Width */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                      Proof Photo Upload <span className="text-rose-500">*</span>
                    </label>

                    {resolvedPhoto ? (
                      <div className="relative rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-950 flex items-center justify-center">
                        {renderMedia(resolvedPhoto, "max-w-full max-h-full object-contain")}
                        <button
                          type="button"
                          onClick={() => setResolvedPhoto("")}
                          className="absolute top-2 right-2 p-1 bg-slate-900/80 text-white rounded hover:bg-rose-600 cursor-pointer z-10"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border-2 border-dashed border-slate-200 hover:bg-slate-50 transition-all text-center aspect-video">
                        <Upload className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="text-[12px] text-slate-600 font-bold">Upload Fix Proof Photo / Video</p>
                        <p className="text-[10px] text-slate-600 mt-1">Real, unedited evidence of resolved work. PNG, JPG, MP4, WEBM (Max: 5MB)</p>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="proof-photo-upload-redirected"
                        />
                        <label
                          htmlFor="proof-photo-upload-redirected"
                          className="mt-3 px-3.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] font-bold text-amber-700 shadow-sm hover:bg-amber-100 cursor-pointer"
                        >
                          ðŸ“ Browse & Upload Photo / Video
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/50">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                      Resolution Note (Details of work done) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="e.g. Cleaned up the waste pile using local municipal loaders. Coordinated with Sanitation Wing to schedule daily early morning garbage pickup to prevent recurring blockages."
                      value={resolvedNote}
                      onChange={(e) => setResolvedNote(e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-200 text-xs focus:border-blue-500 outline-none text-slate-800 font-medium bg-white shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/50 space-y-3">
                {actionError && <p className="text-xs text-rose-600 font-semibold">{actionError}</p>}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveResolveIssueId(null)}
                    className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-100 transition-all cursor-pointer shadow-sm flex-1 text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingResolve || !resolvedPhoto || !resolvedNote}
                    className="py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-[2]"
                  >
                    {isSubmittingResolve ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Publishing Resolution Proof...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Publish & Submit Proof
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>

          </div>

        </div>
      ) : activeFeature === null ? (
        <>
          {/* Analytics Doughnut Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="bg-gradient-to-br from-violet-900 via-indigo-900 to-purple-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[60%] bg-violet-500/20 rounded-full blur-[40px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[40%] bg-indigo-400/10 rounded-full blur-[30px] pointer-events-none" />
                <div>
                  <span className="text-[10px] bg-white/10 text-slate-200 font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/10">Overall Analytics</span>
                  <h3 className="text-2xl font-extrabold tracking-tight mt-3">City Wide Complaint Metrics</h3>
                  <p className="text-xs text-slate-300 mt-2 max-w-md">
                    This dashboard lists all public grievances filed across your administrative jurisdiction. Issues are automatically prioritized based on community votes to ensure critical areas are fixed first.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6 border-t border-white/10 pt-4">
                  <div>
                    <span className="text-xs text-slate-600">Total Registered</span>
                    <p className="text-2xl font-black mt-0.5 text-violet-300">{totalCount}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-600">Needs Work</span>
                    <p className="text-2xl font-black text-amber-400 mt-0.5">{submittedCount + acceptedCount + inProgressCount}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-600">Verifying/Resolved</span>
                    <p className="text-2xl font-black text-emerald-400 mt-0.5">{waitingCount + resolvedCount}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <DoughnutChart data={chartData} centerLabel="Overall Issues" />
            </div>
          </div>

          {/* Main Features Selection Grid */}
          <div className="mb-10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-4">Core Administrative Modules</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Feature 1: Track All Issues */}
              <button
                onClick={() => setActiveFeature("track")}
                className="p-6 rounded-2xl text-left border transition-all duration-300 cursor-pointer bg-gradient-to-br from-violet-50 to-indigo-50 hover:from-violet-100 hover:to-indigo-100 border-violet-100 shadow-sm hover:border-violet-300 hover:shadow-lg group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">1. Track All Issues</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Monitor the queue of grievances. Filter complaints, accept problems, commence work and upload action proofs of work to verify closure with citizens.
                </p>
              </button>

              {/* Feature 2: Leaderboard */}
              <button
                onClick={() => setActiveFeature("leaderboard")}
                className="p-6 rounded-2xl text-left border transition-all duration-300 cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-100 shadow-sm hover:border-purple-300 hover:shadow-lg group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                  <Trophy className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">2. Civic Leaderboard</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Review the leaderboards to view active top citizen standings, points allocation, and full details of user registry and mobile number contact records.
                </p>
              </button>

            </div>
          </div>
        </>
      ) : activeFeature === "track" ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-md p-6 sm:p-8 animate-fadeIn mb-12">

          {/* Header of Active Feature */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 mb-6 gap-4">
            <div>
              <span className="text-xs text-blue-600 font-bold tracking-widest uppercase mb-1 block">ADMINISTRATIVE MODULE REDIRECTED PAGE</span>
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-600" />
                1. Track All Municipal Issues
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Monitor complaints queue, prioritize by upvotes, and take action.
              </p>
            </div>
            <button
              onClick={() => setActiveFeature(null)}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow"
            >
              â† Back to Dashboard
            </button>
          </div>

          {/* Queue Filter Controls */}
          <div className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="sm:col-span-3 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="text"
                  placeholder="Search by title, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-slate-200 text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">New (Submitted)</option>
                  <option value="accepted">Accepted Problems</option>
                  <option value="in_progress">In Progress Problems</option>
                  <option value="waiting_verification">Waiting Verification</option>
                  <option value="resolved">Resolved Problems</option>
                  <option value="rejected">Rejected Problems</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full p-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="Road Problem">Road Problem</option>
                  <option value="Garbage Issue">Garbage Issue</option>
                  <option value="Water Related">Water Related</option>
                  <option value="Sewage & Drainage">Sewage & Drainage</option>
                  <option value="Streetlight Failure">Streetlight Failure</option>
                  <option value="Electricity Outage">Electricity Outage</option>
                  <option value="Public Health & Hygiene">Public Health & Hygiene</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="w-full p-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 outline-none"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low Priority</option>
                  <option value="moderate">Moderate Priority</option>
                  <option value="high">High Priority</option>
                  <option value="emergency">Emergency Priority</option>
                </select>
              </div>

              <div className="sm:col-span-1">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "upvotes_desc" | "downvotes_desc")}
                  className="w-full p-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 outline-none"
                >
                  <option value="upvotes_desc">↑ Most Upvoted</option>
                  <option value="downvotes_desc">↓ Most Downvoted</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Problems Queue List */}
          {issues.length === 0 ? (
            <div className="bg-white border border-slate-200 p-12 text-center rounded-2xl flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              <p className="text-slate-600 font-medium text-sm">Loading issues from Firebase...</p>
              <p className="text-slate-400 text-xs">Please wait while civic data is synced.</p>
            </div>
          ) : processedIssues.length === 0 ? (
            <div className="bg-white border border-slate-200 p-8 text-center rounded-2xl">
              <p className="text-slate-600 font-medium text-sm">No complaints found matching current filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {processedIssues.map((issue) => {
                const upvoteWeight = issue.upvotes.length - issue.downvotes.length;
                const hasVerifyAction = issue.status === "waiting_verification";

                return (
                  <div key={issue.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">

                    {/* Header element */}
                    <div>

                      {/* Aspect ratio photo display */}
                      <div className="relative aspect-video bg-slate-100">
                        <div className="w-full h-full object-cover">
                          {renderMedia(issue.photoUrl, "w-full h-full object-cover")}
                        </div>
                        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shadow ${issue.status === "submitted" ? "bg-blue-600 text-white animate-pulse" :
                            issue.status === "accepted" ? "bg-purple-600 text-white" :
                              issue.status === "in_progress" ? "bg-amber-500 text-white" :
                                issue.status === "waiting_verification" ? "bg-orange-500 text-white animate-pulse" :
                                  issue.status === "resolved" ? "bg-emerald-600 text-white" :
                                    "bg-rose-600 text-white"
                            }`}>
                            {issue.status.replace("_", " ")}
                          </span>
                          <span className="bg-slate-900/80 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                            {issue.category}
                          </span>
                        </div>

                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                          <div className="bg-emerald-600 text-white px-2.5 py-1 rounded-full text-[11px] font-black shadow-lg flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3 fill-current" />
                            <span>{issue.upvotes.length}</span>
                          </div>
                          <div className="bg-rose-600 text-white px-2.5 py-1 rounded-full text-[11px] font-black shadow-lg flex items-center gap-1">
                            <ThumbsDown className="w-3 h-3 fill-current" />
                            <span>{issue.downvotes.length}</span>
                          </div>
                        </div>
                      </div>

                      {/* Body Content */}
                      <div className="p-5">

                        {/* Citizen identifiers display */}
                        <div className="flex justify-between items-start gap-4 pb-3 border-b border-slate-100">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Raised By</span>
                            <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-600" />
                              {issue.citizenName}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Contact Identifier</span>
                            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1 justify-end">
                              <Phone className="w-3 h-3 text-slate-600" />
                              +91 {issue.citizenPhone}
                            </p>
                          </div>
                        </div>

                        {/* Complaint details */}
                        <div className="mt-4">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{issue.title}</h4>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${issue.risk === "low" ? "bg-slate-100 text-slate-600" :
                              issue.risk === "moderate" ? "bg-amber-100 text-amber-700" :
                                issue.risk === "high" ? "bg-orange-100 text-orange-700" :
                                  "bg-rose-100 text-rose-700"
                              }`}>
                              {issue.risk} risk
                            </span>
                          </div>

                          <div className="flex items-center gap-1 mt-1.5 text-slate-600 text-[11px] font-semibold">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{issue.location?.area || "N/A"}, {issue.location?.city || "N/A"}, PIN: {issue.location?.pincode || "N/A"}</span>
                          </div>
                          {issue.location?.latitude && issue.location?.longitude && (
                            <a
                              href={`https://www.google.com/maps?q=${issue.location.latitude},${issue.location.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline transition-all"
                            >
                              <ExternalLink className="w-3 h-3" />
                              📍 View on Google Maps
                            </a>
                          )}

                          {/* Original vs AI Translated Description block */}
                          <div className="mt-3.5 p-3 rounded-lg bg-blue-50/40 border border-blue-100 text-xs space-y-2.5">
                            {issue.description !== issue.translatedDescription ? (
                              <>
                                <div>
                                  <h5 className="text-[10px] text-blue-700 font-bold uppercase tracking-wider flex items-center gap-1 mb-0.5">
                                    <Sparkles className="w-3 h-3" />
                                    AI English Translation & Summary
                                  </h5>
                                  <p className="text-slate-700 font-semibold leading-relaxed">
                                    "{issue.translatedDescription}"
                                  </p>
                                </div>
                                <div className="border-t border-blue-100/60 pt-2">
                                  <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                                    Original Citizen Input Description (User's Native Language)
                                  </h5>
                                  <p className="text-slate-600 font-medium leading-relaxed italic">
                                    "{issue.description}"
                                  </p>
                                </div>
                              </>
                            ) : (
                              <div>
                                <h5 className="text-[10px] text-blue-700 font-bold uppercase tracking-wider flex items-center gap-1 mb-0.5">
                                  <Sparkles className="w-3 h-3" />
                                  Citizen Complaint Description
                                </h5>
                                <p className="text-slate-700 font-semibold leading-relaxed">
                                  "{issue.description}"
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Verification split layout */}
                        {hasVerifyAction && issue.resolvedPhotoUrl && (
                          <div className="mt-4 p-3 bg-orange-50/50 border border-orange-100 rounded-xl text-xs space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-orange-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 animate-spin" />
                                Community Verification Loop Active
                              </span>
                              <span className="text-[10px] text-slate-600">Raised: {new Date(issue.raisedDate).toLocaleDateString()}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[9px] text-slate-600 block mb-1 uppercase font-bold">Initial Fault</span>
                                <div className="w-full h-16 overflow-hidden rounded border border-slate-200">
                                  {renderMedia(issue.photoUrl, "w-full h-full object-cover")}
                                </div>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-600 block mb-1 uppercase font-bold">Your Resolved Proof</span>
                                <div className="w-full h-16 overflow-hidden rounded border border-emerald-200">
                                  {renderMedia(issue.resolvedPhotoUrl, "w-full h-full object-cover")}
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-orange-200/50 flex justify-between items-center">
                              <div>
                                <p className="text-[10px] text-slate-400 font-bold">Resolution Summary:</p>
                                <p className="text-[11px] text-slate-700 italic mt-0.5">"{issue.resolvedNote}"</p>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-orange-200/50 flex justify-between text-xs font-bold text-slate-600">
                              <span className="text-emerald-700 flex items-center gap-1">
                                <ThumbsUp className="w-3.5 h-3.5" />
                                Upvotes confirming: {issue.verificationUpvotes.length} / 5
                              </span>
                              <span className="text-rose-700 flex items-center gap-1">
                                <ThumbsDown className="w-3.5 h-3.5" />
                                Downvotes disputes: {issue.verificationDownvotes.length} / 5
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Resolved / Rejected status detail */}
                        {(issue.status === "resolved" || issue.status === "rejected") && (
                          <div className={`mt-4 p-3 rounded-lg text-xs border ${issue.status === "rejected"
                            ? "bg-rose-50 border-rose-100"
                            : "bg-emerald-50 border-emerald-100"
                            }`}>
                            <div className={`flex items-center gap-1 font-bold uppercase tracking-wider mb-1 ${issue.status === "rejected" ? "text-rose-700" : "text-emerald-700"
                              }`}>
                              {issue.status === "rejected" ? (
                                <><X className="w-4 h-4" /> Rejection Details</>
                              ) : (
                                <><CheckCircle className="w-4 h-4" /> Resolved Ticket Details</>
                              )}
                            </div>
                            {issue.status === "resolved" && issue.resolvedPhotoUrl && (
                              <div className="mb-2">
                                {renderMedia(issue.resolvedPhotoUrl, "w-full aspect-video object-cover rounded-lg border border-emerald-200")}
                              </div>
                            )}
                            {issue.resolvedNote && <p className={`mt-1.5 italic font-medium text-xs ${issue.status === "rejected" ? "text-rose-800" : "text-emerald-800"
                              }`}>"{issue.resolvedNote}"</p>}
                            {issue.resolvedDate && (
                              <p className="text-[10px] text-slate-600 mt-1 font-semibold">
                                Date of Closure: {new Date(issue.resolvedDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Primary CTA panel for municipal action */}
                    <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-600 font-semibold uppercase">
                        Admin Actions
                      </span>

                      <div className="flex gap-2">

                        {issue.status === "submitted" && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(issue.id, "accepted")}
                              className="px-3.5 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Accept Issue (+pts)
                            </button>
                            <button
                              onClick={() => { setActiveRejectIssueId(issue.id); setActionError(""); }}
                              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </>
                        )}

                        {issue.status === "accepted" && (
                          <button
                            onClick={() => handleUpdateStatus(issue.id, "in_progress")}
                            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Commence Work (In-Progress)
                          </button>
                        )}

                        {issue.status === "in_progress" && (
                          <button
                            onClick={() => {
                              setActiveResolveIssueId(issue.id);
                              setResolvedNote("");
                              setResolvedPhoto("");
                            }}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Upload Fix Proof (Resolve)
                          </button>
                        )}

                        {hasVerifyAction && (
                          <div className="text-xs text-orange-700 font-bold bg-orange-100/50 border border-orange-100 px-3 py-1 rounded-lg">
                            Community Voting Active
                          </div>
                        )}

                        {(issue.status === "resolved" || issue.status === "rejected") && (
                          <div className="text-xs text-slate-600 font-bold bg-slate-200/50 px-3 py-1 rounded-lg">
                            Final Status Locked
                          </div>
                        )}

                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeFeature === "leaderboard" ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-md p-6 sm:p-8 animate-fadeIn mb-12">

          {/* Header of Active Feature */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 mb-6 gap-4">
            <div>
              <span className="text-xs text-purple-600 font-bold tracking-widest uppercase mb-1 block">ADMINISTRATIVE AUDIT VIEW</span>
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-purple-600" />
                2. JantaMitra Civic Leaderboard & Registry
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Inspect top citizens contributing to municipal improvements with full registry data.
              </p>
            </div>
            <button
              onClick={() => setActiveFeature(null)}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow"
            >
              â† Back to Dashboard
            </button>
          </div>

          <div className="mb-6 bg-purple-50 border border-purple-100 rounded-xl p-4 flex gap-3.5 items-start">
            <div className="p-2 bg-purple-600 text-white rounded-lg shrink-0">
              <Trophy className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-purple-900">Administrative Standings Oversight</h4>
              <p className="text-xs text-purple-700 leading-relaxed mt-1">
                Under municipal directives, active citizen scores are registered below. Citizens receive JantaPoints immediately when an issue is <strong className="text-purple-900">Accepted</strong> by your ward office. To verify citizen accounts or contact top contributors for local development committees, their <strong className="text-purple-950 font-bold">Unmasked Mobile Phone Numbers</strong> are disclosed below for administrative use.
              </p>
            </div>
          </div>

          {/* Leaderboard Table Search */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="text"
              placeholder="Search citizen standings by name or phone..."
              value={leaderboardSearch}
              onChange={(e) => setLeaderboardSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-slate-200 text-xs focus:border-blue-500 outline-none"
            />
          </div>

          {/* Leaderboard Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-4 py-3">Rank</th>
                    <th className="p-4 py-3">Citizen Name</th>
                    <th className="p-4 py-3">Unmasked Mobile Number</th>
                    <th className="p-4 py-3 text-center">Accepted Issues</th>
                    <th className="p-4 py-3 text-right">JantaPoints</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {(() => {
                    const sorted = [...users].sort((a, b) => b.points - a.points);
                    const ranked: any[] = [];
                    for (let i = 0; i < sorted.length; i++) {
                      const rank = i === 0 ? 1 : (sorted[i].points === ranked[i - 1].points ? ranked[i - 1].globalRank : ranked[i - 1].globalRank + 1);
                      ranked.push({ ...sorted[i], globalRank: rank });
                    }
                    return ranked
                      .filter((usr) => usr.points > 0)
                      .filter((usr) =>
                        usr.name.toLowerCase().includes(leaderboardSearch.toLowerCase()) ||
                        usr.phone.includes(leaderboardSearch)
                      )
                      .map((usr) => (
                        <tr key={usr.phone} className="hover:bg-slate-50 transition-all duration-200">
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              {usr.globalRank === 1 && <span className="text-xs font-black text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded">1st</span>}
                              {usr.globalRank === 2 && <span className="text-xs font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">2nd</span>}
                              {usr.globalRank === 3 && <span className="text-xs font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">3rd</span>}
                              <span className="font-mono text-slate-600">#{usr.globalRank}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-slate-800 font-bold">{usr.name}</span>
                          </td>
                          <td className="p-4 font-mono text-slate-600 font-semibold">
                            +91 {usr.phone}
                          </td>
                          <td className="p-4 text-center text-slate-600 font-bold">
                            {usr.acceptedCount}
                          </td>
                          <td className="p-4 text-right">
                            <span className="font-mono font-black text-slate-800 text-sm">{usr.points}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">pts</span>
                          </td>
                        </tr>
                      ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : null}

    </div>
  );
}


