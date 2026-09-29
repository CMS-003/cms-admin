import { IComponent } from "@/types";
import { cast, IMSTArray, IType } from "mobx-state-tree";

export function findNode(root: IComponent|null, id: string): IComponent | null {
  if(!root) return null;
  if (root._id === id) return root;
  if (!root.children) return null;
  for (const c of root.children) {
    const r = findNode(c, id);
    if (r) return r;
  }
  return null;
}

export function findParent(root: IComponent, id: string): IComponent | null {
  if (!root.children) return null;
  for (const c of root.children) {
    if (c.id === id) return root;
    const p = findParent(c, id);
    if (p) return p;
  }
  return null;
}

/**
 * 移动节点（不可变）。
 * - dragId: 被拖动的节点 id
 * - parentId: 目标父节点 id
 * - index: 在目标父节点 children 中的插入位置
 */
export function moveNode(
  root: IComponent,
  dragId: string,
  parentId: string,
  index: number
): IComponent {
  if (dragId === parentId) return root;

  const newRoot: IComponent = JSON.parse(JSON.stringify(root));
  const dragged = findNode(newRoot, dragId);
  if (!dragged) return root;

  // 不能拖进自己的子树
  if (findNode(dragged, parentId)) return root;

  const oldParent = findParent(newRoot, dragId);
  let adjustedIndex = index;

  if (oldParent) {
    const oldIdx = oldParent.children!.findIndex((c) => c.id === dragId);
    if (oldParent._id === parentId && oldIdx < index) {
      adjustedIndex = index - 1;
    }
    oldParent.children!.splice(oldIdx, 1);
  }

  const newParent = findNode(newRoot, parentId);
  if (!newParent) return root;
  if (!newParent.children) newParent.children = cast([]);

  adjustedIndex = Math.max(0, Math.min(adjustedIndex, newParent.children.length));
  newParent.children.splice(adjustedIndex, 0, dragged);

  return newRoot;
}
// src/tree.ts  (追加)

/**
 * 该落点是否等价于「原地不动」
 * - 只有目标容器 == 当前父容器时才可能
 * - 同容器时，index == currentIndex 或 currentIndex + 1 都等于不动
 *   （+1 是因为：摘除当前节点后，它后面的空位填上来，再插回去就回到原位）
 */
export function isNoopDrop(
  root: IComponent|null,
  dragId: string,
  target: { containerId: string; index: number }
): boolean {
  if(!root) return false;
  const parent = findParent(root, dragId);
  if (!parent || !parent.children) return false;
  if (parent._id !== target.containerId) return false;

  const currentIndex = parent.children.findIndex((c) => c.id === dragId);
  if (currentIndex < 0) return false;

  return target.index === currentIndex || target.index === currentIndex + 1;
}

// ---- 追加到 src/tree.ts ----

export type NodeType = 'row' | 'column' | 'text';

export function insertNode(
  root: IComponent,
  parentId: string,
  index: number,
  node: IComponent
): IComponent {
  const newRoot: IComponent = JSON.parse(JSON.stringify(root));
  const parent = findNode(newRoot, parentId);
  if (!parent) return root;
  if (!parent.children) parent.children = cast([]);
  const i = Math.max(0, Math.min(index, parent.children.length));
  parent.children.splice(i, 0, node);
  return newRoot;
}

export function removeNode(root: IComponent, id: string): IComponent {
  const newRoot: IComponent = JSON.parse(JSON.stringify(root));
  const parent = findParent(newRoot, id);
  if (!parent || !parent.children) return root;
  const idx = parent.children.findIndex((c) => c.id === id);
  if (idx < 0) return root;
  parent.children.splice(idx, 1);
  return newRoot;
}

export function appendChild(root: IComponent, parentId: string, child: IComponent): IComponent {
  const newRoot: IComponent = JSON.parse(JSON.stringify(root));
  const parent = findNode(newRoot, parentId);
  if (!parent || ![''].includes(parent.type)) return root;
  if (!parent.children) parent.children = cast([]);
  parent.children.push(child);
  return newRoot;
}

export function updateNode(
  root: IComponent,
  id: string,
  patch: Partial<Omit<IComponent, '_id'>>
): IComponent {
  const newRoot: IComponent = JSON.parse(JSON.stringify(root));
  const node = findNode(newRoot, id);
  if (!node) return root;
  Object.assign(node, patch);
  return newRoot;
}