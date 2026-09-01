import { useAtom } from "jotai";
import { useEffect } from "react";
import {
  roadmapDataAtom,
  roadmapLoadingAtom,
  roadmapErrorAtom,
} from "../store/store";
import roadmapService from "../services/roadmapService";
import { RoadmapResponse } from "../types/api";
import { AxiosError } from "axios";

interface UseRoadmapReturn {
  roadmap: RoadmapResponse | null;
  loading: boolean;
  error: string | null;
  generateRoadmap: (companyName: string) => Promise<void>;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError && err.response?.data?.detail) {
    const detail = err.response.data.detail;
    return typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((d: { msg?: string }) => d.msg ?? String(d)).join(", ")
        : String(detail);
  }
  return err instanceof Error ? err.message : "Failed to generate roadmap";
}

/**
 * Custom hook to generate roadmap and sync with Jotai atoms.
 * Call generateRoadmap(companyName) to trigger; read roadmap, loading, error from atoms.
 * Also checks sessionStorage for pre-loaded roadmap data from navigation.
 */
export const useRoadmap = (): UseRoadmapReturn => {
  const [roadmap, setRoadmap] = useAtom(roadmapDataAtom);
  const [loading, setLoading] = useAtom(roadmapLoadingAtom);
  const [error, setError] = useAtom(roadmapErrorAtom);

  // Check for pre-loaded roadmap from sessionStorage on component mount
  useEffect(() => {
    const pendingRoadmap = sessionStorage.getItem("pendingRoadmap");
    if (pendingRoadmap) {
      try {
        const data = JSON.parse(pendingRoadmap);
        setRoadmap(data); // Same atom - variable names stay consistent
        sessionStorage.removeItem("pendingRoadmap"); // Clean up
      } catch (err) {
        console.error("Failed to parse pending roadmap:", err);
      }
    }
  }, [setRoadmap]);

  const generateRoadmap = async (companyName: string) => {
    const trimmed = companyName.trim();
    setLoading(true);
    setError(null);
    try {
      const result = await roadmapService.generateRoadmap(trimmed);
      setRoadmap(result);
    } catch (err) {
      setError(getErrorMessage(err));
      setRoadmap(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    roadmap,
    loading,
    error,
    generateRoadmap,
  };
};
