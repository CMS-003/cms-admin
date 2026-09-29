// src/geometry.ts
import { IComponent, ITemplate } from '@/types';

export type Rect = { left: number; top: number; width: number; height: number };

export type ChildBox = {
  mainStart: number;
  mainEnd: number;
  crossStart: number;
  crossEnd: number;
};

export type ContainerInfo = {
  id: string;
  parentId: string | null;   // ← 新增：最近的祖先容器 id
  axis: 'row' | 'column';
  rect: Rect;
  childBoxes: ChildBox[];
};

export type DropTarget = { containerId: string; index: number };

export type HitOptions = {
  /** 容器主轴边缘带比例（0~0.5）。0 表示禁用。 */
  edgeRatio?: number;
  /** 子节点主轴二分点比例（0~1）。0.5 = 中心二分。 */
  midRatio?: number;
};

const DEFAULT_OPTS: Required<HitOptions> = {
  edgeRatio: 0.25,
  midRatio: 0.5,
};

export function measureContainers(
  root: ITemplate | IComponent,
  canvas: HTMLElement
): ContainerInfo[] {
  const base = canvas.getBoundingClientRect();
  const out: ContainerInfo[] = [];

  const walk = (node: ITemplate | IComponent, parentId: string | null) => {
    // if (node.dir == null || !node.children) return;

    const el = canvas.querySelector<HTMLElement>(`[data-node-id="${node._id}"]`);
    if (!el) return;

    const r = el.getBoundingClientRect();
    const isRow = node.attrs.layout === 'row';// node.dir === 'row';

    const childBoxes: ChildBox[] = node.children.map((child) => {
      const childEl = canvas.querySelector<HTMLElement>(
        `[data-node-id="${child.id}"]`
      );
      if (!childEl) {
        return { mainStart: 0, mainEnd: 0, crossStart: 0, crossEnd: 0 };
      }
      const cr = childEl.getBoundingClientRect();
      if (isRow) {
        return {
          mainStart: cr.left - base.left,
          mainEnd: cr.right - base.left,
          crossStart: cr.top - base.top,
          crossEnd: cr.bottom - base.top,
        };
      }
      return {
        mainStart: cr.top - base.top,
        mainEnd: cr.bottom - base.top,
        crossStart: cr.left - base.left,
        crossEnd: cr.right - base.left,
      };
    });

    out.push({
      id: node._id,
      parentId,                       // ← 记录
      axis: node.attrs.layout === 'row' ? 'row' : 'column',
      rect: {
        left: r.left - base.left,
        top: r.top - base.top,
        width: r.width,
        height: r.height,
      },
      childBoxes,
    });

    // 递归时把当前的 node.id 作为子容器的 parentId 传下去
    node.children.forEach((child) => walk(child, node._id));
  };

  walk(root, null);
  return out;
}

/**
 * 命中测试。
 * 从深到浅遍历，找到第一个「真正应该接收」的容器。
 * - 若指针落在容器主轴的边缘带 → 跳过（留给父容器判定，即插到该容器前后）
 * - 否则 → 在该容器内部找插入 index
 */
export function hitTest(
  containers: ContainerInfo[],
  x: number,
  y: number,
  blocked: Set<string>,
  opts: HitOptions = {}
): DropTarget | null {
  const { edgeRatio, midRatio } = { ...DEFAULT_OPTS, ...opts };

  for (let i = containers.length - 1; i >= 0; i--) {
    const c = containers[i];
    if (blocked.has(c.id)) continue;

    const r = c.rect;
    if (x < r.left || x > r.left + r.width) continue;
    if (y < r.top || y > r.top + r.height) continue;

    const isRow = c.axis === 'row';

    // ★ 关键修复：边缘判定用【交叉轴】，不是主轴
    //   row    → 交叉轴是 y，上下边缘让给父容器
    //   column → 交叉轴是 x，左右边缘让给父容器
    if (edgeRatio > 0 && c.parentId != null) {
      const crossCoord = isRow ? y : x;
      const crossStart = isRow ? r.top : r.left;
      const crossEnd = isRow ? r.top + r.height : r.left + r.width;
      const crossSize = crossEnd - crossStart;

      if (crossSize > 0) {
        const distStart = crossCoord - crossStart;
        const distEnd = crossEnd - crossCoord;
        const edgeBand = crossSize * edgeRatio;
        if (distStart < edgeBand || distEnd < edgeBand) {
          continue; // 让父容器接管 → 结果 = 插到这个容器前后
        }
      }
    }

    // 主轴方向：容器内部自己消化成 index
    return findIndexInContainer(c, x, y, midRatio);
  }
  return null;
}

function findIndexInContainer(
  c: ContainerInfo,
  x: number,
  y: number,
  midRatio: number
): DropTarget {
  const isRow = c.axis === 'row';
  const main = isRow ? x : y;
  const VIRTUAL_GAP = 6;   // 虚拟缝隙，仅用于判定，不影响布局

  for (let j = 0; j < c.childBoxes.length; j++) {
    const b = c.childBoxes[j];
    const start = b.mainStart - VIRTUAL_GAP;
    const end = b.mainEnd + VIRTUAL_GAP;
    const threshold = start + (end - start) * midRatio;
    if (main < threshold) return { containerId: c.id, index: j };
  }
  return { containerId: c.id, index: c.childBoxes.length };
}

export function getIndicatorRect(c: ContainerInfo, index: number): Rect {
  const THICK = 8;
  const INSET = 4;
  const isRow = c.axis === 'row';
  const boxes = c.childBoxes;

  let mainPos: number;
  if (boxes.length === 0) {
    mainPos = isRow
      ? c.rect.left + c.rect.width / 2
      : c.rect.top + c.rect.height / 2;
  } else if (index <= 0) {
    mainPos = boxes[0].mainStart;
  } else if (index >= boxes.length) {
    mainPos = boxes[boxes.length - 1].mainEnd;
  } else {
    mainPos = (boxes[index - 1].mainEnd + boxes[index].mainStart) / 2;
  }

  if (isRow) {
    return {
      left: mainPos - THICK / 2,
      top: c.rect.top + INSET,
      width: THICK,
      height: c.rect.height - INSET * 2,
    };
  }
  return {
    left: c.rect.left + INSET,
    top: mainPos - THICK / 2,
    width: c.rect.width - INSET * 2,
    height: THICK,
  };
}