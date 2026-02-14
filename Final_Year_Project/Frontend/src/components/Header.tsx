import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Rocket } from 'lucide-react';

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
              to="/"
              className={`px-1 py-5 font-medium transition-colors ${location.pathname === '/' ? 'text-indigo-500 font-semibold border-b-2 border-indigo-500' : 'text-slate-500 hover:text-indigo-500'}`}
            >
              Explore
            </Link>
            <Link
              to="/roadmap"
              className={`px-1 py-5 font-medium transition-colors ${location.pathname === '/roadmap' ? 'text-indigo-500 font-semibold border-b-2 border-indigo-500' : 'text-slate-500 hover:text-indigo-500'}`}
            >
              Roadmap
            </Link>
            <a href="#" className="text-slate-500 hover:text-indigo-500 font-medium px-1 py-5 transition-colors">
              Chat
            </a>
            <a href="#" className="text-slate-500 hover:text-indigo-500 font-medium px-1 py-5 transition-colors">
              Profile
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full text-slate-400 hover:bg-slate-100 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-500 p-[2px] cursor-pointer hover:scale-105 transition-transform">
              <img 
                src="https://picsum.photos/100/100" 
                alt="User Profile" 
                className="w-full h-full rounded-full object-cover border-2 border-white"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
