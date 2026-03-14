import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Rocket, Sun, Moon } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/clerk-react";
import { useAtom } from "jotai";
import { themeAtom, toggleThemeAtom } from "../store/themeAtom";

const Header: React.FC = () => {
  const location = useLocation();
  const [theme] = useAtom(themeAtom);
  const [, toggleTheme] = useAtom(toggleThemeAtom);

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 w-full">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-glow">
              <Rocket size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              LearnLaunch
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/home"
              className={`px-1 py-5 font-medium transition-colors ${
                location.pathname === "/home"
                  ? "text-indigo-500 font-semibold border-b-2 border-indigo-500"
                  : "text-slate-500 dark:text-slate-400 hover:text-indigo-500"
              }`}
            >
              Explore
            </Link>
            <Link
              to="/roadmap"
              className={`px-1 py-5 font-medium transition-colors ${
                location.pathname === "/roadmap"
                  ? "text-indigo-500 font-semibold border-b-2 border-indigo-500"
                  : "text-slate-500 dark:text-slate-400 hover:text-indigo-500"
              }`}
            >
              Roadmap
            </Link>
            <Link
              to="/chat"
              className={`px-1 py-5 font-medium transition-colors ${
                location.pathname === "/chat"
                  ? "text-indigo-500 font-semibold border-b-2 border-indigo-500"
                  : "text-slate-500 dark:text-slate-400 hover:text-indigo-500"
              }`}
            >
              Chat
            </Link>
            <Link
              to="/profile"
              className={`px-1 py-5 font-medium transition-colors ${
                location.pathname === "/profile"
                  ? "text-indigo-500 font-semibold border-b-2 border-indigo-500"
                  : "text-slate-500 dark:text-slate-400 hover:text-indigo-500"
              }`}
            >
              Profile
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={() => toggleTheme()}
              className="rounded-full p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Show when logged OUT */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950">
                  Login
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                  Signup
                </button>
              </SignUpButton>
            </SignedOut>

            {/* Show when logged IN */}
            <SignedIn>
              <UserButton afterSignOutUrl="/login" />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
