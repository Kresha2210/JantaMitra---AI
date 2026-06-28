import React, { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  Compass,
  Trophy,
  Upload,
  MapPin,
  Mic,
  Search,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Send,
  Loader2,
  Trash2,
  Lock,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  Calendar,
  ArrowLeft
} from "lucide-react";
import { Issue, User, Location, Category } from "../types";
import DoughnutChart from "./DoughnutChart";

interface CitizenPortalProps {
  currentUser: User;
  issues: Issue[];
  users: User[];
  onRefreshIssues: () => void;
  onRefreshUsers: () => void;
}

// Preset Indian Address coordinates
const PRESET_INDIAN_ADDRESSES: Location[] = [
  { area: "Colaba Causeway near Taj", city: "Mumbai", district: "Mumbai City", pincode: "400005", state: "Maharashtra", latitude: 18.9261, longitude: 72.8224 },
  { area: "M G Road Walkway", city: "Bengaluru", district: "Bengaluru Urban", pincode: "560001", state: "Karnataka", latitude: 12.9716, longitude: 77.5946 },
  { area: "F C Road near Deccan", city: "Pune", district: "Pune", pincode: "411004", state: "Maharashtra", latitude: 18.5204, longitude: 73.8567 },
  { area: "Rajouri Garden Block D", city: "New Delhi", district: "West Delhi", pincode: "110027", state: "Delhi", latitude: 28.6448, longitude: 77.1902 },
  { area: "Salt Lake City Sector 5", city: "Kolkata", district: "North 24 Parganas", pincode: "700091", state: "West Bengal", latitude: 22.5726, longitude: 88.4233 },
  { area: "T Nagar Shopping Area", city: "Chennai", district: "Chennai District", pincode: "600017", state: "Tamil Nadu", latitude: 13.0405, longitude: 80.2337 },
  { area: "Gachibowli Tech Circle", city: "Hyderabad", district: "Rangareddy", pincode: "500032", state: "Telangana", latitude: 17.4483, longitude: 78.3741 }
];

// Preset Civic Issue Images for ease of manual testing
const ISSUE_PRESET_IMAGES = [
  {
    name: "Broken Road / Potholes",
    url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
    category: "Road Problem"
  },
  {
    name: "Unmanaged Garbage Accumulation",
    url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600",
    category: "Garbage Issue"
  },
  {
    name: "Water Main Leakage",
    url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600",
    category: "Water Related"
  },
  {
    name: "Open Manhole / Clogged Drain",
    url: "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&q=80&w=600",
    category: "Sewage & Drainage"
  },
  {
    name: "Dark Street / Broken Light",
    url: "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&q=80&w=600",
    category: "Streetlight Failure"
  }
];

// Helper component to render media (images or videos)
const renderMedia = (url: string | null, className: string = "w-full aspect-video object-cover rounded-lg border") => {
  if (!url) return null;
  const isVideo = url.startsWith("data:video/") || url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".ogg") || url.includes("video") || url.startsWith("blob:");
  if (isVideo) {
    return <video src={url} controls className={className} />;
  }
  return <img src={url} className={className} alt="Media evidence" />;
};

export default function CitizenPortal({
  currentUser,
  issues,
  users,
  onRefreshIssues,
  onRefreshUsers
}: CitizenPortalProps) {
  
  // Dashboard states
  const [activeFeature, setActiveFeature] = useState<"raise" | "track" | "nearby" | "leaderboard" | null>(null);

  // --- FEATURE 1: RAISE ISSUE FORM STATES ---
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDesc, setIssueDesc] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "">("");
  const [photoUrl, setPhotoUrl] = useState("");
  
  // Custom manual location fields (user can type or GPS will autofill)
  const [areaInput, setAreaInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [districtInput, setDistrictInput] = useState("");
  const [pincodeInput, setPincodeInput] = useState("");
  const [stateInput, setStateInput] = useState("");
  const [latVal, setLatVal] = useState<number>(20.5937);
  const [lngVal, setLngVal] = useState<number>(78.9629);
  const [locationFetchedAlert, setLocationFetchedAlert] = useState(false);
  const [isVirtualGPSUsed, setIsVirtualGPSUsed] = useState(false);

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationPreview, setTranslationPreview] = useState("");

  const handleTranslateText = async () => {
    if (!issueDesc.trim()) return;
    setIsTranslating(true);
    try {
      const response = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: issueDesc }),
      });
      if (response.ok) {
        const data = await response.json();
        setTranslationPreview(data.translatedText);
      } else {
        alert("Translation request failed. Please try again.");
      }
    } catch (err) {
      console.error("Translation preview error:", err);
    } finally {
      setIsTranslating(false);
    }
  };
  
  // AI analysis fields returned after submission
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    translatedDescription: string;
    category: string;
    risk: string;
    priority: string;
  } | null>(null);

  // --- FEATURE 2: TRACK ISSUES FILTERS ---
  const [selectedIssueForDetail, setSelectedIssueForDetail] = useState<Issue | null>(null);
  const [trackSearch, setTrackSearch] = useState("");
  const [trackStatusFilter, setTrackStatusFilter] = useState<string>("all");
  const [trackCategoryFilter, setTrackCategoryFilter] = useState<string>("all");
  const [trackRiskFilter, setTrackRiskFilter] = useState<string>("all");
  const [trackSortOrder, setTrackSortOrder] = useState<"upvotes_desc" | "downvotes_desc">("upvotes_desc");

  // --- FEATURE 3: NEARBY ISSUES FILTERS ---
  const [nearbySearch, setNearbySearch] = useState("");
  const [nearbyStatusFilter, setNearbyStatusFilter] = useState<string>("all");
  const [nearbyCategoryFilter, setNearbyCategoryFilter] = useState<string>("all");
  const [nearbyRiskFilter, setNearbyRiskFilter] = useState<string>("all");
  const [nearbySortOrder, setNearbySortOrder] = useState<"upvotes_desc" | "downvotes_desc">("upvotes_desc");

  // --- FEATURE 4: LEADERBOARD ---
  const [leaderboardSearch, setLeaderboardSearch] = useState("");

  // Filter issues raised by ME
  const myIssues = issues.filter((i) => i.citizenPhone === currentUser.phone);
  
  // Filter issues raised by OTHERS
  const nearbyIssues = issues.filter((i) => i.citizenPhone !== currentUser.phone);

  // Resolve selected issue reactively from issues array to maintain active vote state updates
  const activeDetailIssue = selectedIssueForDetail 
    ? issues.find((i) => i.id === selectedIssueForDetail.id) || selectedIssueForDetail 
    : null;

  // Analytics Calculation for this particular user
  const submittedCount = myIssues.filter((i) => i.status === "submitted").length;
  const acceptedCount = myIssues.filter((i) => i.status === "accepted").length;
  const inProgressCount = myIssues.filter((i) => i.status === "in_progress").length;
  const waitingCount = myIssues.filter((i) => i.status === "waiting_verification").length;
  const resolvedCount = myIssues.filter((i) => i.status === "resolved").length;
  const rejectedCount = myIssues.filter((i) => i.status === "rejected").length;

  const chartData = [
    { label: "Submitted", count: submittedCount, color: "#3B82F6", statusKey: "submitted" },
    { label: "Accepted", count: acceptedCount, color: "#8B5CF6", statusKey: "accepted" },
    { label: "In Progress", count: inProgressCount, color: "#F59E0B", statusKey: "in_progress" },
    { label: "Verification Needed", count: waitingCount, color: "#F97316", statusKey: "waiting_verification" },
    { label: "Resolved", count: resolvedCount, color: "#10B981", statusKey: "resolved" },
    { label: "Rejected", count: rejectedCount, color: "#EF4444", statusKey: "rejected" }
  ];

  // Geolocation trigger
  const handleGetLocation = () => {
    setIsGettingLocation(true);
    setLocationFetchedAlert(false);
    setIsVirtualGPSUsed(false);
    
    // Attempt real browser geolocation or fallback
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatVal(lat);
          setLngVal(lng);

          try {
            const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
            if (!res.ok) throw new Error("Reverse geocoding failed");
            const address = await res.json();
            
            setAreaInput(address.area);
            setCityInput(address.city);
            setDistrictInput(address.district);
            setPincodeInput(address.pincode);
            setStateInput(address.state);
            setIsVirtualGPSUsed(!!address.isVirtualGPS);
          } catch (error) {
            console.warn("Reverse geocoding API failed, falling back to realistic presets:", error);
            const randomAddress = PRESET_INDIAN_ADDRESSES[Math.floor(Math.random() * PRESET_INDIAN_ADDRESSES.length)];
            setAreaInput(randomAddress.area);
            setCityInput(randomAddress.city);
            setDistrictInput(randomAddress.district);
            setPincodeInput(randomAddress.pincode);
            setStateInput(randomAddress.state);
            setIsVirtualGPSUsed(true);
          } finally {
            setIsGettingLocation(false);
            setLocationFetchedAlert(true);
          }
        },
        (error) => {
          console.warn("Geolocation API failed, falling back to realistic presets:", error);
          const randomAddress = PRESET_INDIAN_ADDRESSES[Math.floor(Math.random() * PRESET_INDIAN_ADDRESSES.length)];
          setAreaInput(randomAddress.area);
          setCityInput(randomAddress.city);
          setDistrictInput(randomAddress.district);
          setPincodeInput(randomAddress.pincode);
          setStateInput(randomAddress.state);
          setLatVal(randomAddress.latitude);
          setLngVal(randomAddress.longitude);
          setIsVirtualGPSUsed(true);
          setIsGettingLocation(false);
          setLocationFetchedAlert(true);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      const randomAddress = PRESET_INDIAN_ADDRESSES[Math.floor(Math.random() * PRESET_INDIAN_ADDRESSES.length)];
      setAreaInput(randomAddress.area);
      setCityInput(randomAddress.city);
      setDistrictInput(randomAddress.district);
      setPincodeInput(randomAddress.pincode);
      setStateInput(randomAddress.state);
      setLatVal(randomAddress.latitude);
      setLngVal(randomAddress.longitude);
      setIsVirtualGPSUsed(true);
      setIsGettingLocation(false);
      setLocationFetchedAlert(true);
    }
  };

  const handleApplyCityPreset = (preset: Location) => {
    setAreaInput(preset.area);
    setCityInput(preset.city);
    setDistrictInput(preset.district);
    setPincodeInput(preset.pincode);
    setStateInput(preset.state);
    setLatVal(preset.latitude);
    setLngVal(preset.longitude);
    setIsVirtualGPSUsed(false);
    setLocationFetchedAlert(true);
  };

  // Upload image helper (converts to base64 with 5MB validation)
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
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit the issue to server
  const handleRaiseIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl || !issueTitle || !areaInput || !cityInput || !districtInput || !pincodeInput || !stateInput || !issueDesc) {
      alert("Please fill in all mandatory fields including photo and location details.");
      return;
    }
    if (!selectedCategory) {
      alert("Please select a category.");
      return;
    }

    setIsAnalyzing(true);

    try {
      // Step 1: Query Gemini server route to analyze text and get English translation
      const aiResponse = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: issueDesc }),
      });

      const aiData = await aiResponse.json();
      setIsAnalyzing(false);
      setIsSubmitting(true);

      // Category is strictly selected by the user to be 100% mandatory and accurate
      const analyzedCategory = selectedCategory;
      const analyzedRisk = aiData.risk || "low";
      const analyzedPriority = aiData.priority || "low";
      const analyzedTranslation = aiData.translatedDescription || issueDesc;

      setAiAnalysisResult({
        translatedDescription: analyzedTranslation,
        category: analyzedCategory,
        risk: analyzedRisk,
        priority: analyzedPriority
      });

      // Step 2: Post the complaint
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citizenName: currentUser.name,
          citizenPhone: currentUser.phone,
          title: issueTitle,
          category: analyzedCategory,
          location: {
            area: areaInput,
            city: cityInput,
            district: districtInput,
            pincode: pincodeInput,
            state: stateInput,
            latitude: latVal,
            longitude: lngVal
          },
          description: issueDesc,
          translatedDescription: analyzedTranslation,
          photoUrl: photoUrl,
          risk: analyzedRisk,
          priority: analyzedPriority
        }),
      });

      const submitData = await response.json();
      setIsSubmitting(false);

      if (response.ok && submitData.success) {
        setSubmitSuccess(true);
        onRefreshIssues();
        onRefreshUsers(); // leaderboard updates points if authorized
      }
    } catch (err) {
      setIsAnalyzing(false);
      setIsSubmitting(false);
      console.error(err);
    }
  };

  // Handle upvoting/downvoting nearby issues
  const handleVote = async (issueId: string, type: "up" | "down") => {
    try {
      const response = await fetch(`/api/issues/${issueId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: currentUser.phone, type }),
      });
      if (response.ok) {
        onRefreshIssues();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle verification upvoting/downvoting
  const handleVerifyVote = async (issueId: string, type: "up" | "down") => {
    try {
      const response = await fetch(`/api/issues/${issueId}/verify-vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: currentUser.phone, type }),
      });
      if (response.ok) {
        onRefreshIssues();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reset form to raise another issue
  const handleResetForm = () => {
    setIssueTitle("");
    setIssueDesc("");
    setSelectedCategory("");
    setPhotoUrl("");
    setAreaInput("");
    setCityInput("");
    setDistrictInput("");
    setPincodeInput("");
    setStateInput("");
    setLatVal(20.5937);
    setLngVal(78.9629);
    setLocationFetchedAlert(false);
    setSubmitSuccess(false);
    setAiAnalysisResult(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {activeFeature === null ? (
        <>
          {/* Dashboard Metrics Header */}
          <div className="mb-8 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fadeIn">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_45%)] pointer-events-none" />
            <div className="absolute top-1/2 left-1/4 w-[120px] h-[120px] bg-sky-400/20 rounded-full blur-[40px] pointer-events-none" />
            <div className="relative z-10 space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white/90 border border-white/10 uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                Janta Portal Active
              </span>
              <h2 className="text-3xl font-black tracking-tight mt-1">
                Jai Hind, {currentUser.name}!
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed max-w-xl">
                Welcome back to your civic panel. Together with <strong className="text-white underline decoration-sky-300 decoration-2 underline-offset-2">JantaMitra AI</strong>, let's keep your ward clean, green, and secure.
              </p>
            </div>
            <div className="relative z-10 shrink-0 bg-white/10 backdrop-blur-lg border border-white/20 p-4 rounded-2xl flex items-center gap-3 shadow-inner">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-900 flex items-center justify-center shadow-md">
                <Trophy className="w-5 h-5 text-yellow-950" />
              </div>
              <div>
                <span className="text-[10px] text-blue-200 block font-bold uppercase tracking-wider">Your Standings Score</span>
                <p className="text-xl font-black text-yellow-300 tracking-tight">{currentUser.points} <span className="text-xs text-white/80 font-bold uppercase">pts</span></p>
              </div>
            </div>
          </div>

          {/* Analytics Doughnut Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-blue-900/40 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden h-full flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-purple-500/10 rounded-full blur-[50px] pointer-events-none" />
                <div>
                  <span className="text-[10px] bg-gradient-to-r from-blue-500 to-purple-500 text-white font-black uppercase tracking-wider px-3 py-1 rounded-full border border-blue-400/20">
                    Personal Grievance Report Card
                  </span>
                  <h3 className="text-xl font-bold tracking-tight mt-4 text-slate-100">Ward Remediation Analytics</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    This chart visualizes your active and resolved complaints. When the municipal officers approve and resolve your issues, your JantaPoints increase on the national leaderboard!
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-8 border-t border-slate-800/85 pt-5">
                  <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Raised</span>
                    <p className="text-3xl font-black mt-1 text-slate-100">{myIssues.length}</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Resolved</span>
                    <p className="text-3xl font-black mt-1 text-emerald-400">{resolvedCount}</p>
                  </div>
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-center">
                    <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider">JantaPoints</span>
                    <p className="text-3xl font-black mt-1 text-yellow-400">{currentUser.points}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <DoughnutChart data={chartData} centerLabel="My Issues" />
            </div>
          </div>

          {/* Main Features Selection Grid */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-5 w-1 bg-blue-600 rounded-full" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-600">Core Civic Modules</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Feature 1: Raise Issue */}
              <button
                onClick={() => setActiveFeature("raise")}
                className="p-6 rounded-3xl text-left border transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-blue-50/20 dark:from-slate-900 dark:to-blue-950/15 hover:to-indigo-50/30 dark:hover:to-indigo-950/20 border-slate-100 dark:border-slate-800 shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xl dark:hover:shadow-slate-950/50 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-5.5 h-5.5" />
                </div>
                <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">1. Raise An Issue</h4>
                <p className="text-xs text-slate-500 dark:text-slate-600 mt-2 leading-relaxed font-medium">
                  Submit civic grievances with photos, GPS location pinning, and automatic AI audio/text translation.
                </p>
                <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1.5 transition-transform duration-300">
                  <span>Launch module</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Feature 2: Track issues */}
              <button
                onClick={() => setActiveFeature("track")}
                className="p-6 rounded-3xl text-left border transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-orange-50/20 dark:from-slate-900 dark:to-orange-950/15 hover:to-amber-50/30 dark:hover:to-orange-950/20 border-slate-100 dark:border-slate-800 shadow-md hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-xl dark:hover:shadow-slate-950/50 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-5.5 h-5.5" />
                </div>
                <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200 tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">2. Track My Grievances</h4>
                <p className="text-xs text-slate-500 dark:text-slate-600 mt-2 leading-relaxed font-medium">
                  Monitor real-time status updates of your complaints and participate in community verification voting.
                </p>
                <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1.5 transition-transform duration-300">
                  <span>Track status</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Feature 3: See nearby issues */}
              <button
                onClick={() => setActiveFeature("nearby")}
                className="p-6 rounded-3xl text-left border transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/15 hover:to-teal-50/30 dark:hover:to-teal-950/20 border-slate-100 dark:border-slate-800 shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-xl dark:hover:shadow-slate-950/50 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Compass className="w-5.5 h-5.5" />
                </div>
                <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200 tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">3. Explore Nearby</h4>
                <p className="text-xs text-slate-500 dark:text-slate-600 mt-2 leading-relaxed font-medium">
                  Inspect other local complaints in your area and upvote them to help authorities prioritize solutions.
                </p>
                <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1.5 transition-transform duration-300">
                  <span>Explore area</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Feature 4: Leaderboard */}
              <button
                onClick={() => setActiveFeature("leaderboard")}
                className="p-6 rounded-3xl text-left border transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-purple-50/20 dark:from-slate-900 dark:to-purple-950/15 hover:to-pink-50/30 dark:hover:to-pink-950/20 border-slate-100 dark:border-slate-800 shadow-md hover:border-purple-300 hover:shadow-xl group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="w-5.5 h-5.5" />
                </div>
                <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200 tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">4. Civic Leaderboard</h4>
                <p className="text-xs text-slate-500 dark:text-slate-600 mt-2 leading-relaxed font-medium">
                  Accumulate JantaPoints immediately when your issues are accepted. Win medals and badges.
                </p>
                <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1.5 transition-transform duration-300">
                  <span>View standings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-md p-6 sm:p-8 animate-fadeIn mb-12 text-slate-800 dark:text-slate-100">
          
          {/* Header of Active Feature */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800 pb-5 mb-6 gap-4">
            <div>
              <span className="text-xs text-indigo-600 dark:text-blue-400 font-bold tracking-widest uppercase mb-1 block">CIVIC MODULE REDIRECTED PAGE</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                {activeFeature === "raise" && <Upload className="w-6 h-6 text-blue-600" />}
                {activeFeature === "track" && <Clock className="w-6 h-6 text-amber-600" />}
                {activeFeature === "nearby" && <Compass className="w-6 h-6 text-emerald-600" />}
                {activeFeature === "leaderboard" && <Trophy className="w-6 h-6 text-purple-600" />}
                {activeFeature === "raise" && "1. Submit New Grievance"}
                {activeFeature === "track" && "2. My Grievances Status Tracker"}
                {activeFeature === "nearby" && "3. Explore Nearby Issues & Upvote"}
                {activeFeature === "leaderboard" && "4. Civic Leaderboard"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">
                {activeFeature === "raise" && "Fill out details or speak into the mic. Gemini AI automatically processes inputs."}
                {activeFeature === "track" && "Filter, search, or vote to verify resolved works."}
                {activeFeature === "nearby" && "Help prioritize issues. Upvoted civic problems bubble up directly onto Authority dashboards."}
                {activeFeature === "leaderboard" && "Points awarded based on risk category: Low: +10 | Moderate: +20 | High: +50 | Emergency: +100."}
              </p>
            </div>
            <button
              onClick={() => setActiveFeature(null)}
              className="text-xs bg-indigo-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow border-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </button>
          </div>

          {/* --- CONTENT 1: RAISE ISSUE --- */}
          {activeFeature === "raise" && (
            <div>
              {submitSuccess ? (
                // Success Screen
                <div className="py-8 text-center max-w-md mx-auto">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800">Thank You for submitting your problem!</h4>
                  <p className="text-xs text-slate-600 mt-2">
                    Your complaint has been logged and queued. It is analyzed in real-time by JantaMitra AI and sent directly to Ward Officers.
                  </p>

                  {/* AI Analysis Result Panel */}
                  {aiAnalysisResult && (
                    <div className="mt-6 p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-left">
                      <h5 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Real-Time Extraction Reports
                      </h5>
                      <div className="space-y-2 text-xs text-slate-600">
                        <div>
                          <strong>English Translation:</strong>
                          <p className="text-slate-600 mt-0.5 italic">"{aiAnalysisResult.translatedDescription}"</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/50">
                          <div>
                            <span className="text-[10px] text-slate-600 uppercase font-bold">Category</span>
                            <p className="font-semibold text-slate-700">{aiAnalysisResult.category}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-600 uppercase font-bold">Risk Level</span>
                            <p className="font-semibold text-slate-700 capitalize">{aiAnalysisResult.risk}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-600 uppercase font-bold">Priority</span>
                            <p className="font-semibold text-slate-700 capitalize">{aiAnalysisResult.priority}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}                  <button
                    onClick={handleResetForm}
                    className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer border-0"
                  >
                    Raise Another Issue
                  </button>
                </div>
              ) : (
                // Raise Form
                <form onSubmit={handleRaiseIssueSubmit} className="max-w-3xl mx-auto space-y-6">
                    
                    {/* Image selector */}
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-2">
                        1. Upload Photo / Video Proof <span className="text-rose-500">*</span>
                      </label>
                      
                      {photoUrl ? (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-64 h-64 bg-slate-950 flex items-center justify-center group w-full">
                          {photoUrl.startsWith("data:video/") ? (
                            <video src={photoUrl} controls className="max-w-full max-h-full object-contain" />
                          ) : (
                            <img src={photoUrl} alt="Complaint Preview" className="max-w-full max-h-full object-contain" />
                          )}
                          <button
                            type="button"
                            onClick={() => setPhotoUrl("")}
                            className="absolute top-2 right-2 p-2 bg-slate-900/80 text-white rounded-lg hover:bg-rose-600 transition-all cursor-pointer z-10 border-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-all">
                          <Upload className="w-8 h-8 text-slate-600 mb-2" />
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold text-center">Select image or video file</p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-600 text-center mt-1">PNG, JPG or MP4 (Max size: 5MB)</p>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            id="file-upload-input"
                          />
                          <label
                            htmlFor="file-upload-input"
                            className="mt-3 px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer"
                          >
                            Browse Local Files
                          </label>
                        </div>
                      )}

                    </div>

                    {/* Geolocation Section */}
                    <div className="bg-white dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          2. Location Details <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleGetLocation}
                          disabled={isGettingLocation}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-indigo-400 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer shrink-0 border-0"
                        >
                          {isGettingLocation ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Fetching GPS...
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3.5 h-3.5" />
                              Auto GPS Fetch
                            </>
                          )}
                        </button>
                      </div>

                      {locationFetchedAlert && (
                        <div className="bg-emerald-50/55 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 p-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 animate-fadeIn">
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Address loaded successfully! Feel free to modify below.</span>
                        </div>
                      )}

                      {isVirtualGPSUsed && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed flex flex-col gap-1 animate-fadeIn">
                          <div className="flex items-center gap-1.5 font-extrabold text-amber-900 dark:text-amber-200">
                            <span>📌</span>
                            <span>Virtual GPS Active (India Fallback)</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300">
                            Your system or browser returned coordinates outside India (likely due to sandbox environment or cloud hosting). We mapped you to a high-quality Indian municipal region!
                          </p>
                          <p className="font-semibold text-amber-900 dark:text-amber-200 mt-1">
                            Feel free to refine below, or click any preset city to load accurate ward data.
                          </p>
                        </div>
                      )}

                      {/* Quick select Indian cities */}
                      <div className="bg-slate-50 dark:bg-slate-800/10 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40 space-y-1.5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block">
                          📍 Quick Indian City Presets (One-Click Correction)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_INDIAN_ADDRESSES.map((preset) => (
                            <button
                              key={preset.city}
                              type="button"
                              onClick={() => handleApplyCityPreset(preset)}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                                cityInput.toLowerCase() === preset.city.toLowerCase()
                                  ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 shadow-sm"
                                  : "bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                              }`}
                            >
                              {preset.city === "Mumbai" && "🏢 "}
                              {preset.city === "Bengaluru" && "🌳 "}
                              {preset.city === "Pune" && "⛰️ "}
                              {preset.city === "New Delhi" && "🏛️ "}
                              {preset.city === "Kolkata" && "🌉 "}
                              {preset.city === "Chennai" && "🌊 "}
                              {preset.city === "Hyderabad" && "🕌 "}
                              {preset.city}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">
                            Area / Landmark / Street Name <span className="text-rose-500">*</span>
                          </label>
                          <textarea
                            rows={2}
                            required
                            placeholder="e.g. Near Rose Garden park entry, MG Road lane"
                            value={areaInput}
                            onChange={(e) => setAreaInput(e.target.value)}
                            className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100 font-semibold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">
                              City / Town <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Bengaluru"
                              value={cityInput}
                              onChange={(e) => setCityInput(e.target.value)}
                              className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">
                              District <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Bengaluru Urban"
                              value={districtInput}
                              onChange={(e) => setDistrictInput(e.target.value)}
                              className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100 font-semibold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">
                              Pincode <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 560001"
                              value={pincodeInput}
                              onChange={(e) => setPincodeInput(e.target.value)}
                              className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">
                              State <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Karnataka"
                              value={stateInput}
                              onChange={(e) => setStateInput(e.target.value)}
                              className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100 font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                        3. Issue Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Describe the complaint in short (e.g. Sewage water leakage near Sector 5 Park)"
                        value={issueTitle}
                        onChange={(e) => setIssueTitle(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 focus:ring-2 focus:ring-indigo-100/50 outline-none transition-all font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
                      />
                    </div>

                    {/* Description Voice vs Text */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                          4. Complaint Description <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-slate-600 font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                          Write in your mother tongue
                        </span>
                      </div>

                      <div className="space-y-3">
                        <textarea
                          rows={4}
                          required
                          placeholder="Provide descriptive details of the problem (e.g., location landmarks, when it started, hazard risk). You can type in Hindi (हिंदी), Tamil, Telugu, Marathi, Bengali, Kannada, etc. — AI will translate automatically."
                          value={issueDesc}
                          onChange={(e) => {
                            setIssueDesc(e.target.value);
                            // Clear translation preview if they change text to keep it in sync
                            if (translationPreview) setTranslationPreview("");
                          }}
                          className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 focus:ring-2 focus:ring-indigo-100/50 outline-none transition-all font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
                        />

                        {/* Translation preview section */}
                        <div className="flex gap-2 items-center justify-between pt-1">
                          <button
                            type="button"
                            disabled={isTranslating || !issueDesc.trim()}
                            onClick={handleTranslateText}
                            className="text-xs bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-indigo-900/50 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-600 text-blue-600 dark:text-blue-400 font-bold px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/40 disabled:border-slate-100 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            {isTranslating ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Translating to English...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                AI Translate to English Preview
                              </>
                            )}
                          </button>
                          
                          {translationPreview && (
                            <button
                              type="button"
                              onClick={() => setTranslationPreview("")}
                              className="text-[10px] text-slate-600 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 font-bold bg-transparent border-0 cursor-pointer"
                            >
                              Clear Preview
                            </button>
                          )}
                        </div>

                        {translationPreview && (
                          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-lg text-xs text-indigo-950 dark:text-blue-200 font-medium animate-fadeIn">
                            <div className="flex items-center gap-1.5 mb-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                              <Sparkles className="w-3 h-3" />
                              English Translation Preview:
                            </div>
                            <p className="italic text-slate-700 dark:text-slate-300">"{translationPreview}"</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Manual Category (Mandatory) */}
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                        5. Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as Category)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-200 outline-none focus:border-blue-500 font-semibold bg-white dark:bg-slate-800"
                      >
                        <option value="">-- Choose Category (Mandatory) --</option>
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

                    {/* Submission Button */}
                    <button
                      type="submit"
                      disabled={isAnalyzing || isSubmitting || !photoUrl || !issueTitle || !areaInput || !cityInput || !districtInput || !pincodeInput || !stateInput || !issueDesc || !selectedCategory}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
                    >
                      {isAnalyzing && (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Gemini AI Translating & Analysing risk...
                        </>
                      )}
                      {isSubmitting && (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving Complaint onto Municipal Server...
                        </>
                      )}
                      {!isAnalyzing && !isSubmitting && (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Public Complaint
                        </>
                      )}
                    </button>

                </form>
              )}
            </div>
          )}
                    {/* --- CONTENT 2: TRACK MY ISSUES --- */}
          {activeFeature === "track" && (
            <div>
              {activeDetailIssue ? (<>
                {/* DEDICATED REDIRECT PAGE FOR DETAILED COMPLAINT / RESOLUTION INSPECTION */}
                               <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        Ticket Detail Page
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase font-mono">
                        #{activeDetailIssue.id.substring(0, 8)}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedIssueForDetail(null)}
                      className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/55 hover:bg-blue-100 dark:hover:bg-indigo-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm border-0"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Track List
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Left Column: Complaint Details & Translation */}
                    <div className="md:col-span-7 space-y-5">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shadow ${
                            activeDetailIssue.status === "submitted" ? "bg-blue-600 text-white" :
                            activeDetailIssue.status === "accepted" ? "bg-purple-600 text-white" :
                            activeDetailIssue.status === "in_progress" ? "bg-amber-500 text-white" :
                            activeDetailIssue.status === "waiting_verification" ? "bg-orange-500 text-white animate-pulse" :
                            activeDetailIssue.status === "resolved" ? "bg-emerald-600 text-white" :
                            "bg-rose-600 text-white"
                          }`}>
                            {activeDetailIssue.status.replace("_", " ")}
                          </span>
                          <span className="bg-slate-900 dark:bg-slate-800 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                            {activeDetailIssue.category}
                          </span>
                        </div>
                        <h4 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{activeDetailIssue.title}</h4>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-600 text-xs mt-2 font-semibold">
                          <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>
                            {activeDetailIssue.location?.area || "N/A"}, {activeDetailIssue.location?.city || "N/A"}, {activeDetailIssue.location?.state || "N/A"} - {activeDetailIssue.location?.pincode || "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-600">AI Translated Description (English)</p>
                          <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed mt-1">
                            "{activeDetailIssue.translatedDescription}"
                          </p>
                        </div>
                        {activeDetailIssue.description !== activeDetailIssue.translatedDescription && (
                          <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-600">Original Citizen Input Description</p>
                            <p className="text-xs text-slate-500 dark:text-slate-600 font-medium leading-relaxed mt-1 italic text-slate-600">
                              "{activeDetailIssue.description}"
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/20">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-600 block">Risk Priority Assessment</span>
                          <span className={`text-xs font-bold uppercase tracking-wider mt-1.5 inline-block px-2.5 py-0.5 rounded ${
                            activeDetailIssue.risk === "low" ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-600" :
                            activeDetailIssue.risk === "moderate" ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400" :
                            activeDetailIssue.risk === "high" ? "bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400" :
                            "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400"
                          }`}>
                            {activeDetailIssue.risk}
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/20">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-600 block">Filing Date</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1.5 inline-block">
                            {new Date(activeDetailIssue.raisedDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Visual Evidence & Verification Loop details */}
                    <div className="md:col-span-5 space-y-5">
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                        <div className="bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                          Initial Grievance Photo / Video
                        </div>
                        {renderMedia(activeDetailIssue.photoUrl, "w-full aspect-video object-cover")}
                      </div>

                      {/* Display Resolved Proof explicitly on its own dedicated block */}
                      {activeDetailIssue.status === "resolved" && activeDetailIssue.resolvedPhotoUrl && (
                        <div className="border border-emerald-200 dark:border-emerald-900/50 rounded-xl overflow-hidden bg-emerald-50/30 dark:bg-emerald-950/10 shadow-sm p-4 space-y-3 animate-fadeIn">
                          <h5 className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1 text-sm">
                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            Officer Fix Evidence
                          </h5>
                          {renderMedia(activeDetailIssue.resolvedPhotoUrl, "w-full aspect-video object-cover rounded-lg border border-emerald-100 dark:border-emerald-900/40")}
                          <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                            <p className="text-[10px] text-slate-600 dark:text-slate-600 font-bold uppercase">Officer Note:</p>
                            <p className="text-xs text-slate-700 dark:text-slate-200 leading-normal mt-0.5 font-semibold">
                              "{activeDetailIssue.resolvedNote}"
                            </p>
                            {activeDetailIssue.resolvedDate && (
                              <p className="text-[9px] text-slate-600 dark:text-slate-600 mt-1">
                                ðŸ“… Resolved on: {new Date(activeDetailIssue.resolvedDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Display Rejection Details explicitly on its own dedicated block */}
                      {activeDetailIssue.status === "rejected" && activeDetailIssue.resolvedNote && (
                        <div className="border border-rose-200 dark:border-rose-900/50 rounded-xl overflow-hidden bg-rose-50/30 dark:bg-rose-950/10 shadow-sm p-4 space-y-3 animate-fadeIn">
                          <h5 className="font-bold text-rose-800 dark:text-rose-400 flex items-center gap-1 text-sm">
                            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                            Rejection Details
                          </h5>
                          <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-rose-100 dark:border-rose-900/40">
                            <p className="text-[10px] text-slate-600 dark:text-slate-600 font-bold uppercase">Rejection Reason:</p>
                            <p className="text-xs text-rose-700 dark:text-rose-300 leading-normal mt-0.5 font-semibold italic">
                              "{activeDetailIssue.resolvedNote}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Community verification loop active */}
                      {activeDetailIssue.status === "waiting_verification" && (
                        <div className="border border-orange-200 dark:border-orange-900/50 rounded-xl overflow-hidden bg-orange-50/30 dark:bg-orange-950/10 shadow-sm p-4 space-y-3">
                          <h5 className="font-bold text-orange-800 dark:text-orange-400 flex items-center gap-1 text-sm">
                            <ShieldAlert className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            Community Action Verification Loop
                          </h5>
                          <p className="text-xs text-orange-600 dark:text-orange-400 leading-normal font-semibold">
                            Authority has declared this issue resolved. Please cast your vote! If 5 upvotes are collected, it officially transitions to 'Resolved'. If 5 downvotes are collected, it is reopened.
                          </p>
                          
                          {activeDetailIssue.resolvedPhotoUrl && (
                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-600 mb-1">Fixed Proof Evidence:</p>
                              {renderMedia(activeDetailIssue.resolvedPhotoUrl, "w-full aspect-video object-cover rounded-lg border border-orange-100 dark:border-orange-900/40")}
                              <div className="p-2 bg-white dark:bg-slate-800 rounded border border-orange-100 dark:border-orange-900/40 mt-2">
                                <p className="text-[10px] text-slate-600 dark:text-slate-600 font-bold uppercase">Officer's fixed note:</p>
                                <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5 font-medium">"{activeDetailIssue.resolvedNote}"</p>
                                {activeDetailIssue.resolvedDate && (
                                  <p className="text-[9px] text-slate-600 dark:text-slate-600 mt-1">ðŸ“… {new Date(activeDetailIssue.resolvedDate).toLocaleDateString()}</p>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2 text-center pt-2">
                            <button
                              onClick={() => handleVerifyVote(activeDetailIssue.id, "up")}
                              className={`p-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border-0 ${
                                activeDetailIssue.verificationUpvotes.includes(currentUser.phone)
                                  ? "bg-emerald-600 text-white shadow"
                                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              Confirm Fix ({activeDetailIssue.verificationUpvotes.length}/5)
                            </button>

                            <button
                              onClick={() => handleVerifyVote(activeDetailIssue.id, "down")}
                              className={`p-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border-0 ${
                                activeDetailIssue.verificationDownvotes.includes(currentUser.phone)
                                  ? "bg-rose-600 text-white shadow"
                                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                              }`}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                              Reopen Issue ({activeDetailIssue.verificationDownvotes.length}/5)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
              </>
              ) : (
                <>
                  {/* Filter controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-6 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="sm:col-span-3 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input
                        type="text"
                        placeholder="Search by title, location..."
                        value={trackSearch}
                        onChange={(e) => setTrackSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <select
                        value={trackStatusFilter}
                        onChange={(e) => setTrackStatusFilter(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-200 outline-none"
                      >
                        <option value="all">All Statuses</option>
                        <option value="submitted">Submitted</option>
                        <option value="accepted">Accepted</option>
                        <option value="in_progress">In Progress</option>
                        <option value="waiting_verification">Waiting Verification</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <select
                        value={trackCategoryFilter}
                        onChange={(e) => setTrackCategoryFilter(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-200 outline-none"
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
                        value={trackRiskFilter}
                        onChange={(e) => setTrackRiskFilter(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-200 outline-none"
                      >
                        <option value="all">All Priorities</option>
                        <option value="low">Low Priority</option>
                        <option value="moderate">Moderate Priority</option>
                        <option value="high">High Priority</option>
                        <option value="emergency">Emergency Priority</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <select
                        value={trackSortOrder}
                        onChange={(e) => setTrackSortOrder(e.target.value as "upvotes_desc" | "downvotes_desc")}
                        className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-200 outline-none"
                      >
                        <option value="upvotes_desc">↑ Most Upvoted</option>
                        <option value="downvotes_desc">↓ Most Downvoted</option>
                      </select>
                    </div>
                  </div>

                  {/* Issues Tracker List */}
                  {myIssues.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-slate-600 dark:text-slate-600 font-medium text-sm">You have not submitted any complaints yet.</p>
                      <button
                        onClick={() => setActiveFeature("raise")}
                        className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer bg-transparent border-0"
                      >
                        Submit your first complaint here →
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {myIssues
                        .filter((issue) => {
                          const lowerSearch = trackSearch.toLowerCase();
                          const matchesSearch = 
                            (issue.title || "").toLowerCase().includes(lowerSearch) ||
                            (issue.location?.area || "").toLowerCase().includes(lowerSearch) ||
                            (issue.location?.city || "").toLowerCase().includes(lowerSearch) ||
                            (issue.location?.state || "").toLowerCase().includes(lowerSearch) ||
                            (issue.location?.district || "").toLowerCase().includes(lowerSearch) ||
                            (issue.location?.pincode || "").toLowerCase().includes(lowerSearch);
                          const matchesStatus = trackStatusFilter === "all" || issue.status === trackStatusFilter;
                          const matchesCategory = trackCategoryFilter === "all" || issue.category === trackCategoryFilter;
                          const matchesRisk = trackRiskFilter === "all" || issue.risk === trackRiskFilter;
                          return matchesSearch && matchesStatus && matchesCategory && matchesRisk;
                        })
                        .sort((a, b) => {
                          if (trackSortOrder === "downvotes_desc") {
                            return b.downvotes.length - a.downvotes.length;
                          }
                          return b.upvotes.length - a.upvotes.length;
                        })
                        .map((issue) => {
                          const totalVotes = issue.upvotes.length - issue.downvotes.length;
                          const userHasUpvoted = issue.upvotes.includes(currentUser.phone);
                          const userHasDownvoted = issue.downvotes.includes(currentUser.phone);

                          return (
                            <div key={issue.id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white dark:bg-slate-900">
                              
                              {/* Image & status header */}
                              <div className="relative aspect-video bg-slate-100 dark:bg-slate-950 shrink-0">
                                <div className="w-full h-full object-cover">
                                  {renderMedia(issue.photoUrl, "w-full h-full object-cover")}
                                </div>
                                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shadow ${
                                    issue.status === "submitted" ? "bg-blue-600 text-white" :
                                    issue.status === "accepted" ? "bg-purple-600 text-white" :
                                    issue.status === "in_progress" ? "bg-amber-500 text-white" :
                                    issue.status === "waiting_verification" ? "bg-orange-500 text-white animate-pulse" :
                                    issue.status === "resolved" ? "bg-emerald-600 text-white" :
                                    "bg-rose-600 text-white"
                                  }`}>
                                    {issue.status.replace("_", " ")}
                                  </span>
                                  <span className="bg-slate-900/80 dark:bg-slate-800/90 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                                    {issue.category}
                                  </span>
                                </div>
                              </div>

                              {/* Detail panel */}
                              <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-start gap-2">
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{issue.title}</h4>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                      issue.risk === "low" ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-600" :
                                      issue.risk === "moderate" ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400" :
                                      issue.risk === "high" ? "bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400" :
                                      "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400"
                                    }`}>
                                      {issue.risk}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-600 text-[11px] mt-2 font-medium">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>{issue.location?.area || "N/A"}, {issue.location?.city || "N/A"}</span>
                                  </div>

                                  {/* Original Input vs Translated */}
                                  <div className="mt-3.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                                    <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed line-clamp-2">
                                      "{issue.translatedDescription}"
                                    </p>
                                    {issue.description !== issue.translatedDescription && (
                                      <p className="text-[10px] text-slate-600 dark:text-slate-600 mt-1 italic truncate">
                                        Original: "{issue.description}"
                                      </p>
                                    )}
                                  </div>

                                  {/* Verification Feedback Block */}
                                  {issue.status === "waiting_verification" && (
                                    <div className="mt-4 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 text-xs text-left">
                                      <h5 className="font-bold text-orange-800 dark:text-orange-400 flex items-center gap-1">
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                        Community Action Verification Loop
                                      </h5>
                                      <p className="text-[11px] text-orange-600 dark:text-orange-300 mt-1 leading-normal">
                                        The authority declared this fixed! Check the fix and cast your vote below.
                                      </p>
                                      
                                      {issue.resolvedPhotoUrl && (
                                        <div className="mt-2">
                                          {renderMedia(issue.resolvedPhotoUrl, "w-full aspect-video object-cover rounded-lg border border-orange-200 dark:border-orange-900/40")}
                                          <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded border border-orange-100 dark:border-orange-900/40">
                                            <p className="text-[9px] text-slate-600 dark:text-slate-600 font-bold uppercase">Authority's Fix Note:</p>
                                            <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 font-medium leading-normal line-clamp-3">
                                              "{issue.resolvedNote}"
                                            </p>
                                            {issue.resolvedDate && (
                                              <p className="text-[9px] text-slate-600 dark:text-slate-600 mt-0.5">ðŸ“… {new Date(issue.resolvedDate).toLocaleDateString()}</p>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      
                                      <div className="mt-2.5 grid grid-cols-2 gap-2 text-center">
                                        <button
                                          type="button"
                                          onClick={() => handleVerifyVote(issue.id, "up")}
                                          className={`p-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border-0 ${
                                            issue.verificationUpvotes.includes(currentUser.phone)
                                              ? "bg-emerald-600 text-white"
                                              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                                          }`}
                                        >
                                          <ThumbsUp className="w-3 h-3" />
                                          Confirm Fix ({issue.verificationUpvotes.length}/5)
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleVerifyVote(issue.id, "down")}
                                          className={`p-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border-0 ${
                                            issue.verificationDownvotes.includes(currentUser.phone)
                                              ? "bg-rose-600 text-white"
                                              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                                          }`}
                                        >
                                          <ThumbsDown className="w-3 h-3" />
                                          Reopen Issue ({issue.verificationDownvotes.length}/5)
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Rejection details for rejected issues */}
                                  {issue.status === "rejected" && issue.resolvedNote && (
                                    <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs">
                                      <h5 className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        Rejection Reason from Authority
                                      </h5>
                                      <p className="text-[11px] text-rose-800 dark:text-rose-300 mt-1 leading-normal font-medium italic">
                                        "{issue.resolvedNote}"
                                      </p>
                                    </div>
                                  )}

                                  {/* Fixed proof panel for resolved */}
                                  {issue.status === "resolved" && issue.resolvedPhotoUrl && (
                                    <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs text-left">
                                      <h5 className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1 mb-2">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        ✅ Resolution Proof
                                      </h5>
                                      {renderMedia(issue.resolvedPhotoUrl, "w-full aspect-video object-cover rounded-lg border mb-2 border-emerald-200 dark:border-emerald-900/40")}
                                      <div className="p-2 rounded border bg-white dark:bg-slate-800 border-emerald-100 dark:border-emerald-900/40">
                                        <p className="text-[9px] text-slate-600 dark:text-slate-600 font-bold uppercase">Officer Note:</p>
                                        <p className="text-[11px] text-emerald-700 dark:text-emerald-600 mt-0.5 font-medium leading-normal">
                                          "{issue.resolvedNote}"
                                        </p>
                                        {issue.resolvedDate && (
                                          <p className="text-[9px] text-slate-600 dark:text-slate-600 mt-1">
                                            ðŸ“… Resolved on: {new Date(issue.resolvedDate).toLocaleDateString()}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Redirect to specific detail page button */}
                                <button
                                  type="button"
                                  onClick={() => setSelectedIssueForDetail(issue)}
                                  className="mt-4 w-full py-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-indigo-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-blue-100/60 dark:border-blue-900/40 shadow-sm"
                                >
                                  <Search className="w-3.5 h-3.5" />
                                  Inspect Resolution & Details →
                                </button>

                                {/* Votes mapping & Vote Buttons */}
                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                  {issue.status !== "resolved" && issue.status !== "rejected" && issue.status !== "waiting_verification" ? (
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] text-slate-600 dark:text-slate-600 font-semibold uppercase">Cast priority vote</span>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleVote(issue.id, "up")}
                                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                            userHasUpvoted
                                              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-600"
                                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300"
                                          }`}
                                        >
                                          <ThumbsUp className="w-3.5 h-3.5" />
                                          Upvote ({issue.upvotes.length})
                                        </button>

                                        <button
                                          onClick={() => handleVote(issue.id, "down")}
                                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                            userHasDownvoted
                                              ? "bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/50 text-rose-700 dark:text-rose-600"
                                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300"
                                          }`}
                                        >
                                          <ThumbsDown className="w-3.5 h-3.5" />
                                          Downvote ({issue.downvotes.length})
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-600 font-medium">
                                      <span>Raised: {new Date(issue.raisedDate).toLocaleDateString()}</span>
                                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-bold">
                                        <ThumbsUp className="w-3.5 h-3.5 text-slate-600 dark:text-slate-600" />
                                        <span>{issue.upvotes.length} Votes</span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                  </>
              )}
            </div>
          )}

          {/* --- CONTENT 3: EXPLORE NEARBY ISSUES --- */}
          {activeFeature === "nearby" && (
            <div>
              {/* Filter controls */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-6 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="sm:col-span-3 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type="text"
                    placeholder="Search by title, location..."
                    value={nearbySearch}
                    onChange={(e) => setNearbySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <select
                    value={nearbyStatusFilter}
                    onChange={(e) => setNearbyStatusFilter(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-200 outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="submitted">Submitted</option>
                    <option value="accepted">Accepted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_verification">Waiting Verification</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={nearbyCategoryFilter}
                    onChange={(e) => setNearbyCategoryFilter(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-200 outline-none"
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
                    value={nearbyRiskFilter}
                    onChange={(e) => setNearbyRiskFilter(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-200 outline-none"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low Priority</option>
                    <option value="moderate">Moderate Priority</option>
                    <option value="high">High Priority</option>
                    <option value="emergency">Emergency Priority</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <select
                    value={nearbySortOrder}
                    onChange={(e) => setNearbySortOrder(e.target.value as "upvotes_desc" | "downvotes_desc")}
                    className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-200 outline-none"
                  >
                    <option value="upvotes_desc">↑ Most Upvoted</option>
                    <option value="downvotes_desc">↓ Most Downvoted</option>
                  </select>
                </div>
              </div>

              {/* Nearby Issues Tracker List */}
              {issues.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  <p className="text-slate-600 font-medium text-sm">Loading community issues from server...</p>
                </div>
              ) : nearbyIssues.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-600 font-medium text-sm">No nearby public issues registered from other citizens yet.</p>
                  <p className="text-slate-400 text-xs mt-1">Be the first in your ward to raise an issue!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {(() => {
                    const filteredNearby = nearbyIssues
                      .filter((issue) => {
                        const lowerSearch = nearbySearch.toLowerCase();
                        const matchesSearch = 
                          (issue.title || "").toLowerCase().includes(lowerSearch) ||
                          (issue.location?.area || "").toLowerCase().includes(lowerSearch) ||
                          (issue.location?.city || "").toLowerCase().includes(lowerSearch) ||
                          (issue.location?.state || "").toLowerCase().includes(lowerSearch) ||
                          (issue.location?.district || "").toLowerCase().includes(lowerSearch) ||
                          (issue.location?.pincode || "").toLowerCase().includes(lowerSearch);
                        const matchesStatus = nearbyStatusFilter === "all" || issue.status === nearbyStatusFilter;
                        const matchesCategory = nearbyCategoryFilter === "all" || issue.category === nearbyCategoryFilter;
                        const matchesRisk = nearbyRiskFilter === "all" || issue.risk === nearbyRiskFilter;
                        return matchesSearch && matchesStatus && matchesCategory && matchesRisk;
                      })
                      .sort((a, b) => {
                        if (nearbySortOrder === "downvotes_desc") {
                          return b.downvotes.length - a.downvotes.length;
                        }
                        return b.upvotes.length - a.upvotes.length;
                      });
                    if (filteredNearby.length === 0) {
                      return (
                        <div className="col-span-2 text-center py-10">
                          <p className="text-slate-500 font-medium text-sm">No issues match your current filters.</p>
                          <button
                            onClick={() => { setNearbySearch(""); setNearbyStatusFilter("all"); setNearbyCategoryFilter("all"); setNearbyRiskFilter("all"); }}
                            className="mt-3 text-xs text-emerald-600 font-bold hover:underline cursor-pointer bg-transparent border-0"
                          >
                            Clear all filters
                          </button>
                        </div>
                      );
                    }
                    return filteredNearby.map((issue) => {
                      const userHasUpvoted = issue.upvotes.includes(currentUser.phone);
                      const userHasDownvoted = issue.downvotes.includes(currentUser.phone);

                      return (
                        <div key={issue.id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white dark:bg-slate-900">
                          
                          {/* Image & status header */}
                          <div className="relative aspect-video bg-slate-100 dark:bg-slate-950 shrink-0">
                            <div className="w-full h-full object-cover">
                              {renderMedia(issue.photoUrl, "w-full h-full object-cover")}
                            </div>
                            <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shadow ${
                                issue.status === "submitted" ? "bg-blue-600 text-white" :
                                issue.status === "accepted" ? "bg-purple-600 text-white" :
                                issue.status === "in_progress" ? "bg-amber-500 text-white" :
                                issue.status === "waiting_verification" ? "bg-orange-500 text-white animate-pulse" :
                                issue.status === "resolved" ? "bg-emerald-600 text-white" :
                                "bg-rose-600 text-white"
                              }`}>
                                {issue.status.replace("_", " ")}
                              </span>
                              <span className="bg-slate-900/80 dark:bg-slate-800/90 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                                {issue.category}
                              </span>
                            </div>
                          </div>

                          {/* Detail panel */}
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{issue.title}</h4>
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  issue.risk === "low" ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-600" :
                                  issue.risk === "moderate" ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400" :
                                  issue.risk === "high" ? "bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400" :
                                  "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400"
                                }`}>
                                  {issue.risk}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-600 text-[11px] mt-2 font-medium">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{issue.location?.area || "N/A"}, {issue.location?.city || "N/A"}</span>
                              </div>

                              {/* AI Translation display */}
                              <div className="mt-3.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                                <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed line-clamp-2">
                                  "{issue.translatedDescription}"
                                </p>
                                {issue.description !== issue.translatedDescription && (
                                  <p className="text-[10px] text-slate-600 dark:text-slate-600 mt-1 italic truncate">
                                    Original: "{issue.description}"
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Verification Feedback Block */}
                            {issue.status === "waiting_verification" && (
                              <div className="mt-4 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 text-xs text-left">
                                <h5 className="font-bold text-orange-800 dark:text-orange-400 flex items-center gap-1">
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  Community Action Verification Loop
                                </h5>
                                <p className="text-[11px] text-orange-600 dark:text-orange-600 mt-1 leading-normal">
                                  The authority declared this fixed! Check the fix and cast your vote below.
                                </p>
                                
                                {issue.resolvedPhotoUrl && (
                                  <div className="mt-2">
                                    {renderMedia(issue.resolvedPhotoUrl, "w-full aspect-video object-cover rounded-lg border border-orange-200 dark:border-orange-900/40")}
                                    <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded border border-orange-100 dark:border-orange-900/40">
                                      <p className="text-[9px] text-slate-600 dark:text-slate-600 font-bold uppercase">Authority's Fix Note:</p>
                                      <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 font-medium leading-normal line-clamp-3">
                                        "{issue.resolvedNote}"
                                      </p>
                                      {issue.resolvedDate && (
                                        <p className="text-[9px] text-slate-600 dark:text-slate-600 mt-0.5">ðŸ“… {new Date(issue.resolvedDate).toLocaleDateString()}</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="mt-2.5 grid grid-cols-2 gap-2 text-center">
                                  <button
                                    onClick={() => handleVerifyVote(issue.id, "up")}
                                    className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border-0 ${
                                      issue.verificationUpvotes.includes(currentUser.phone)
                                        ? "bg-emerald-600 text-white"
                                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                                    }`}
                                  >
                                    <ThumbsUp className="w-3 h-3" />
                                    Confirm Fix ({issue.verificationUpvotes.length}/5)
                                  </button>

                                  <button
                                    onClick={() => handleVerifyVote(issue.id, "down")}
                                    className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border-0 ${
                                      issue.verificationDownvotes.includes(currentUser.phone)
                                        ? "bg-rose-600 text-white"
                                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                                    }`}
                                  >
                                    <ThumbsDown className="w-3 h-3" />
                                    Reopen Issue ({issue.verificationDownvotes.length}/5)
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Rejection details for rejected issues */}
                            {issue.status === "rejected" && issue.resolvedNote && (
                              <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs">
                                <h5 className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Rejection Reason from Authority
                                </h5>
                                <p className="text-[11px] text-rose-800 dark:text-rose-300 mt-1 leading-normal font-medium italic">
                                  "{issue.resolvedNote}"
                                </p>
                              </div>
                            )}

                            {/* Fixed proof panel for resolved */}
                            {issue.status === "resolved" && issue.resolvedPhotoUrl && (
                              <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs text-left">
                                <h5 className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1 mb-2">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  ✅ Resolution Proof
                                </h5>
                                {renderMedia(issue.resolvedPhotoUrl, "w-full aspect-video object-cover rounded-lg border mb-2 border-emerald-200 dark:border-emerald-900/40")}
                                <div className="p-2 rounded border bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900/40">
                                  <p className="text-[9px] text-slate-600 dark:text-slate-600 font-bold uppercase">Officer Note:</p>
                                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5 font-medium leading-normal">
                                    "{issue.resolvedNote}"
                                  </p>
                                  {issue.resolvedDate && (
                                    <p className="text-[9px] text-slate-600 dark:text-slate-600 mt-1">
                                      ðŸ“… Resolved on: {new Date(issue.resolvedDate).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Interactive Voting Panel */}
                            {issue.status !== "resolved" && issue.status !== "rejected" ? (
                              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-[10px] text-slate-600 dark:text-slate-600 font-semibold uppercase">Cast priority vote</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleVote(issue.id, "up")}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                      userHasUpvoted
                                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-600"
                                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300"
                                    }`}
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                    Upvote ({issue.upvotes.length})
                                  </button>

                                  <button
                                    onClick={() => handleVote(issue.id, "down")}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                      userHasDownvoted
                                        ? "bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/50 text-rose-700 dark:text-rose-600"
                                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300"
                                    }`}
                                  >
                                    <ThumbsDown className="w-3.5 h-3.5" />
                                    Downvote ({issue.downvotes.length})
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-600">
                                <span>No voting allowed (Closed case)</span>
                                <span className="font-bold text-slate-500 dark:text-slate-600 font-mono">Score: {issue.upvotes.length - issue.downvotes.length}</span>
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          )}

          {/* --- CONTENT 4: LEADERBOARD --- */}
          {activeFeature === "leaderboard" && (
            <div>
              <div className="mb-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-xl p-4 flex gap-3.5 items-start">
                <div className="p-2 bg-purple-600 text-white rounded-lg">
                  <Trophy className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-purple-900 dark:text-purple-300">How do JantaPoints work?</h4>
                  <p className="text-xs text-purple-700 dark:text-purple-400 leading-relaxed mt-1">
                    To encourage civic duty, points are awarded immediately once an issue turns into <strong className="text-purple-900 dark:text-purple-300 font-bold">Accepted</strong> status:
                    <br />
                    - Low risk problem: <strong className="text-purple-900 dark:text-purple-200 font-bold">+10 points</strong>
                    <br />
                    - Moderate risk problem: <strong className="text-purple-955 dark:text-purple-200 font-bold">+20 points</strong>
                    <br />
                    - High risk problem: <strong className="text-purple-955 dark:text-purple-200 font-bold">+50 points</strong>
                    <br />
                    - Very emergency problem: <strong className="text-purple-955 dark:text-purple-200 font-bold">+100 points</strong>
                  </p>
                </div>
              </div>

              {/* Current User Rank & Points Card */}
              {(() => {
                // Dense ranking: same points = same rank
                let myGlobalRank: number | string = "Unranked";
                let currentRank = 1;
                for (let i = 0; i < users.length; i++) {
                  if (i > 0 && users[i].points !== users[i - 1].points) {
                    currentRank = currentRank + 1;
                  }
                  if (users[i].phone === currentUser.phone) {
                    myGlobalRank = currentRank;
                    break;
                  }
                }
                return (
                  <div className="mb-6 p-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-mono font-black text-lg shadow-md shadow-blue-600/20 border border-blue-400/25">
                        {typeof myGlobalRank === "number" ? `#${myGlobalRank}` : "—"}
                      </div>
                      <div>
                        <span className="text-[10px] text-blue-500 dark:text-blue-400 block font-bold uppercase tracking-wider">Your Standings Rank</span>
                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                          {typeof myGlobalRank === "number" ? `Ranked #${myGlobalRank} out of ${users.length} citizens` : "Not ranked yet"}
                        </h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-blue-100/50 dark:border-indigo-950/50 p-2.5 px-4 rounded-xl shadow-inner">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-600 tracking-wide uppercase">Your Points:</span>
                      <span className="font-mono font-black text-slate-805 dark:text-yellow-300 text-base">{currentUser.points}</span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-600 font-bold uppercase">pts</span>
                    </div>
                  </div>
                );
              })()}

              {/* Leaderboard Table Search */}
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="text"
                  placeholder="Search citizen standings by name or phone..."
                  value={leaderboardSearch}
                  onChange={(e) => setLeaderboardSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Leaderboard Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                        <th className="p-4 py-3">Rank</th>
                        <th className="p-4 py-3">Citizen Name</th>
                        <th className="p-4 py-3 text-center">Accepted Issues</th>
                        <th className="p-4 py-3 text-right">JantaPoints</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {(() => {
                        const sorted = [...users];
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                        .map((usr) => {
                          const isMe = usr.phone === currentUser.phone;
                          return (
                            <tr
                              key={usr.phone}
                            className={`transition-all duration-200 ${
                              isMe ? "bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/50 font-semibold" : "hover:bg-slate-50 dark:hover:bg-slate-850/50"
                            }`}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-1.5">
                                {usr.globalRank === 1 && <span className="text-xs font-black text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded">1st</span>}
                                {usr.globalRank === 2 && <span className="text-xs font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">2nd</span>}
                                {usr.globalRank === 3 && <span className="text-xs font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">3rd</span>}
                                <span className="font-mono text-slate-500 dark:text-slate-600">#{usr.globalRank}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-800 dark:text-slate-200">{usr.name}</span>
                                {isMe && (
                                  <span className="bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                    You
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-center text-slate-600 dark:text-slate-300 font-bold">
                              {usr.acceptedCount}
                            </td>
                            <td className="p-4 text-right">
                              <span className="font-mono font-black text-slate-800 dark:text-slate-100 text-sm">{usr.points}</span>
                              <span className="text-[10px] text-slate-600 dark:text-slate-600 font-bold uppercase ml-1">pts</span>
                            </td>
                          </tr>
                        );
                      });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}


