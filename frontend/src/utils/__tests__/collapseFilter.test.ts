import { describe, it, expect } from 'vitest'
import type { Edge, Node } from '@xyflow/react'
import { getVisibleNodeIds, filterVisibleEdges } from '../collapseFilter'
import type { EdgeData, NodeData } from '@/types'

const mkNode = (
  id: string,
  parentId?: string,
  collapsed?: boolean,
): Node<NodeData> => ({
  id,
  position: { x: 0, y: 0 },
  ...(parentId ? { parentId } : {}),
  data: {
    label: id,
    type: parentId ? 'server' : 'groupRect',
    status: 'online',
    services: [],
    ...(collapsed !== undefined ? { custom_colors: { collapsed } } : {}),
  },
})

const mkEdge = (id: string, source: string, target: string): Edge<EdgeData> => ({
  id,
  source,
  target,
})

describe('getVisibleNodeIds', () => {
  it('returns all nodes when nothing is collapsed', () => {
    const nodes = [
      mkNode('zone'),
      mkNode('child-a', 'zone'),
      mkNode('child-b', 'zone'),
    ]
    expect(getVisibleNodeIds(nodes)).toEqual(new Set(['zone', 'child-a', 'child-b']))
  })

  it('hides direct children of a collapsed zone but keeps the zone itself', () => {
    const nodes = [
      mkNode('zone', undefined, true),
      mkNode('child-a', 'zone'),
      mkNode('child-b', 'zone'),
      mkNode('outside'),
    ]
    expect(getVisibleNodeIds(nodes)).toEqual(new Set(['zone', 'outside']))
  })

  it('hides the entire subtree when an ancestor is collapsed (multi-level)', () => {
    const nodes = [
      mkNode('root', undefined, true),
      mkNode('mid', 'root', false), // expanded but parent collapsed → still hidden
      mkNode('leaf', 'mid'),
    ]
    const visible = getVisibleNodeIds(nodes)
    expect(visible.has('root')).toBe(true)
    expect(visible.has('mid')).toBe(false)
    expect(visible.has('leaf')).toBe(false)
  })

  it('hides only the nested subtree when an inner zone is collapsed', () => {
    const nodes = [
      mkNode('root', undefined, false),
      mkNode('inner', 'root', true),
      mkNode('leaf', 'inner'),
      mkNode('sibling', 'root'),
    ]
    expect(getVisibleNodeIds(nodes)).toEqual(new Set(['root', 'inner', 'sibling']))
  })

  it('handles a zone with no children', () => {
    const nodes = [mkNode('empty-zone', undefined, true)]
    expect(getVisibleNodeIds(nodes)).toEqual(new Set(['empty-zone']))
  })

  it('returns an empty set for empty input', () => {
    expect(getVisibleNodeIds([])).toEqual(new Set())
  })

  it('treats nodes with no custom_colors as expanded', () => {
    const nodes = [mkNode('zone'), mkNode('child', 'zone')]
    expect(getVisibleNodeIds(nodes)).toEqual(new Set(['zone', 'child']))
  })

  it('is independent of insertion order (children declared before parent)', () => {
    const nodes = [
      mkNode('child', 'zone'),
      mkNode('zone', undefined, true),
    ]
    expect(getVisibleNodeIds(nodes)).toEqual(new Set(['zone']))
  })
})

describe('filterVisibleEdges', () => {
  it('keeps edges whose endpoints are both visible', () => {
    const visible = new Set(['a', 'b'])
    const edges = [mkEdge('e1', 'a', 'b')]
    expect(filterVisibleEdges(edges, visible)).toHaveLength(1)
  })

  it('drops an edge whose target is inside a collapsed subtree', () => {
    const visible = new Set(['outside', 'zone']) // 'leaf' hidden
    const edges = [
      mkEdge('e-outside-leaf', 'outside', 'leaf'),
      mkEdge('e-outside-zone', 'outside', 'zone'),
    ]
    const out = filterVisibleEdges(edges, visible)
    expect(out.map((e) => e.id)).toEqual(['e-outside-zone'])
  })

  it('drops an edge whose source is hidden', () => {
    const visible = new Set(['b'])
    const edges = [mkEdge('e1', 'a', 'b')]
    expect(filterVisibleEdges(edges, visible)).toHaveLength(0)
  })

  it('returns an empty array for empty input', () => {
    expect(filterVisibleEdges([], new Set(['a']))).toEqual([])
  })
})
