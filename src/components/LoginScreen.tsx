import React, { useState } from "react";
import { Building2, Smartphone, Shield, User, Phone, Lock, Sparkles, MessageSquare, Check, ArrowRight, CheckCircle, AlertTriangle, MapPin, Loader2, Trophy, X } from "lucide-react";
import { User as UserType } from "../types";
import Logo from "./Logo";

interface LoginScreenProps {
  onLoginSuccess: (user: UserType) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<"citizen" | "authority">("citizen");
  const [activeFeatureInfo, setActiveFeatureInfo] = useState<"voice" | "location" | "loop" | "points" | null>(null);

  // Citizen states
  const [citizenName, setCitizenName] = useState("");
  const [citizenPhone, setCitizenPhone] = useState("");
  const [showOtpField, setShowOtpField] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpSentToast, setOtpSentToast] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [receivedOtp, setReceivedOtp] = useState("");

  // Authority states
  const [govtId, setGovtId] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleCitizenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenName || !citizenPhone) return;

    if (citizenPhone.length !== 10 || isNaN(Number(citizenPhone))) {
      setOtpError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setOtpError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: citizenPhone }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (response.ok && data.success) {
        setShowOtpField(true);
        setOtpSentToast(true);
        if (data.otp) {
          setReceivedOtp(data.otp);
        }
        // Auto dismiss toast after 10s
        setTimeout(() => setOtpSentToast(false), 10000);
      } else {
        setOtpError(data.error || "Failed to request OTP. Please try again.");
      }
    } catch (err) {
      setIsLoading(false);
      setOtpError("Network error. Failed to request OTP.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpValue) return;

    setOtpError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/citizen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: citizenName, phone: citizenPhone, otp: otpValue }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (response.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setOtpError(data.error || "Login failed. Incorrect OTP.");
      }
    } catch (err) {
      setIsLoading(false);
      setOtpError("Network error. Failed to reach JantaMitra server.");
    }
  };

  const handleAuthoritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!govtId || !authPassword) return;

    setAuthError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/authority", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ govtId, password: authPassword }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (response.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setAuthError(data.error || "Invalid Government ID or Password.");
      }
    } catch (err) {
      setIsLoading(false);
      setAuthError("Network error. Failed to reach JantaMitra server.");
    }
  };

  const autoFillAuthority = (id: string, pass: string) => {
    setGovtId(id);
    setAuthPassword(pass);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between relative overflow-hidden font-sans text-slate-900">

      {/* Subtle top blue accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-blue-700 pointer-events-none" />

      {/* Simulated OTP Notification Banner */}
      {otpSentToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700/50 p-4 animate-bounce flex items-start gap-3">
          <div className="p-2 bg-blue-500 rounded-lg shrink-0">
            <MessageSquare className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">SMS Gateway Dispatch</span>
              <span className="text-[10px] text-slate-400">Just now</span>
            </div>
            <p className="text-xs text-slate-200 mt-1 leading-normal">
              A verification OTP code has been dispatched to <strong className="text-blue-300 font-bold">+91 {citizenPhone}</strong>. Please check your physical mobile device.
            </p>
            {receivedOtp && (
              <div className="mt-3 p-2.5 bg-slate-800 border border-slate-700/60 rounded-xl text-center flex flex-col items-center justify-center gap-1.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Active OTP (Fallback/Demo Mode)</span>
                <span className="text-2xl font-black text-emerald-400 tracking-widest">{receivedOtp}</span>
                <span className="text-[10px] text-amber-300 leading-normal max-w-xs mt-0.5 font-medium">
                  Twilio account limit exceeded so that OTP will not be coming to your phone. Please enter this OTP.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center shadow-md border border-slate-100 dark:border-slate-800 relative overflow-hidden transition-colors group">
            <Logo className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5 leading-none">
              JantaMitra
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-extrabold tracking-widest border border-blue-400/20 shadow-sm animate-bounce">
                AI
              </span>
            </h1>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mt-1">Civic Improvement Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:flex flex-col items-end gap-1">
            <span className="text-[10px] bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/20 dark:border-blue-500/30 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
              HACKATHON COLLABORATION
            </span>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-widest">BY KRESHA VORA</p>
          </div>


        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-6 z-10">

        {/* Left Hand: Explanatory Landing Card */}
        <div className="lg:col-span-7 flex flex-col justify-center text-left lg:pr-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-sky-50 dark:from-indigo-950/40 dark:to-sky-950/40 border border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold w-fit shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin duration-[3000ms]" />
            <span>AI-Driven Civic Grievance Resolution</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-black text-slate-800 dark:text-white tracking-tight leading-[1.15]">
            Empowering Citizens. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500">
              Accelerating Justice.
            </span>
          </h2>

          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed">
            Report local public issues such as damaged roads, broken streetlights, or waste piles, and watch them get addressed in real-time. Powering citizen engagement with automated translation, category recognition, and risk classification.
          </p>

          {/* Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl pt-2">

            <button
              onClick={() => setActiveFeatureInfo("voice")}
              className="w-full flex gap-3.5 items-start p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 shadow-md hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 hover:ring-4 hover:ring-blue-500/5 transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer text-left focus:outline-none"
            >
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-600 dark:group-hover:text-white transition-colors duration-300">
                <Smartphone className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Multilingual AI Voice Input
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  Speak in Hindi, Tamil, Telugu, Bengali etc. AI translates & logs details instantly.
                </p>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold flex items-center gap-1 mt-1.5 hover:underline">
                  How it works &rarr;
                </span>
              </div>
            </button>

            <button
              onClick={() => setActiveFeatureInfo("location")}
              className="w-full flex gap-3.5 items-start p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 shadow-md hover:shadow-xl hover:border-sky-400 dark:hover:border-sky-500 hover:ring-4 hover:ring-sky-500/5 transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer text-left focus:outline-none"
            >
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5 group-hover:bg-sky-600 group-hover:text-white dark:group-hover:bg-sky-600 dark:group-hover:text-white transition-colors duration-300">
                <MapPin className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors">
                  Real-Time Geolocation
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                  Automatic street coordinates, district mapping, and pin-point GPS accuracy.
                </p>
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-extrabold flex items-center gap-1 mt-1.5 hover:underline">
                  How it works &rarr;
                </span>
              </div>
            </button>

            <button
              onClick={() => setActiveFeatureInfo("loop")}
              className="w-full flex gap-3.5 items-start p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 shadow-md hover:shadow-xl hover:border-emerald-400 dark:hover:border-emerald-500 hover:ring-4 hover:ring-emerald-500/5 transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer text-left focus:outline-none"
            >
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:bg-emerald-600 dark:group-hover:text-white transition-colors duration-300">
                <CheckCircle className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  Citizen Verification Loop
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                  Marked solutions are verified through citizen votes before final closure.
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1 mt-1.5 hover:underline">
                  How it works &rarr;
                </span>
              </div>
            </button>

            <button
              onClick={() => setActiveFeatureInfo("points")}
              className="w-full flex gap-3.5 items-start p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 shadow-md hover:shadow-xl hover:border-purple-400 dark:hover:border-purple-500 hover:ring-4 hover:ring-purple-500/5 transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer text-left focus:outline-none"
            >
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5 group-hover:bg-purple-600 group-hover:text-white dark:group-hover:bg-purple-600 dark:group-hover:text-white transition-colors duration-300">
                <Trophy className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                  Earn JantaPoints
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                  Accumulate points based on the risk category and priority of your accepted issues.
                </p>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-extrabold flex items-center gap-1 mt-1.5 hover:underline">
                  How it works &rarr;
                </span>
              </div>
            </button>

          </div>
        </div>

        {/* Right Hand: Interactive Login Panel */}
        <div className="lg:col-span-5 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 sm:p-8 flex flex-col transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent pointer-events-none rounded-bl-3xl" />

          {/* Tabs header */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl mb-6 border border-slate-200/50 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => {
                setActiveTab("citizen");
                setShowOtpField(false);
                setOtpError("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${activeTab === "citizen"
                ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-200/20 dark:border-slate-700/20"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
            >
              <Smartphone className="w-4.5 h-4.5" />
              Citizen Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("authority");
                setAuthError("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${activeTab === "authority"
                ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-200/20 dark:border-slate-700/20"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
            >
              <Shield className="w-4.5 h-4.5" />
              Govt. Authority
            </button>
          </div>

          {/* Tab 1: Citizen Login */}
          {activeTab === "citizen" && (
            <div className="flex-1 flex flex-col justify-center animate-fadeIn">
              <div className="text-center mb-6">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Citizen Authentication</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Log in securely using your mobile number and SMS OTP.</p>
              </div>

              {!showOtpField ? (
                // Step 1: Send OTP
                <form onSubmit={handleCitizenSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">Your Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rajesh Kumar"
                        value={citizenName}
                        onChange={(e) => setCitizenName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">Mobile Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <div className="absolute left-10 top-1/2 transform -translate-y-1/2 text-xs text-slate-400 font-bold border-r border-slate-200 dark:border-slate-700 pr-2">+91</div>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="Enter 10-digit number"
                        value={citizenPhone}
                        onChange={(e) => setCitizenPhone(e.target.value.replace(/\D/g, ""))}
                        className="w-full pl-20 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 tracking-wide"
                      />
                    </div>
                  </div>

                  {otpError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2 animate-fadeIn">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                      {otpError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || !citizenName || !citizenPhone}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/10 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-0"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating OTP...
                      </>
                    ) : (
                      <>
                        Request OTP SMS
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                // Step 2: Verify OTP
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 mb-2">
                    <p className="text-xs text-blue-900 dark:text-blue-300 leading-normal">
                      We have sent a verification code to <strong className="font-bold text-blue-950 dark:text-blue-200">+91 {citizenPhone}</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowOtpField(false)}
                      className="text-xs text-blue-600 dark:text-blue-400 font-extrabold hover:underline mt-1 cursor-pointer"
                    >
                      Change Mobile Number
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">Enter 4-Digit OTP</label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      placeholder="••••"
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                      className="w-full text-center py-3 rounded-xl border-2 border-blue-200 dark:border-indigo-800 text-xl font-black tracking-widest focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 text-center mt-1.5 font-medium">Enter the 4-digit code shown in the SMS toast banner</p>
                  </div>

                  {otpError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2 animate-fadeIn">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                      {otpError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || otpValue.length !== 4}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/10 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-0"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify & Log In
                        <CheckCircle className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Tab 2: Authority Login */}
          {activeTab === "authority" && (
            <div className="flex-1 flex flex-col justify-center animate-fadeIn">
              <div className="text-center mb-6">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Authority Access Gate</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Authorized municipal corporation officials access only.</p>
              </div>

              <form onSubmit={handleAuthoritySubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">Govt. Official ID</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. GOVT-1234"
                      value={govtId}
                      onChange={(e) => setGovtId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Enter security password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2 animate-fadeIn">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !govtId || !authPassword}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/10 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking ID...
                    </>
                  ) : (
                    <>
                      Verify Authority Credentials
                      <Lock className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Quick Credentials Presets Box */}
                <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80">
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider mb-2.5">Demo Presets (Tap to Autofill)</p>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => autoFillAuthority("GOVT-1234", "authority")}
                      className="text-left w-full p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow dark:hover:shadow-indigo-950/50 transition-all text-xs font-bold text-slate-700 dark:text-slate-200 flex justify-between items-center cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        Officer Saxena
                      </span>
                      <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40">GOVT-1234</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => autoFillAuthority("GOVT-5678", "authority")}
                      className="text-left w-full p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow dark:hover:shadow-indigo-950/50 transition-all text-xs font-bold text-slate-700 dark:text-slate-200 flex justify-between items-center cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Director Iyer
                      </span>
                      <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40">GOVT-5678</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-900 border-t border-slate-800 dark:border-slate-950 text-slate-400 py-10 mt-16 z-10 animate-fadeIn transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-start text-xs leading-relaxed">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-pulse" />
              <h5 className="font-extrabold text-slate-200 uppercase tracking-widest">JantaMitra AI</h5>
            </div>
            <p className="text-slate-400 font-medium">
              An advanced AI-powered civic grievance logging and translation system. Created as a hackathon submission by Kresha Vora.
            </p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-slate-200 uppercase tracking-wider">Developer Credit</h5>
            <p className="text-slate-400 font-medium">
              Designed and built for hackathon evaluation:
            </p>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-400 font-bold px-2.5 py-1 rounded-lg border border-blue-500/30 font-mono text-[11px]">
                Developer: Kresha Vora
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-slate-200 uppercase tracking-wider">Project Infrastructure</h5>
            <p className="text-slate-400 font-medium">
              Powered by Google Gemini models for multilingual text parsing, priority classification, and risk categorization.
            </p>
            <p className="text-[10px] text-slate-500 font-mono">Submission Version: 1.0_hackathon</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-8 pt-6 border-t border-slate-800/60 dark:border-slate-800/20 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 gap-4">
          <p>© 2026 JantaMitra AI Portal. Created by Kresha Vora for Hackathon Evaluation.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Hyperlinking Policy</a>
          </div>
        </div>
      </footer>

      {/* Feature Walkthrough Modal Overlay */}
      {activeFeatureInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative animate-scaleUp">
            <button
              onClick={() => setActiveFeatureInfo(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-0 bg-transparent"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>

            {activeFeatureInfo === "voice" && (
              <div>
                <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 p-6 flex items-end">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Multilingual AI Voice Input</h3>
                      <p className="text-xs text-blue-100">AI-driven auto-translation and parsing</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5 font-mono">Overview</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Eliminating language barriers for civic action. JantaMitra AI enables local citizens to report issues simply by speaking in their native tongue. No keyboard input required.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2 font-mono">Technological Framework</h4>
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        Powered by <strong className="font-bold text-slate-800 dark:text-slate-100">Google Gemini Flash 1.5 Models</strong> for natural language processing, priority classification, and risk categorization.
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2.5 font-mono">Workflow Steps</h4>
                    <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                        <div>
                          <strong className="font-bold text-slate-800 dark:text-slate-200">Voice Capture:</strong> Citizen speaks naturally inside the portal.
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                        <div>
                          <strong className="font-bold text-slate-800 dark:text-slate-200">AI Context Analysis:</strong> Gemini transcribes, translates to English, and categorizes (e.g., Road vs Sanitation).
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                        <div>
                          <strong className="font-bold text-slate-800 dark:text-slate-200">Municipal Dispatch:</strong> The issue logs automatically onto the corresponding administrative ward dashboard.
                        </div>
                      </li>
                    </ol>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="text-[11px] text-slate-500 italic">
                      Example: "છેલ્લા ૩ મહિનાથી અમારા વિસ્તારમાં પાણી સમયસર નથી આવતું." &rarr; Water Grievance
                    </div>
                    <button
                      onClick={() => setActiveFeatureInfo(null)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/10 cursor-pointer border-0"
                    >
                      Back to Login
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureInfo === "location" && (
              <div>
                <div className="h-32 bg-gradient-to-r from-sky-500 to-indigo-600 p-6 flex items-end">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Precise Real-Time Geolocation</h3>
                      <p className="text-xs text-sky-100">Automated street coordinate routing</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1.5 font-mono">Overview</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Eliminating manual location errors. In JantaMitra, every grievance filed is automatically appended with coordinates and translated to a real municipal district name to route correctly.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-2 font-mono">Technological Framework</h4>
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-sky-500 shrink-0" />
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        Utilizes <strong className="font-bold text-slate-800 dark:text-slate-100">OpenStreetMap API & Leaflet JS</strong> to parse latitude/longitude and compute administrative municipal zones.
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-2.5 font-mono">Zone Boundaries</h4>
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
                      <p>Issues are dynamically sorted based on areas to ensure fast localized response:</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {["Gujarat", "Kolkata", "Thakkarnagar", "Ahmedabad", "Bidhannagar"].map((loc) => (
                          <span key={loc} className="px-2 py-0.5 bg-sky-100 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-900 text-sky-700 dark:text-sky-300 rounded text-[10px] font-bold font-mono">
                            {loc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="text-[11px] text-slate-500 italic">
                      Supports offline GPS and network-based geocoding
                    </div>
                    <button
                      onClick={() => setActiveFeatureInfo(null)}
                      className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-600/10 cursor-pointer border-0"
                    >
                      Back to Login
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureInfo === "loop" && (
              <div>
                <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600 p-6 flex items-end">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Citizen Verification Loop</h3>
                      <p className="text-xs text-emerald-100">Democratic consensus resolution</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5 font-mono">Overview</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Preventing fraudulent job closures. When authorities solve an issue and mark it done, nearby citizens must physical-verify the fix through upvotes or downvotes before the issue is closed.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 font-mono">Double Verification Rules</h4>
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
                      <Shield className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        Authorities must supply a <strong className="font-bold text-slate-800 dark:text-slate-100">photographic proof of resolution</strong>. The issue goes into "Resolved (Pending Verification)" status until citizen verification criteria is met.
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2.5 font-mono">Why it builds trust</h4>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 list-disc pl-4">
                      <li>Decentralizes the verification of government work.</li>
                      <li>Incentivizes citizens to inspect public utilities in their locality.</li>
                      <li>Avoids premature closure and reduces municipal audit costs.</li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="text-[11px] text-slate-500 italic">
                      Citizens earn extra points for verifying local resolutions
                    </div>
                    <button
                      onClick={() => setActiveFeatureInfo(null)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/10 cursor-pointer border-0"
                    >
                      Back to Login
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureInfo === "points" && (
              <div>
                <div className="h-32 bg-gradient-to-r from-purple-500 to-pink-600 p-6 flex items-end">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Earn JantaPoints</h3>
                      <p className="text-xs text-purple-100">Gamified civic responsibility rewards</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1.5 font-mono">Overview</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Civic pride meets rewards. JantaPoints gamifies municipal reporting. Active citizens climbing the leaderboard receive social recognition and prioritize community contribution.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2.5 font-mono">Points Structure</h4>
                    <table className="min-w-full text-xs text-left border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        <tr>
                          <th className="px-4 py-2">Action / Issue Risk</th>
                          <th className="px-4 py-2">JantaPoints</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        <tr>
                          <td className="px-4 py-2 font-medium">Filing High-Risk Issue (e.g. Live Wires)</td>
                          <td className="px-4 py-2 font-mono font-bold text-green-600 dark:text-green-400">100 pts</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium">Filing Medium-Risk Issue (e.g. Water Leakage)</td>
                          <td className="px-4 py-2 font-mono font-bold text-green-600 dark:text-green-400">50 pts</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium">Filing Low-Risk Issue (e.g. Potholes)</td>
                          <td className="px-4 py-2 font-mono font-bold text-green-600 dark:text-green-400">20 pts</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium">Successful Issue Verification</td>
                          <td className="px-4 py-2 font-mono font-bold text-green-600 dark:text-green-400">10 pts</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2 font-mono">Leaderboard Inclusion</h4>
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Only active citizens with <strong className="font-bold text-indigo-600 dark:text-blue-400">greater than 0 points</strong> are featured on the community leaderboard, ensuring that constructive participation remains highlighted.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="text-[11px] text-slate-500 italic">
                      Rankings are updated dynamically in real-time
                    </div>
                    <button
                      onClick={() => setActiveFeatureInfo(null)}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-600/10 cursor-pointer border-0"
                    >
                      Back to Login
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
