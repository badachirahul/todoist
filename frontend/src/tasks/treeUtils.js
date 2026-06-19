import { arrayMove } from "@dnd-kit/sortable";

/** Horizontal pixels per nesting level (used for indentation + drag projection). */
export const INDENT = 24;

/** Pixels from a row's content edge to the checkbox (the chevron gutter) —
 *  shared so the drag drop-line aligns under the checkbox at any depth. */
export const GUTTER = 18;

/** Deepest allowed nesting (0-indexed): MAX_DEPTH = 4 → 5 levels total.
 *  Change to 3 for a 4-level limit. */
export const MAX_DEPTH = 4;

/**
 * Turn a flat task array (one section group) into an ordered list of visible
 * rows with a `depth`, honouring collapsed parents. Top-level tasks have
 * parentTaskId == null; children reference their parent's id.
 */
export function buildVisibleTree(tasks, collapsed) {
  const byParent = new Map(); // parentId | "root" -> children[]
  for (const t of tasks) {
    const key = t.parentTaskId ?? "root";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(t);
  }
  for (const arr of byParent.values()) arr.sort((a, b) => a.position - b.position);

  const out = [];
  const walk = (key, depth) => {
    for (const t of byParent.get(key) ?? []) {
      const hasChildren = (byParent.get(t.id) ?? []).length > 0;
      out.push({ task: t, depth, hasChildren });
      if (hasChildren && !collapsed.has(t.id)) walk(t.id, depth + 1);
    }
  };
  walk("root", 0);
  return out;
}

/** Height of a task's sub-tree: 0 if it has no children, else 1 + deepest child. */
export function subtreeHeight(tasks, id) {
  const kids = new Map();
  for (const t of tasks) {
    const key = t.parentTaskId ?? "root";
    if (!kids.has(key)) kids.set(key, []);
    kids.get(key).push(t.id);
  }
  const height = (nid) => {
    const cs = kids.get(nid) ?? [];
    return cs.length === 0 ? 0 : 1 + Math.max(...cs.map(height));
  };
  return height(id);
}

/** All descendant ids of a task (so we can hide them while their ancestor drags). */
export function descendantIds(tasks, id) {
  const childrenOf = new Map();
  for (const t of tasks) {
    const key = t.parentTaskId ?? "root";
    if (!childrenOf.has(key)) childrenOf.set(key, []);
    childrenOf.get(key).push(t.id);
  }
  const out = new Set();
  const walk = (pid) => {
    for (const cid of childrenOf.get(pid) ?? []) { out.add(cid); walk(cid); }
  };
  walk(id);
  return out;
}

/**
 * Given the visible (active-descendants-removed) flat list, compute where the
 * dragged item would land: its projected depth and resulting parentId. Mirrors
 * the dnd-kit sortable-tree example. `dragOffset` is the horizontal pointer
 * delta since drag start.
 */
export function getProjection(items, activeId, overId, dragOffset, maxDepthAllowed = MAX_DEPTH) {
  const overIndex = items.findIndex((i) => i.task.id === overId);
  const activeIndex = items.findIndex((i) => i.task.id === activeId);
  if (overIndex === -1 || activeIndex === -1) return null;

  const newItems = arrayMove(items, activeIndex, overIndex);
  const previous = newItems[overIndex - 1];
  const next = newItems[overIndex + 1];

  const dragDepth = Math.round(dragOffset / INDENT);
  const projected = items[activeIndex].depth + dragDepth;
  // Can nest one under the previous row, but never past the overall depth cap.
  const maxDepth = Math.min(previous ? previous.depth + 1 : 0, maxDepthAllowed);
  const minDepth = next ? next.depth : 0;
  const depth = Math.min(Math.max(minDepth, Math.min(projected, maxDepth)), maxDepthAllowed);

  let parentId = null;
  if (depth !== 0 && previous) {
    if (depth === previous.depth) parentId = previous.task.parentTaskId ?? null;
    else if (depth > previous.depth) parentId = previous.task.id;
    else {
      parentId = newItems
        .slice(0, overIndex)
        .reverse()
        .find((i) => i.depth === depth)?.task.parentTaskId ?? null;
    }
  }

  return { depth, parentId, overIndex };
}

/**
 * Translate a projection into the 0-based slot among the destination siblings,
 * matching how the backend reindexes (same parentId group, source order).
 */
export function slotFor(items, activeId, overIndex, parentId) {
  const newItems = arrayMove(
    items,
    items.findIndex((i) => i.task.id === activeId),
    overIndex
  );
  const newActiveIndex = newItems.findIndex((i) => i.task.id === activeId);
  let slot = 0;
  for (let i = 0; i < newActiveIndex; i++) {
    const id = newItems[i].task.id;
    const itemParent = id === activeId ? parentId : (newItems[i].task.parentTaskId ?? null);
    if ((itemParent ?? null) === (parentId ?? null)) slot++;
  }
  return slot;
}
