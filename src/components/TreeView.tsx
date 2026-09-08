import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import {
  ALL_NODES,
  NODES_BY_ID,
  ROOT_ID,
  getChildren,
  getAncestorChain,
  isSelectable,
} from '../lib/tree';
import type { CareerNode, Selections, SelectionSlot } from '../types';

interface TreeViewProps {
  onOpenNode: (id: string) => void;
  selections: Selections;
  activeNodeId: string | null;
}

interface HNode extends d3.HierarchyPointNode<{ id: string }> {}

const NODE_TYPE_COLOR: Record<CareerNode['type'], string> = {
  root: '#1e293b',
  domain: '#047857',
  specialization: '#0e7490',
  career: '#4338ca',
  emerging: '#d97706',
};

const NODE_TYPE_RADIUS: Record<CareerNode['type'], number> = {
  root: 13,
  domain: 10,
  specialization: 8,
  career: 7,
  emerging: 7,
};

const SLOT_COLOR: Record<SelectionSlot, string> = {
  main: '#eab308',
  related1: '#3b82f6',
  related2: '#a855f7',
};

const SLOT_LABEL: Record<SelectionSlot, string> = {
  main: 'MAIN',
  related1: 'R1',
  related2: 'R2',
};

const NODE_HEIGHT = 34;
const NODE_WIDTH = 210;

function buildFilteredHierarchy(collapsed: Set<string>) {
  const build = (id: string): { id: string; children?: unknown[] } => {
    const node: { id: string; children?: unknown[] } = { id };
    if (!collapsed.has(id)) {
      const kids = getChildren(id);
      if (kids.length) {
        node.children = kids.map((k) => build(k.id));
      }
    }
    return node;
  };
  return build(ROOT_ID);
}

function computeHighlights(selections: Selections) {
  const linkColor = new Map<string, string>(); // key: `${parentId}->${childId}`
  const nodeSlot = new Map<string, SelectionSlot[]>();

  (Object.keys(selections) as SelectionSlot[]).forEach((slot) => {
    const id = selections[slot];
    if (!id) return;
    const chain = getAncestorChain(id);
    const existing = nodeSlot.get(id) ?? [];
    nodeSlot.set(id, [...existing, slot]);
    for (let i = 0; i < chain.length - 1; i++) {
      const key = `${chain[i].id}->${chain[i + 1].id}`;
      if (linkColor.has(key) && linkColor.get(key) !== slot) {
        linkColor.set(key, 'shared');
      } else if (!linkColor.has(key)) {
        linkColor.set(key, slot);
      }
    }
  });
  return { linkColor, nodeSlot };
}

export default function TreeView({ onOpenNode, selections, activeNodeId }: TreeViewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const fitTransformRef = useRef<(() => d3.ZoomTransform) | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [dims, setDims] = useState({ width: 900, height: 600 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDims({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    const data = buildFilteredHierarchy(collapsed);
    const root = d3.hierarchy(data) as unknown as HNode;
    const treeLayout = d3
      .tree<{ id: string }>()
      .nodeSize([NODE_HEIGHT, NODE_WIDTH])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.4));
    treeLayout(root);

    const { linkColor, nodeSlot } = computeHighlights(selections);

    const linkGen = d3
      .linkHorizontal<unknown, HNode>()
      .x((d) => d.y)
      .y((d) => d.x);

    g.selectAll('*').remove();

    const linksLayer = g.append('g').attr('class', 'links');
    const nodesLayer = g.append('g').attr('class', 'nodes');

    linksLayer
      .selectAll('path')
      .data(root.links() as unknown as d3.HierarchyPointLink<{ id: string }>[])
      .join('path')
      .attr('d', (d) => linkGen(d as unknown as d3.HierarchyLink<unknown> & { source: HNode; target: HNode }))
      .attr('fill', 'none')
      .attr('stroke', (d) => {
        const key = `${d.source.data.id}->${d.target.data.id}`;
        const hl = linkColor.get(key);
        if (hl === 'shared') return SLOT_COLOR.main;
        if (hl) return SLOT_COLOR[hl as SelectionSlot];
        return '#cbd5e1';
      })
      .attr('stroke-width', (d) => {
        const key = `${d.source.data.id}->${d.target.data.id}`;
        return linkColor.has(key) ? 3.5 : 1.6;
      })
      .attr('stroke-opacity', (d) => {
        const key = `${d.source.data.id}->${d.target.data.id}`;
        return linkColor.has(key) ? 0.95 : 0.55;
      });

    const nodeGroups = nodesLayer
      .selectAll<SVGGElement, HNode>('g.node')
      .data(root.descendants() as HNode[], (d) => d.data.id)
      .join('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.y},${d.x})`)
      .style('cursor', 'pointer');

    nodeGroups.on('click', (_event, d) => {
      onOpenNode(d.data.id);
    });

    nodeGroups
      .append('circle')
      .attr('r', (d) => NODE_TYPE_RADIUS[NODES_BY_ID.get(d.data.id)!.type])
      .attr('fill', (d) => NODE_TYPE_COLOR[NODES_BY_ID.get(d.data.id)!.type])
      .attr('stroke', (d) => (d.data.id === activeNodeId ? '#0f172a' : '#fff'))
      .attr('stroke-width', (d) => (d.data.id === activeNodeId ? 3 : 1.5));

    // Emerging-career dashed halo to visually mark "new branches"
    nodeGroups
      .filter((d) => NODES_BY_ID.get(d.data.id)!.type === 'emerging')
      .append('circle')
      .attr('r', (d) => NODE_TYPE_RADIUS[NODES_BY_ID.get(d.data.id)!.type] + 4)
      .attr('fill', 'none')
      .attr('stroke', '#d97706')
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '2,2');

    // Selection ring(s) — offset multiple rings if a node holds >1 slot (shouldn't normally happen)
    nodeGroups.each(function (d) {
      const slots = nodeSlot.get(d.data.id);
      if (!slots) return;
      const base = NODE_TYPE_RADIUS[NODES_BY_ID.get(d.data.id)!.type];
      slots.forEach((slot, i) => {
        d3.select(this)
          .append('circle')
          .attr('r', base + 6 + i * 5)
          .attr('fill', 'none')
          .attr('stroke', SLOT_COLOR[slot])
          .attr('stroke-width', 2.5);
      });
    });

    // Slot badges
    nodeGroups.each(function (d) {
      const slots = nodeSlot.get(d.data.id);
      if (!slots || !slots.length) return;
      const base = NODE_TYPE_RADIUS[NODES_BY_ID.get(d.data.id)!.type];
      const grp = d3.select(this).append('g').attr('transform', `translate(0, ${-(base + 16)})`);
      grp
        .append('rect')
        .attr('x', -18 * slots.length)
        .attr('y', -9)
        .attr('width', 36 * slots.length)
        .attr('height', 16)
        .attr('rx', 8)
        .attr('fill', slots.length > 1 ? SLOT_COLOR.main : SLOT_COLOR[slots[0]]);
      grp
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.32em')
        .attr('font-size', 9)
        .attr('font-weight', 700)
        .attr('fill', '#fff')
        .text(slots.map((s) => SLOT_LABEL[s]).join(' / '));
    });

    // Expand/collapse toggles for nodes that have children in the full tree
    nodeGroups.each(function (d) {
      const hasKids = getChildren(d.data.id).length > 0;
      if (!hasKids) return;
      const base = NODE_TYPE_RADIUS[NODES_BY_ID.get(d.data.id)!.type];
      const isCollapsed = collapsed.has(d.data.id);
      const toggle = d3
        .select(this)
        .append('g')
        .attr('class', 'toggle')
        .attr('transform', `translate(${base + 10}, 0)`)
        .style('cursor', 'pointer')
        .on('click', (event) => {
          event.stopPropagation();
          toggleCollapse(d.data.id);
        });
      toggle.append('circle').attr('r', 7).attr('fill', '#fff').attr('stroke', '#94a3b8').attr('stroke-width', 1.2);
      toggle
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', 11)
        .attr('font-weight', 700)
        .attr('fill', '#475569')
        .text(isCollapsed ? '+' : '−');
    });

    // Labels
    nodeGroups
      .append('text')
      .attr('dy', '0.32em')
      .attr('x', (d) => {
        const base = NODE_TYPE_RADIUS[NODES_BY_ID.get(d.data.id)!.type];
        const hasKids = getChildren(d.data.id).length > 0;
        return hasKids ? -(base + 22) : base + 8;
      })
      .attr('text-anchor', (d) => (getChildren(d.data.id).length > 0 ? 'end' : 'start'))
      .attr('font-size', (d) => (NODES_BY_ID.get(d.data.id)!.type === 'root' ? 14 : 12))
      .attr('font-weight', (d) =>
        NODES_BY_ID.get(d.data.id)!.type === 'root' || NODES_BY_ID.get(d.data.id)!.type === 'domain' ? 700 : 500,
      )
      .attr('fill', '#1e293b')
      .text((d) => NODES_BY_ID.get(d.data.id)!.name)
      .style('cursor', 'pointer');

    const descendants = root.descendants() as HNode[];
    const xExtent = d3.extent(descendants, (d) => d.x) as [number, number];
    fitTransformRef.current = () => {
      const margin = 60;
      const contentHeight = xExtent[1] - xExtent[0] + margin * 2;
      const scale = Math.min(1, Math.max(0.35, dims.height / contentHeight));
      const ty = dims.height / 2 - ((xExtent[0] + xExtent[1]) / 2) * scale;
      return d3.zoomIdentity.translate(70, ty).scale(scale);
    };

    // Initial zoom setup (only once)
    if (!zoomRef.current) {
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 2.5])
        .on('zoom', (event) => {
          g.attr('transform', event.transform.toString());
        });
      zoomRef.current = zoom;
      svg.call(zoom);
      svg.call(zoom.transform, fitTransformRef.current());
    }
  }, [collapsed, selections, activeNodeId, onOpenNode, toggleCollapse, dims.height]);

  const recenter = () => {
    if (!svgRef.current || !zoomRef.current || !fitTransformRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(400).call(zoomRef.current.transform, fitTransformRef.current());
  };

  const zoomBy = (factor: number) => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(200).call(zoomRef.current.scaleBy, factor);
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-slate-50">
      <svg ref={svgRef} width={dims.width} height={dims.height} className="h-full w-full touch-none">
        <g ref={gRef} />
      </svg>

      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => zoomBy(1.3)}
          className="h-9 w-9 rounded-lg border border-slate-300 bg-white text-lg font-bold text-slate-700 shadow hover:bg-slate-100"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => zoomBy(0.75)}
          className="h-9 w-9 rounded-lg border border-slate-300 bg-white text-lg font-bold text-slate-700 shadow hover:bg-slate-100"
          aria-label="Zoom out"
        >
          &minus;
        </button>
        <button
          onClick={recenter}
          className="h-9 w-9 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 shadow hover:bg-slate-100"
          aria-label="Recenter tree"
          title="Recenter"
        >
          &#8982;
        </button>
      </div>

      <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-600 shadow-sm backdrop-blur">
        <div className="mb-1 font-semibold text-slate-700">Legend</div>
        <div className="flex flex-col gap-1">
          <LegendItem color={NODE_TYPE_COLOR.domain} label="Domain" />
          <LegendItem color={NODE_TYPE_COLOR.specialization} label="Specialization" />
          <LegendItem color={NODE_TYPE_COLOR.career} label="Career" />
          <LegendItem color={NODE_TYPE_COLOR.emerging} label="Emerging career" dashed />
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color, outline: dashed ? `1px dashed ${color}` : undefined, outlineOffset: 2 }}
      />
      <span>{label}</span>
    </div>
  );
}

export function totalSelectableCount(): number {
  return ALL_NODES.filter(isSelectable).length;
}
