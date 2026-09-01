import { atom } from 'jotai';
import { SkillGapAnalysis, UserSkillRoadmap } from '../types/api';

export const skillAnalysisAtom = atom<SkillGapAnalysis | null>(null);

export const skillAnalysisLoadingAtom = atom<boolean>(false);

export const skillAnalysisErrorAtom = atom<string | null>(null);

export const skillAnalysisStepAtom = atom<string>('');

export const userSkillRoadmapsAtom = atom<UserSkillRoadmap[]>([]);

export const userSkillRoadmapsLoadingAtom = atom<boolean>(false);

export const userSkillRoadmapsErrorAtom = atom<string | null>(null);

export const selectedSkillRoadmapAtom = atom<UserSkillRoadmap | null>(null);

export const skillRoadmapDetailAtom = atom<SkillGapAnalysis | null>(null);

export const skillRoadmapDetailLoadingAtom = atom<boolean>(false);