import { useAtom } from 'jotai';
import {
  skillAnalysisAtom,
  skillAnalysisLoadingAtom,
  skillAnalysisErrorAtom,
  skillAnalysisStepAtom,
  userSkillRoadmapsAtom,
  userSkillRoadmapsLoadingAtom,
  userSkillRoadmapsErrorAtom,
  selectedSkillRoadmapAtom,
  skillRoadmapDetailAtom,
  skillRoadmapDetailLoadingAtom,
} from '../store/skillAnalyzerAtoms';
import skillAnalyzerService from '../services/skillAnalyzerService';
import { SkillGapAnalysis, UserSkillRoadmap } from '../types/api';
import { AxiosError } from 'axios';

interface UseSkillAnalyzerReturn {
  skillAnalysis: SkillGapAnalysis | null;
  loading: boolean;
  error: string | null;
  pipelineStep: string;
  userSkillRoadmaps: UserSkillRoadmap[];
  userSkillRoadmapsLoading: boolean;
  userSkillRoadmapsError: string | null;
  selectedSkillRoadmap: UserSkillRoadmap | null;
  skillRoadmapDetail: SkillGapAnalysis | null;
  skillRoadmapDetailLoading: boolean;
  analyzeResume: (file: File) => Promise<void>;
  saveToProfile: (analysis: SkillGapAnalysis, userId: string, fileName: string) => Promise<void>;
  fetchUserSkillRoadmaps: (userId: string) => Promise<void>;
  openSkillRoadmapDetail: (userSkillRoadmap: UserSkillRoadmap) => Promise<void>;
  updateSkillProgress: (
    userSkillRoadmapId: string,
    skill: string,
    isCompleted: boolean,
    notes?: string
  ) => Promise<void>;
  deleteSkillRoadmap: (userSkillRoadmapId: string) => Promise<void>;
  closeSkillRoadmapDetail: () => void;
  clearAnalysis: () => void;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError && err.response?.data?.detail) {
    const detail = err.response.data.detail;
    return typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
      ? detail.map((d: { msg?: string }) => d.msg ?? String(d)).join(', ')
      : String(detail);
  }
  return err instanceof Error ? err.message : 'An error occurred';
}

const PIPELINE_STEPS = [
  'Parsing resume...',
  'Analyzing profile...',
  'Expanding skills...',
  'Matching jobs...',
  'Finding gaps...',
  'Validating gaps...',
  'Fetching resources...',
  'Building roadmap...',
];

export const useSkillAnalyzer = (): UseSkillAnalyzerReturn => {
  const [skillAnalysis, setSkillAnalysis] = useAtom(skillAnalysisAtom);
  const [loading, setLoading] = useAtom(skillAnalysisLoadingAtom);
  const [error, setError] = useAtom(skillAnalysisErrorAtom);
  const [pipelineStep, setPipelineStep] = useAtom(skillAnalysisStepAtom);
  const [userSkillRoadmaps, setUserSkillRoadmaps] = useAtom(userSkillRoadmapsAtom);
  const [userSkillRoadmapsLoading, setUserSkillRoadmapsLoading] = useAtom(userSkillRoadmapsLoadingAtom);
  const [userSkillRoadmapsError, setUserSkillRoadmapsError] = useAtom(userSkillRoadmapsErrorAtom);
  const [selectedSkillRoadmap, setSelectedSkillRoadmap] = useAtom(selectedSkillRoadmapAtom);
  const [skillRoadmapDetail, setSkillRoadmapDetail] = useAtom(skillRoadmapDetailAtom);
  const [skillRoadmapDetailLoading, setSkillRoadmapDetailLoading] = useAtom(skillRoadmapDetailLoadingAtom);

  const analyzeResume = async (file: File) => {
    setLoading(true);
    setError(null);
    setSkillAnalysis(null);
    
    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      if (stepIndex < PIPELINE_STEPS.length) {
        setPipelineStep(PIPELINE_STEPS[stepIndex]);
        stepIndex++;
      } else {
        clearInterval(stepInterval);
      }
    }, 2000);

    try {
      const result = await skillAnalyzerService.analyzeResume(file);
      clearInterval(stepInterval);
      setPipelineStep('Complete!');
      setSkillAnalysis(result.analysis);
    } catch (err) {
      clearInterval(stepInterval);
      setPipelineStep('');
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const saveToProfile = async (analysis: SkillGapAnalysis, userId: string, fileName: string) => {
    setLoading(true);
    setError(null);
    try {
      await skillAnalyzerService.saveAnalysis(analysis, userId, fileName);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSkillRoadmaps = async (userId: string) => {
    setUserSkillRoadmapsLoading(true);
    setUserSkillRoadmapsError(null);
    try {
      const result = await skillAnalyzerService.getUserSkillRoadmaps(userId);
      setUserSkillRoadmaps(result);
    } catch (err) {
      setUserSkillRoadmapsError(getErrorMessage(err));
    } finally {
      setUserSkillRoadmapsLoading(false);
    }
  };

  const openSkillRoadmapDetail = async (userSkillRoadmap: UserSkillRoadmap) => {
    setSelectedSkillRoadmap(userSkillRoadmap);
    setSkillRoadmapDetailLoading(true);
    try {
      const detail = await skillAnalyzerService.getSkillRoadmapById(userSkillRoadmap.skillRoadmapId);
      setSkillRoadmapDetail(detail);
    } catch (err) {
      setUserSkillRoadmapsError(getErrorMessage(err));
    } finally {
      setSkillRoadmapDetailLoading(false);
    }
  };

  const updateSkillProgress = async (
    userSkillRoadmapId: string,
    skill: string,
    isCompleted: boolean,
    notes?: string
  ) => {
    try {
      const updated = await skillAnalyzerService.updateSkillProgress({
        userSkillRoadmapId,
        skill,
        isCompleted,
        notes,
      });
      setUserSkillRoadmaps((prev) =>
        prev.map((ur) => (ur._id === userSkillRoadmapId ? updated : ur))
      );
      if (selectedSkillRoadmap?._id === userSkillRoadmapId) {
        setSelectedSkillRoadmap(updated);
      }
    } catch (err) {
      setUserSkillRoadmapsError(getErrorMessage(err));
    }
  };

  const deleteSkillRoadmap = async (userSkillRoadmapId: string) => {
    try {
      await skillAnalyzerService.deleteSkillRoadmap(userSkillRoadmapId);
      setUserSkillRoadmaps((prev) => prev.filter((ur) => ur._id !== userSkillRoadmapId));
      if (selectedSkillRoadmap?._id === userSkillRoadmapId) {
        setSelectedSkillRoadmap(null);
        setSkillRoadmapDetail(null);
      }
    } catch (err) {
      setUserSkillRoadmapsError(getErrorMessage(err));
    }
  };

  const closeSkillRoadmapDetail = () => {
    setSelectedSkillRoadmap(null);
    setSkillRoadmapDetail(null);
  };

  const clearAnalysis = () => {
    setSkillAnalysis(null);
    setPipelineStep('');
    setError(null);
  };

  return {
    skillAnalysis,
    loading,
    error,
    pipelineStep,
    userSkillRoadmaps,
    userSkillRoadmapsLoading,
    userSkillRoadmapsError,
    selectedSkillRoadmap,
    skillRoadmapDetail,
    skillRoadmapDetailLoading,
    analyzeResume,
    saveToProfile,
    fetchUserSkillRoadmaps,
    openSkillRoadmapDetail,
    updateSkillProgress,
    deleteSkillRoadmap,
    closeSkillRoadmapDetail,
    clearAnalysis,
  };
};