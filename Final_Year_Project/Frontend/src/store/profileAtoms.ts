import { atom } from 'jotai';
import { UserRoadmap, RoadmapDetail } from '../types/api';

export const userRoadmapsAtom = atom<UserRoadmap[]>([]);

export const userRoadmapsLoadingAtom = atom<boolean>(false);

export const userRoadmapsErrorAtom = atom<string | null>(null);

export const selectedUserRoadmapAtom = atom<UserRoadmap | null>(null);

export const roadmapDetailAtom = atom<RoadmapDetail | null>(null);

export const roadmapDetailLoadingAtom = atom<boolean>(false);
