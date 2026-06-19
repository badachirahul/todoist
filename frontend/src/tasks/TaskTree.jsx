import { useMemo, useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskRow from "./TaskRow";
import { useUpdateTask, useDeleteTask, useMoveTask } from "../api/tasks";
import { buildVisibleTree, descendantIds, getProjection, slotFor, subtreeHeight, INDENT, GUTTER, MAX_DEPTH } from "./treeUtils";

/** One sortable row; renders an orange drop-line (at the projected depth) while dragging. */
function SortableTaskRow({ item, projection, rowProps }) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({ id: item.task.id });
  const style = { transform: CSS.Translate.toString(transform), transition };

  if (isDragging) {
    const depth = projection ? projection.depth : item.depth;
    const base = depth * INDENT + GUTTER;
    // The drop gap leaves the row above's gray divider exposed at the top; the
    // orange circle + line overlay that divider (same Y), starting a few px in
    // so a short gray segment stays visible before the circle (matches Todoist).
    return (
      <div ref={setNodeRef} style={style} className="relative pb-7">
        <div
          className="absolute right-0 top-[-1px] border-t-2 border-[#dc4c3e]"
          style={{ left: base + 8 }}
        />
        <span
          className="absolute top-[-5px] h-2 w-2 rounded-full border-2 border-[#dc4c3e] bg-white"
          style={{ left: base + 4 }}
        />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style}>
      <TaskRow
        {...rowProps}
        depth={item.depth}
        hasChildren={item.hasChildren}
        dragHandle={{ setActivatorNodeRef, attributes, listeners }}
      />
    </div>
  );
}

/**
 * Renders one section group (sectionless, or a single section) as a drag-and-drop
 * nesting tree. Reorder up/down, drag onto a task to nest, drag left to un-nest.
 * Used by both Inbox and projects. Cross-section drag is intentionally not wired
 * (each group is its own DndContext).
 */
export default function TaskTree({ tasks, sectionId = null, projectId, onOpenDetail }) {
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);
  const moveTask = useMoveTask(projectId);

  const [collapsed, setCollapsed] = useState(() => new Set());
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const flattened = useMemo(() => buildVisibleTree(tasks, collapsed), [tasks, collapsed]);

  // While dragging, hide the active item's descendants so the whole subtree moves as one.
  const items = useMemo(() => {
    if (!activeId) return flattened;
    const desc = descendantIds(tasks, activeId);
    return flattened.filter((i) => !desc.has(i.task.id));
  }, [flattened, tasks, activeId]);

  // Cap nesting at MAX_DEPTH, leaving room for the dragged task's own sub-tree.
  const maxDepthAllowed = activeId ? MAX_DEPTH - subtreeHeight(tasks, activeId) : MAX_DEPTH;
  const projection = activeId && overId
    ? getProjection(items, activeId, overId, offsetLeft, maxDepthAllowed)
    : null;
  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const toggle = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const rowPropsFor = (task) => ({
    task,
    collapsed: collapsed.has(task.id),
    onToggleCollapse: () => toggle(task.id),
    onComplete: () => updateTask.mutate({ id: task.id, patch: { completed: true } }),
    onUpdate: (patch) => updateTask.mutate({ id: task.id, patch }),
    onDelete: () => deleteTask.mutate(task.id),
    onOpenDetail: () => onOpenDetail(task.id),
  });

  function reset() {
    setActiveId(null);
    setOverId(null);
    setOffsetLeft(0);
  }

  function onDragEnd() {
    if (projection && overId) {
      const { parentId, overIndex } = projection;
      const position = slotFor(items, activeId, overIndex, parentId);
      moveTask.mutate({ id: activeId, parentId, sectionId, position });
    }
    reset();
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => { setActiveId(active.id); setOverId(active.id); }}
      onDragMove={({ delta }) => setOffsetLeft(delta.x)}
      onDragOver={({ over }) => setOverId(over?.id ?? null)}
      onDragEnd={onDragEnd}
      onDragCancel={reset}
    >
      <SortableContext items={items.map((i) => i.task.id)} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableTaskRow
            key={item.task.id}
            item={item}
            projection={item.task.id === activeId ? projection : null}
            rowProps={rowPropsFor(item.task)}
          />
        ))}
      </SortableContext>

      <DragOverlay>
        {activeTask ? <TaskRow task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
