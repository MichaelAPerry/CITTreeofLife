import type { Selections, StudentNodeState } from '../types';

const STATE_PREFIX = 'cit-tol:node:';
const SELECTIONS_KEY = 'cit-tol:selections';

export function emptyNodeState(): StudentNodeState {
  return {
    skillStatus: {},
    notes: ['', '', '', ''],
    opinion: '',
    localAvailability: '',
    customVideoId: '',
  };
}

export function loadNodeState(nodeId: string): StudentNodeState {
  try {
    const raw = localStorage.getItem(STATE_PREFIX + nodeId);
    if (!raw) return emptyNodeState();
    const parsed = JSON.parse(raw);
    return { ...emptyNodeState(), ...parsed };
  } catch {
    return emptyNodeState();
  }
}

export function saveNodeState(nodeId: string, state: StudentNodeState): void {
  try {
    localStorage.setItem(STATE_PREFIX + nodeId, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — fail silently
  }
}

export function loadSelections(): Selections {
  try {
    const raw = localStorage.getItem(SELECTIONS_KEY);
    if (!raw) return { main: null, related1: null, related2: null };
    return { main: null, related1: null, related2: null, ...JSON.parse(raw) };
  } catch {
    return { main: null, related1: null, related2: null };
  }
}

export function saveSelections(selections: Selections): void {
  try {
    localStorage.setItem(SELECTIONS_KEY, JSON.stringify(selections));
  } catch {
    // ignore
  }
}
