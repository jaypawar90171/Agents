import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Sun, Moon, Search, Menu } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/clerk-react";
import { useAtom } from "jotai";
import { themeAtom, toggleThemeAtom } from "../store/themeAtom";
import { searchQueryAtom } from '../store/store';

const Header: React.FC = () => {
  const location = useLocation();
  const [theme] = useAtom(themeAtom);
  const [, toggleTheme] = useAtom(toggleThemeAtom);
  const [query, setQuery] = useAtom(searchQueryAtom);

  return (
    <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm dark:shadow-none docked full-width top-0 sticky z-50">
      <nav className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto w-full">
        {/* Brand & Nav */}
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-headline font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            LearnLaunch
          </Link>
          <div className="hidden md:flex items-center gap-6 font-headline text-lg leading-relaxed">
            <Link
              to="/home"
              className={`${
                location.pathname === "/home"
                  ? "text-blue-700 dark:text-blue-400 border-b-2 border-blue-700 dark:border-blue-400 pb-1"
                  : "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
              }`}
            >
              Explore
            </Link>
            <Link
              to="/roadmap"
              className={`${
                location.pathname === "/roadmap"
                  ? "text-blue-700 dark:text-blue-400 border-b-2 border-blue-700 dark:border-blue-400 pb-1"
                  : "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
              }`}
            >
              Roadmap
            </Link>
            <Link
              to="/chat"
              className={`${
                location.pathname === "/chat"
                  ? "text-blue-700 dark:text-blue-400 border-b-2 border-blue-700 dark:border-blue-400 pb-1"
                  : "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
              }`}
            >
              Chat
            </Link>
            <Link
              to="/profile"
              className={`${
                location.pathname === "/profile"
                  ? "text-blue-700 dark:text-blue-400 border-b-2 border-blue-700 dark:border-blue-400 pb-1"
                  : "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
              }`}
            >
              Profile
            </Link>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-4 flex-1 max-w-md ml-auto">
          <div className="relative w-full hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm w-4 h-4" />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary rounded-lg py-2 pl-10 pr-4 text-sm font-body outline-none" 
              placeholder="Search companies, roles, skills..." 
            />
          </div>

          <button className="md:hidden">
            <Menu className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={() => toggleTheme()}
            className="rounded-full flex items-center justify-center p-2 bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Show when logged OUT */}
          <SignedOut>
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <button className="font-label text-xs uppercase tracking-widest text-primary hover:text-primary-container transition-colors py-2 px-3 font-semibold">
                  Log In
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button className="bg-gradient-to-r from-primary to-primary-container text-white px-5 py-2 rounded-lg font-label text-xs uppercase tracking-widest font-bold py-2 px-4 shadow-sm hover:opacity-90 transition-opacity">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </SignedOut>

          {/* Show when logged IN */}
          <SignedIn>
            <UserButton afterSignOutUrl="/login" />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
};

export default Header;

