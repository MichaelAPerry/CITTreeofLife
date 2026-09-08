import { useEffect, useState } from 'react';
import type { StudentNodeState } from '../types';
import { loadNodeState, saveNodeState, emptyNodeState } from '../lib/storage';

export function useNodeState(nodeId: string | null) {
  const [state, setState] = useState<StudentNodeState>(emptyNodeState());

  useEffect(() => {
    if (nodeId) setState(loadNodeState(nodeId));
    else setState(emptyNodeState());
  }, [nodeId]);

  useEffect(() => {
    if (nodeId) saveNodeState(nodeId, state);
  }, [nodeId, state]);

  return [state, setState] as const;
}
