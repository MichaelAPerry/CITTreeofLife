import type { CareerNode } from '../types';
import rawData from '../data/careers.json';

export const ALL_NODES = rawData as CareerNode[];

export const NODES_BY_ID: Map<string, CareerNode> = new Map(
  ALL_NODES.map((n) => [n.id, n]),
);

export const CHILDREN_BY_PARENT: Map<string, CareerNode[]> = new Map();
for (const node of ALL_NODES) {
  if (node.parentId) {
    const siblings = CHILDREN_BY_PARENT.get(node.parentId) ?? [];
    siblings.push(node);
    CHILDREN_BY_PARENT.set(node.parentId, siblings);
  }
}

export const ROOT_ID = ALL_NODES.find((n) => n.type === 'root')!.id;

export function getChildren(id: string): CareerNode[] {
  return CHILDREN_BY_PARENT.get(id) ?? [];
}

export function getAncestorChain(id: string): CareerNode[] {
  const chain: CareerNode[] = [];
  let current = NODES_BY_ID.get(id);
  while (current) {
    chain.unshift(current);
    current = current.parentId ? NODES_BY_ID.get(current.parentId) : undefined;
  }
  return chain;
}

export function getAncestorIds(id: string): Set<string> {
  return new Set(getAncestorChain(id).map((n) => n.id));
}

/** The nearest common ancestor of two nodes, walking up the tree. */
export function commonAncestor(idA: string, idB: string): CareerNode | null {
  const ancestorsA = getAncestorIds(idA);
  let current = NODES_BY_ID.get(idB);
  while (current) {
    if (ancestorsA.has(current.id)) return current;
    current = current.parentId ? NODES_BY_ID.get(current.parentId) : undefined;
  }
  return null;
}

export function isSelectable(node: CareerNode): boolean {
  return node.type === 'career' || node.type === 'emerging';
}

interface D3TreeDatum {
  id: string;
  children?: D3TreeDatum[];
}

export function buildHierarchyData(rootId: string = ROOT_ID): D3TreeDatum {
  const build = (id: string): D3TreeDatum => {
    const kids = getChildren(id);
    return kids.length
      ? { id, children: kids.map((k) => build(k.id)) }
      : { id };
  };
  return build(rootId);
}
