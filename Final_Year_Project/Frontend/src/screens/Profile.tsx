import React, { useEffect, useRef } from 'react';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { useSkillAnalyzer } from '../hooks/useSkillAnalyzer';
import Header from '../components/Header';
import UserInfoCard from '../components/profile/UserInfoCard';
import RoadmapCard from '../components/profile/RoadmapCard';
import RoadmapDetailModal from '../components/profile/RoadmapDetailModal';
import SavedSkillRoadmapCard from '../components/skillAnalyzer/SavedSkillRoadmapCard';
import SkillRoadmapDetailModal from '../components/skillAnalyzer/SkillRoadmapDetailModal';
import { Map, ArrowRight, Sparkles, Target, TrendingUp } from 'lucide-react';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const hasFetchedRef = useRef(false);
  const hasFetchedSkillRef = useRef(false);

  const {
    userRoadmaps,
    loading,
    error,
    selectedUserRoadmap,
    roadmapDetail,
    roadmapDetailLoading,
    fetchUserRoadmaps,
    openRoadmapDetail,
    updateWeekProgress,
    deleteRoadmap,
    closeRoadmapDetail,
  } = useProfile();

  const {
    userSkillRoadmaps,
    userSkillRoadmapsLoading,
    userSkillRoadmapsError,
    selectedSkillRoadmap,
    skillRoadmapDetail,
    skillRoadmapDetailLoading,
    fetchUserSkillRoadmaps,
    openSkillRoadmapDetail,
    updateSkillProgress,
    deleteSkillRoadmap,
    closeSkillRoadmapDetail,
  } = useSkillAnalyzer();

  useEffect(() => {
    if (user?.id && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchUserRoadmaps(user.id);
    }
  }, [user?.id, fetchUserRoadmaps]);

  useEffect(() => {
    if (user?.id && !hasFetchedSkillRef.current) {
      hasFetchedSkillRef.current = true;
      fetchUserSkillRoadmaps(user.id);
    }
  }, [user?.id, fetchUserSkillRoadmaps]);

  const handleViewDetails = (userRoadmap: any) => {
    openRoadmapDetail(userRoadmap);
  };

  const handleDelete = (userRoadmapId: string) => {
    deleteRoadmap(userRoadmapId);
  };

  const handleSkillViewDetails = (userSkillRoadmap: any) => {
    openSkillRoadmapDetail(userSkillRoadmap);
  };

  const handleSkillDelete = (userSkillRoadmapId: string) => {
    deleteSkillRoadmap(userSkillRoadmapId);
  };

  const handleSkillProgress = (userSkillRoadmapId: string, skill: string, isCompleted: boolean) => {
    updateSkillProgress(userSkillRoadmapId, skill, isCompleted);
  };

  return (
    <SignedIn>
      <div className="min-h-screen bg-background flex flex-col font-body overflow-x-hidden">
        <Header />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow">
          {/* Error Alert */}
          {error && (
            <div className="mb-8 p-4 rounded-xl bg-error/5 border border-error/20">
              <p className="text-sm font-body text-error">{error}</p>
            </div>
          )}

          {/* User Profile Card */}
          <UserInfoCard totalRoadmaps={userRoadmaps.length} totalSkillAnalyses={userSkillRoadmaps.length} />

          {/* Roadmaps Section */}
          <div className="mt-10">
            {/* Section Header */}
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-body font-bold text-on-background tracking-tight">
                My Roadmaps
              </h2>
              {userRoadmaps.length > 0 && (
                <button
                  onClick={() => navigate('/roadmap')}
                  className="hidden sm:flex items-center gap-1.5 text-sm font-label font-semibold text-primary hover:text-primary-container transition-colors"
                >
                  Explore New Paths
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 rounded-full border-2 border-outline-variant/30 border-t-primary animate-spin" />
                <p className="text-sm font-label text-outline mt-4">
                  Loading your roadmaps…
                </p>
              </div>
            ) : userRoadmaps.length === 0 ? (
              /* Empty State */
              <div className="rounded-2xl border border-outline-variant/20 bg-card p-12 md:p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Map className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-body font-bold text-on-background mb-3">
                  Begin Your Journey
                </h3>
                <p className="text-base font-body text-on-surface-variant mb-8 max-w-md mx-auto leading-relaxed">
                  Generate your first personalized learning roadmap tailored to your dream company and role.
                </p>
                <button
                  onClick={() => navigate('/roadmap')}
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-primary hover:bg-primary-container text-white font-label font-semibold uppercase tracking-wider text-sm rounded-lg transition-colors shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Roadmap
                </button>
              </div>
            ) : (
              /* Roadmap Grid */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {userRoadmaps.map((userRoadmap) => (
                  <RoadmapCard
                    key={userRoadmap._id}
                    userRoadmap={userRoadmap}
                    onViewDetails={handleViewDetails}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Skill Analyses Section */}
          <div className="mt-12">
            {/* Section Header */}
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-body font-bold text-on-background tracking-tight">
                My Skill Analyses
              </h2>
              {userSkillRoadmaps.length > 0 && (
                <button
                  onClick={() => navigate('/skills')}
                  className="hidden sm:flex items-center gap-1.5 text-sm font-label font-semibold text-primary hover:text-primary-container transition-colors"
                >
                  Analyze New Resume
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Content */}
            {userSkillRoadmapsLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 rounded-full border-2 border-outline-variant/30 border-t-primary animate-spin" />
                <p className="text-sm font-label text-outline mt-4">
                  Loading your skill analyses…
                </p>
              </div>
            ) : userSkillRoadmaps.length === 0 ? (
              /* Empty State */
              <div className="rounded-2xl border border-outline-variant/20 bg-card p-12 md:p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-body font-bold text-on-background mb-3">
                  Discover Your Skill Gaps
                </h3>
                <p className="text-base font-body text-on-surface-variant mb-8 max-w-md mx-auto leading-relaxed">
                  Upload your resume to identify skill gaps and get a personalized learning roadmap for career growth.
                </p>
                <button
                  onClick={() => navigate('/skills')}
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-primary to-primary-container text-white font-label font-semibold uppercase tracking-wider text-sm rounded-lg transition-colors shadow-sm"
                >
                  <TrendingUp className="w-4 h-4" />
                  Analyze Resume
                </button>
              </div>
            ) : (
              /* Skill Roadmap Grid */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {userSkillRoadmaps.map((roadmap) => (
                  <SavedSkillRoadmapCard
                    key={roadmap._id}
                    roadmap={roadmap}
                    onOpen={handleSkillViewDetails}
                    onDelete={handleSkillDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Roadmap Detail Modal */}
        {selectedUserRoadmap && (
          <RoadmapDetailModal
            userRoadmap={selectedUserRoadmap}
            roadmapDetail={roadmapDetail}
            loading={roadmapDetailLoading}
            onClose={closeRoadmapDetail}
            onUpdateProgress={(userRoadmapId, weekNumber, isCompleted, subProgress) =>
              updateWeekProgress(userRoadmapId, weekNumber, isCompleted, subProgress)
            }
            onDelete={deleteRoadmap}
          />
        )}

        {/* Skill Roadmap Detail Modal */}
        {selectedSkillRoadmap && skillRoadmapDetail && (
          <SkillRoadmapDetailModal
            userSkillRoadmap={selectedSkillRoadmap}
            analysis={skillRoadmapDetail}
            onClose={closeSkillRoadmapDetail}
            onSkillToggle={(skill, isCompleted) =>
              handleSkillProgress(selectedSkillRoadmap._id, skill, isCompleted)
            }
          />
        )}
      </div>
    </SignedIn>
  );
};

export default Profile;