import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Rocket } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/clerk-react";

const Header: React.FC = () => {
  const location = useLocation();
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-glow">
              <Rocket size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              LearnLaunch
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/home"
              className={`px-1 py-5 font-medium transition-colors ${location.pathname === "/" ? "text-indigo-500 font-semibold border-b-2 border-indigo-500" : "text-slate-500 hover:text-indigo-500"}`}
            >
              Explore
            </Link>
            <Link
              to="/roadmap"
              className={`px-1 py-5 font-medium transition-colors ${location.pathname === "/roadmap" ? "text-indigo-500 font-semibold border-b-2 border-indigo-500" : "text-slate-500 hover:text-indigo-500"}`}
            >
              Roadmap
            </Link>
            <a
              href="#"
              className="text-slate-500 hover:text-indigo-500 font-medium px-1 py-5 transition-colors"
            >
              Chat
            </a>
            <a
              href="#"
              className="text-slate-500 hover:text-indigo-500 font-medium px-1 py-5 transition-colors"
            >
              Profile
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Show when logged OUT */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50">
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
