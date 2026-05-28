import type { Edge, Node } from '@xyflow/react'
import type { EdgeData, NodeData } from '@/types'

/**
 * Compute the set of node IDs that should be visible on the canvas given the
 * current collapse state of group/zone nodes.
 *
 * A node is hidden if any ancestor (via `parentId`) has
 * `data.custom_colors.collapsed === true`. Root nodes (no `parentId`) are
 * always visible.
 *
 * O(n) — builds a `parentId -> children[]` index once, then BFS from roots.
 */
export function getVisibleNodeIds(nodes: Node<NodeData>[]): Set<string> {
  const childrenByParent = new Map<string, string[]>()
  for (const n of nodes) {
    if (n.parentId) {
      const arr = childrenByParent.get(n.parentId)
      if (arr) arr.push(n.id)
      else childrenByParent.set(n.parentId, [n.id])
    }
  }

  // Fast lookup for collapse flag.
  const byId = new Map<string, Node<NodeData>>()
  for (const n of nodes) byId.set(n.id, n)

  const visible = new Set<string>()
  const queue: string[] = []
  for (const n of nodes) {
    if (!n.parentId) queue.push(n.id)
  }

  while (queue.length > 0) {
    const id = queue.shift()!
    visible.add(id)
    const node = byId.get(id)
    if (node && !node.data.custom_colors?.collapsed) {
      const children = childrenByParent.get(id)
      if (children) queue.push(...children)
    }
  }

  return visible
}

/**
 * Filter edges to those whose source and target are both in `visibleIds`.
 * Edges crossing into a collapsed subtree are dropped.
 */
export function filterVisibleEdges(
  edges: Edge<EdgeData>[],
  visibleIds: Set<string>,
): Edge<EdgeData>[] {
  return edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
}
