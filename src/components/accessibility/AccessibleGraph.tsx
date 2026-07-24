'use client';

/**
 * Accessible Graph Visualization Wrapper for React Flow.
 * WCAG SC: 1.1.1, 1.3.1, 2.1.1, 2.4.3, 4.1.2, 4.1.3
 *
 * Dual-layer architecture:
 * - Visual layer: React Flow canvas (aria-hidden for AT)
 * - Semantic layer: Navigable tree structure for screen readers
 *
 * Keyboard navigation:
 * - Tab: Enter/exit graph widget
 * - Arrow keys: Navigate between nodes
 * - Enter/Space: Select/expand node (show connections)
 * - Escape: Collapse/deselect
 * - Home/End: Jump to first/last node
 * - F: Open search within graph
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { useAnnounce } from '@/lib/accessibility';

// Types matching React Flow's node/edge structure
interface GraphNode {
  id: string;
  type: string;
  label: string;
  data?: Record<string, unknown>;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
}

interface AccessibleGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeSelect?: (nodeId: string) => void;
  graphLabel?: string;
  children: React.ReactNode; // React Flow component
}

export function AccessibleGraph({
  nodes,
  edges,
  onNodeSelect,
  graphLabel = 'Entity relationship graph',
  children,
}: AccessibleGraphProps) {
  const [activeNodeIndex, setActiveNodeIndex] = useState(-1);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const semanticRef = useRef<HTMLDivElement>(null);
  const announce = useAnnounce();

  // Build adjacency for navigation
  const adjacency = useMemo(() => {
    const adj: Record<string, { targets: string[]; edgeLabels: string[] }> = {};
    for (const node of nodes) {
      adj[node.id] = { targets: [], edgeLabels: [] };
    }
    for (const edge of edges) {
      if (adj[edge.source]) {
        adj[edge.source].targets.push(edge.target);
        adj[edge.source].edgeLabels.push(edge.label || edge.type || 'connects to');
      }
    }
    return adj;
  }, [nodes, edges]);

  const getNodeConnections = useCallback(
    (nodeId: string) => {
      const nodeAdj = adjacency[nodeId];
      if (!nodeAdj) return [];
      return nodeAdj.targets.map((targetId, i) => {
        const targetNode = nodes.find(n => n.id === targetId);
        return {
          targetId,
          targetLabel: targetNode?.label || targetId,
          targetType: targetNode?.type || 'unknown',
          edgeLabel: nodeAdj.edgeLabels[i],
        };
      });
    },
    [adjacency, nodes],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (nodes.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight': {
          e.preventDefault();
          const next = Math.min(activeNodeIndex + 1, nodes.length - 1);
          setActiveNodeIndex(next);
          const node = nodes[next];
          announce(
            `${node.label}, ${node.type}. ${adjacency[node.id]?.targets.length || 0} connections. ${next + 1} of ${nodes.length}.`,
          );
          break;
        }
        case 'ArrowUp':
        case 'ArrowLeft': {
          e.preventDefault();
          const prev = Math.max(activeNodeIndex - 1, 0);
          setActiveNodeIndex(prev);
          const node = nodes[prev];
          announce(
            `${node.label}, ${node.type}. ${adjacency[node.id]?.targets.length || 0} connections. ${prev + 1} of ${nodes.length}.`,
          );
          break;
        }
        case 'Enter':
        case ' ': {
          e.preventDefault();
          const node = nodes[activeNodeIndex];
          if (!node) break;
          if (expandedNode === node.id) {
            setExpandedNode(null);
            announce(`Collapsed ${node.label}`);
          } else {
            setExpandedNode(node.id);
            const connections = getNodeConnections(node.id);
            announce(
              `Expanded ${node.label}. ${connections.length} connections: ${connections.slice(0, 3).map(c => `${c.edgeLabel} ${c.targetLabel}`).join(', ')}${connections.length > 3 ? ` and ${connections.length - 3} more` : ''}.`,
            );
            onNodeSelect?.(node.id);
          }
          break;
        }
        case 'Escape':
          e.preventDefault();
          setExpandedNode(null);
          announce('Graph navigation. Use arrow keys to browse entities.');
          break;
        case 'Home':
          e.preventDefault();
          setActiveNodeIndex(0);
          announce(`${nodes[0].label}, first entity.`);
          break;
        case 'End':
          e.preventDefault();
          setActiveNodeIndex(nodes.length - 1);
          announce(`${nodes[nodes.length - 1].label}, last entity.`);
          break;
        case 'f':
        case 'F':
          // Open graph search (implement per your search component)
          announce('Graph search. Type entity name.');
          break;
      }
    },
    [activeNodeIndex, adjacency, announce, expandedNode, getNodeConnections, nodes, onNodeSelect],
  );

  const summary = `${graphLabel}: ${nodes.length} entities, ${edges.length} connections`;

  return (
    <div
      role="application"
      aria-label={summary}
      aria-describedby="graph-instructions"
    >
      {/* Instructions for screen readers */}
      <div id="graph-instructions" className="sr-only">
        Use arrow keys to navigate entities. Enter or Space to expand connections.
        Escape to collapse. Home and End to jump to first or last entity.
        Press F to search.
      </div>

      {/* Visual layer — hidden from assistive tech */}
      <div aria-hidden="true">
        {children}
      </div>

      {/* Semantic navigation layer — visible to assistive tech */}
      <div
        ref={semanticRef}
        role="tree"
        aria-label={`${nodes.length} entities in graph`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="sr-only"
        aria-activedescendant={
          activeNodeIndex >= 0 ? `graph-node-${nodes[activeNodeIndex]?.id}` : undefined
        }
      >
        {nodes.map((node, index) => {
          const connections = getNodeConnections(node.id);
          const isExpanded = expandedNode === node.id;

          return (
            <div
              key={node.id}
              id={`graph-node-${node.id}`}
              role="treeitem"
              aria-expanded={connections.length > 0 ? isExpanded : undefined}
              aria-selected={index === activeNodeIndex}
              aria-label={`${node.label}, ${node.type}. ${connections.length} connections.`}
              aria-level={1}
              aria-setsize={nodes.length}
              aria-posinset={index + 1}
            >
              <span>{node.label}</span>
              <span> ({node.type})</span>

              {isExpanded && connections.length > 0 && (
                <div role="group" aria-label={`${connections.length} connections from ${node.label}`}>
                  {connections.map((conn, ci) => (
                    <div
                      key={`${node.id}-${conn.targetId}`}
                      role="treeitem"
                      aria-level={2}
                      aria-setsize={connections.length}
                      aria-posinset={ci + 1}
                      aria-label={`${conn.edgeLabel} ${conn.targetLabel} (${conn.targetType})`}
                    >
                      {conn.edgeLabel}: {conn.targetLabel} ({conn.targetType})
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Data table alternative (SC 1.1.1 for complex visualizations) */}
      <details className="sr-only">
        <summary>View graph data as table</summary>
        <table aria-label="Entity relationships table">
          <thead>
            <tr>
              <th scope="col">Entity</th>
              <th scope="col">Type</th>
              <th scope="col">Connections</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map(node => (
              <tr key={node.id}>
                <td>{node.label}</td>
                <td>{node.type}</td>
                <td>{getNodeConnections(node.id).map(c => `${c.edgeLabel} ${c.targetLabel}`).join('; ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
