import React, { useState, useEffect } from "react";
import { Building2, LogOut, Trophy, User, ShieldCheck } from "lucide-react";
import { User as UserType, Issue } from "./types";
import LoginScreen from "./components/LoginScreen";
import CitizenPortal from "./components/CitizenPortal";
import AuthorityPortal from "./components/AuthorityPortal";
import Logo from "./components/Logo";

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  useEffect(() => {
    // Ensure dark class is never present — light mode only
    document.documentElement.classList.remove("dark");
  }, []);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [leaderboardUsers, setLeaderboardUsers] = useState<UserType[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  // Sync data from server
  const fetchIssues = async () => {
    try {
      const response = await fetch("/api/issues");
      if (response.ok) {
        const data = await response.json();
        setIssues(data);
      }
    } catch (err) {
      console.error("Error fetching issues:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setLeaderboardUsers(data);
        
        // If current user is a citizen, update their local score state from server response
        if (currentUser && currentUser.role === "citizen") {
          const freshMe = data.find((u: UserType) => u.phone === currentUser.phone);
          if (freshMe) {
            setCurrentUser(freshMe);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  };

  useEffect(() => {
    fetchIssues();
    fetchUsers();

    // Establish dynamic polling to simulate real-time municipal action sync
    const interval = setInterval(() => {
      fetchIssues();
      fetchUsers();
    }, 4000);

    return () => clearInterval(interval);
  }, [currentUser?.phone]);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(usr) => setCurrentUser(usr)} />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans text-slate-900">
      
      {/* Top Main Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 border-b border-blue-800/60 sticky top-0 z-30 shadow-lg shadow-blue-950/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100/10">
              <Logo className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold text-white tracking-tight">JantaMitra</h1>
                <span className="text-[9px] bg-blue-400/30 border border-blue-300/30 text-blue-100 font-bold px-1 py-0.2 rounded font-mono">
                  AI
                </span>
              </div>
              <p className="text-[9px] text-blue-300/70 font-medium tracking-wide">Civic Grievance Interface</p>
            </div>
          </div>

          {/* User Section Controls */}
          <div className="flex items-center gap-4">
            
            <div className="hidden sm:flex items-center gap-3 bg-white/10 border border-white/10 p-1.5 px-3 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                {currentUser.role === "authority" ? (
                  <ShieldCheck className="w-4 h-4 text-rose-300" />
                ) : (
                  <User className="w-4 h-4 text-indigo-200" />
                )}
              </div>
              <div className="text-left text-xs">
                <p className="font-bold text-white line-clamp-1">{currentUser.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${
                    currentUser.role === "authority" ? "text-red-300" : "text-blue-200"
                  }`}>
                    {currentUser.role}
                  </span>
                  {currentUser.role === "citizen" && (
                    <span className="text-blue-400 text-[10px]">•</span>
                  )}
                  {currentUser.role === "citizen" && (
                    <span className="font-mono font-bold text-yellow-300/90">
                      {currentUser.points} JantaPoints
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile simplified JantaPoints badge */}
            {currentUser.role === "citizen" && (
              <div className="flex sm:hidden items-center gap-1 bg-yellow-400/20 border border-yellow-400/30 p-1 px-2.5 rounded-lg text-xs font-bold text-yellow-200">
                <Trophy className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                <span className="font-mono">{currentUser.points} pts</span>
              </div>
            )}


            {/* Logout trigger */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 p-2 px-3.5 rounded-xl border border-white/10 hover:border-white/20 text-xs font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-all shadow-sm cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-white/50" />
              <span className="hidden md:inline">Sign Out</span>
            </button>

          </div>

        </div>
      </nav>

      {/* Main Container Content */}
      <main className="flex-1 bg-white pb-12">
        {currentUser.role === "citizen" ? (
          <CitizenPortal
            currentUser={currentUser}
            issues={issues}
            users={leaderboardUsers}
            onRefreshIssues={fetchIssues}
            onRefreshUsers={fetchUsers}
          />
        ) : (
          <AuthorityPortal
            currentUser={currentUser}
            issues={issues}
            users={leaderboardUsers}
            onRefreshIssues={fetchIssues}
            onRefreshUsers={fetchUsers}
          />
        )}
      </main>

      {/* Footer Branding */}
      <footer className="w-full bg-blue-950 border-t border-blue-900 text-blue-300 py-6 shrink-0 z-10 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-400 via-sky-400 to-blue-300 rounded-full animate-pulse" />
            <span className="font-bold text-blue-100 tracking-wider">JantaMitra AI Portal - Hackathon Project</span>
          </div>
          <p className="text-blue-400">Created by Kresha Vora | AI-Driven Civic Improvement</p>
          <div className="flex gap-3 text-blue-400 font-semibold">
            <span className="text-[10px] bg-blue-900 px-2 py-0.5 rounded text-blue-300 border border-blue-800 font-mono">VERSION: 1.0</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

