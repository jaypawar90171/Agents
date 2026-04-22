import React from 'react';
import { useAtomValue } from 'jotai';
import {filteredJobsAtom} from '../store/store';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import JobList from '../components/JobList';

const Home: React.FC = () => {
  const jobs = useAtomValue(filteredJobsAtom);

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans overflow-x-hidden">
      <Header />
      
      <main className="max-w-7xl mx-auto px-8 py-10 w-full flex-grow">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Filters Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <section className="flex-1">
            <header className="mb-12 flex justify-between items-end">
              <div>
                <h1 className="font-headline text-4xl text-on-surface mb-2">Top Companies for You</h1>
                <p className="font-body text-on-surface-variant max-w-lg">Discover roles matching your current trajectory at premier global institutions.</p>
              </div>
              <div className="hidden md:block">
                <span className="font-label text-xs uppercase tracking-tighter text-outline">
                  Showing {jobs.length} results
                </span>
              </div>
            </header>

            <JobList />
          </section>
        </div>
      </main>

      <footer className="bg-surface-container-lowest full-width py-12 border-t border-outline-variant/20 mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto w-full">
          <div className="mb-8 md:mb-0">
            <span className="font-headline italic text-on-surface-variant text-xl">LearnLaunch</span>
            <p className="font-label text-xs uppercase tracking-widest text-outline mt-2">© 2026 LearnLaunch. Curating the future of work.</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-4 font-label text-xs uppercase tracking-widest text-outline">
              <a className="hover:underline transition-all hover:text-primary" href="#">Privacy</a>
              <a className="hover:underline transition-all hover:text-primary" href="#">Terms</a>
              <a className="hover:underline transition-all hover:text-primary" href="#">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
