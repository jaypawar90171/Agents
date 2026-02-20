import { useAtom } from 'jotai';
import {
  userRoadmapsAtom,
  userRoadmapsLoadingAtom,
  userRoadmapsErrorAtom,
  selectedUserRoadmapAtom,
  roadmapDetailAtom,
  roadmapDetailLoadingAtom,
} from '../store/profileAtoms';
import roadmapService from '../services/roadmapService';
import { UserRoadmap, RoadmapDetail } from '../types/api';
import { AxiosError } from 'axios';

interface UseProfileReturn {
  userRoadmaps: UserRoadmap[];
  loading: boolean;
  error: string | null;
  selectedUserRoadmap: UserRoadmap | null;
  roadmapDetail: RoadmapDetail | null;
  roadmapDetailLoading: boolean;
  fetchUserRoadmaps: (userId: string) => Promise<void>;
  openRoadmapDetail: (userRoadmap: UserRoadmap) => Promise<void>;
  updateWeekProgress: (
    userRoadmapId: string,
    weekNumber: number,
    isCompleted: boolean,
    notes?: string
  ) => Promise<void>;
  deleteRoadmap: (userRoadmapId: string) => Promise<void>;
  closeRoadmapDetail: () => void;
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

export const useProfile = (): UseProfileReturn => {
  const [userRoadmaps, setUserRoadmaps] = useAtom(userRoadmapsAtom);
  const [loading, setLoading] = useAtom(userRoadmapsLoadingAtom);
  const [error, setError] = useAtom(userRoadmapsErrorAtom);
  const [selectedUserRoadmap, setSelectedUserRoadmap] = useAtom(selectedUserRoadmapAtom);
  const [roadmapDetail, setRoadmapDetail] = useAtom(roadmapDetailAtom);
  const [roadmapDetailLoading, setRoadmapDetailLoading] = useAtom(roadmapDetailLoadingAtom);

  const fetchUserRoadmaps = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await roadmapService.getUserRoadmaps(userId);
      setUserRoadmaps(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const openRoadmapDetail = async (userRoadmap: UserRoadmap) => {
    setSelectedUserRoadmap(userRoadmap);
    setRoadmapDetailLoading(true);
    try {
      const detail = await roadmapService.getRoadmapById(userRoadmap.roadmapId);
      setRoadmapDetail(detail);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRoadmapDetailLoading(false);
    }
  };

  const updateWeekProgress = async (
    userRoadmapId: string,
    weekNumber: number,
    isCompleted: boolean,
    notes?: string
  ) => {
    try {
      const updated = await roadmapService.updateProgress({
        userRoadmapId,
        weekNumber,
        isCompleted,
        notes,
      });
      setUserRoadmaps((prev) =>
        prev.map((ur) => (ur._id === userRoadmapId ? updated : ur))
      );
      if (selectedUserRoadmap?._id === userRoadmapId) {
        setSelectedUserRoadmap(updated);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const deleteRoadmap = async (userRoadmapId: string) => {
    try {
      await roadmapService.deleteUserRoadmap(userRoadmapId);
      setUserRoadmaps((prev) => prev.filter((ur) => ur._id !== userRoadmapId));
      if (selectedUserRoadmap?._id === userRoadmapId) {
        setSelectedUserRoadmap(null);
        setRoadmapDetail(null);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const closeRoadmapDetail = () => {
    setSelectedUserRoadmap(null);
    setRoadmapDetail(null);
  };

  return {
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
  };
};
