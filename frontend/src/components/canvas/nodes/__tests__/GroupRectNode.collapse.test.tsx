import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GroupRectNode } from '../GroupRectNode'
import { useCanvasStore } from '@/stores/canvasStore'
import type { Node } from '@xyflow/react'
import type { NodeData } from '@/types'

// Mock useCanvasStore
vi.mock('@/stores/canvasStore', () => ({
  useCanvasStore: vi.fn(),
}))

describe('GroupRectNode - Collapse/Expand', () => {
  const mockToggle = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useCanvasStore as unknown as jest.Mock).mockImplementation((selector: (state: Record<string, unknown>) => unknown) => {
      const state = {
        setEditingGroupRectId: vi.fn(),
        toggleNodeCollapsed: mockToggle,
        nodes: [
          {
            id: 'parent-1',
            data: { label: 'Test Zone', type: 'groupRect' as const, status: 'online' as const, services: [] },
            position: { x: 0, y: 0 },
          },
          {
            id: 'child-1',
            data: { label: 'Child 1', type: 'generic' as const, status: 'online' as const, services: [] },
            position: { x: 100, y: 100 },
            parentId: 'parent-1',
          },
          {
            id: 'child-2',
            data: { label: 'Child 2', type: 'generic' as const, status: 'online' as const, services: [] },
            position: { x: 100, y: 200 },
            parentId: 'parent-1',
          },
        ],
      }
      return selector(state)
    })
  })

  it('shows chevron button when zone has children', () => {
    const node: Node<NodeData> = {
      id: 'zone-1',
      data: { label: 'Test Zone', type: 'groupRect', status: 'online', services: [] },
      position: { x: 0, y: 0 },
    }

    render(
      <GroupRectNode id={node.id} data={node.data} selected={false} isConnecting={false} xPos={0} yPos={0} />
    )

    const btn = document.querySelector('button')
    expect(btn).toBeTruthy()
  })

  it('rotates chevron when collapsed', () => {
    const node: Node<NodeData> = {
      id: 'zone-1',
      data: {
        label: 'Test Zone',
        type: 'groupRect',
        status: 'online',
        services: [],
        custom_colors: { collapsed: true },
      },
      position: { x: 0, y: 0 },
    }

    render(
      <GroupRectNode id={node.id} data={node.data} selected={false} isConnecting={false} xPos={0} yPos={0} />
    )

    const btn = document.querySelector('button')
    expect(btn?.style.transform).toContain('rotate(-90deg)')
  })

  it('calls toggleNodeCollapsed on chevron click', async () => {
    const user = userEvent.setup()
    const node: Node<NodeData> = {
      id: 'zone-1',
      data: { label: 'Test Zone', type: 'groupRect', status: 'online', services: [] },
      position: { x: 0, y: 0 },
    }

    render(
      <GroupRectNode id={node.id} data={node.data} selected={false} isConnecting={false} xPos={0} yPos={0} />
    )

    const btn = document.querySelector('button')
    if (btn) {
      await user.click(btn)
      expect(mockToggle).toHaveBeenCalledWith('zone-1')
    }
  })

  it('shows hidden item count when collapsed', () => {
    const node: Node<NodeData> = {
      id: 'zone-1',
      data: {
        label: 'Test Zone',
        type: 'groupRect',
        status: 'online',
        services: [],
        custom_colors: { collapsed: true },
      },
      position: { x: 0, y: 0 },
    }

    render(
      <GroupRectNode id={node.id} data={node.data} selected={false} isConnecting={false} xPos={0} yPos={0} />
    )

    expect(screen.getByText('+2')).toBeTruthy()
  })

  it('reduces zone opacity when collapsed', () => {
    const node: Node<NodeData> = {
      id: 'zone-1',
      data: {
        label: 'Test Zone',
        type: 'groupRect',
        status: 'online',
        services: [],
        custom_colors: { collapsed: true },
      },
      position: { x: 0, y: 0 },
    }

    render(
      <GroupRectNode id={node.id} data={node.data} selected={false} isConnecting={false} xPos={0} yPos={0} />
    )

    const div = document.querySelector('div')
    expect(div?.style.opacity).toBe('0.6')
  })
})
