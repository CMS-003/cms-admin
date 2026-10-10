import type { DragMoveEvent, DragStartEvent } from '@dnd-kit/react';
import type { MutableRefObject } from 'react';
import type { EditorStatus } from '@/types';
import type { TreeStoreInstance } from '@/store/tree';
import { createDragPreview } from './preview';
import { ContainerInfo, DropTarget, getIndicatorRect, hitTest, measureContainers } from './geometry';

/** 组件库拖拽项的 id 前缀：`palette:Icon` → 类型就是后面那段 */
export const PALETTE_PREFIX = 'palette:';

/** 略大于 CSS 里 gap 过渡的 200ms */
const GAP_TRANSITION_MS = 220;

type DragDeps = {
  /** 编辑器状态：拖拽要把落点写进 currNodeId，并切换 dragging 配色 */
  status: EditorStatus;
  /** 当前模板树的 store（由 TemplateView 经 apiRef 交过来） */
  treeRef: MutableRefObject<TreeStoreInstance | null>;
  /** 画布元素：既是 DragOverlay 的挂载点，也是 hitTest 的坐标原点 */
  canvasRef: MutableRefObject<HTMLDivElement | null>;
  /** 拖拽预览的 DOM 克隆体（原生 DOM，塞不进 valtio proxy，只能走 ref） */
  previewRef: MutableRefObject<HTMLElement | null>;
};

/**
 * 拖拽状态机（画布那一层）。
 *
 * 单独拎出来是因为它和「渲染」没有半点关系：整个过程只有三件事 ——
 * 量容器矩形、命中测试算落点、松手时新建 / 移动节点。
 * 留在 EditorView 里会让组件一半是拖拽逻辑。
 *
 * 返回值直接喂给 `useLocalProxy`（valtio proxy），所以内部一律用 `this.xxx` 读写，
 * 交给组件的是 [snapshot, store] 两份。
 */
export function createDragStore({ status, treeRef, canvasRef, previewRef }: DragDeps) {
  return {
    // ---------- 拖拽界面状态 ----------
    activeId: '',
    /** 正在拖的东西的类型（palette 项就是它自己的 type，画布节点取节点的 type）。拖放约束按它判定 */
    dragType: '',
    drop: null as DropTarget | null,
    containers: [] as ContainerInfo[],
    /** 被屏蔽的容器（拖画布节点时 = 它自己 + 所有后代） */
    blocked: new Set<string>(),
    canvasBase: { left: 0, top: 0 },
    /** 插入位置指示条（蓝条）的矩形，没落点时为 null */
    get indicator() {
      if (!this.drop) return null;
      const c = this.containers.find((x: ContainerInfo) => x.id === this.drop!.containerId);
      return c ? getIndicatorRect(c, this.drop.index) : null;
    },

    /** 量一遍所有容器的矩形（相对画布左上角） */
    measure() {
      const canvas = canvasRef.current;
      const tree = treeRef.current;
      if (!canvas || !tree) return;
      const root = tree.getNode(tree.rootId);
      if (!root) return;
      this.containers = measureContainers(root as any, canvas, tree.getChildren);
      const r = canvas.getBoundingClientRect();
      this.canvasBase = { left: r.left, top: r.top };
    },

    dragStart(event: DragStartEvent) {
      const id = String(event.operation.source?.id);
      this.activeId = id;

      // 抓一份源元素的 DOM 克隆当预览。
      // source.element 就是「发起拖拽的那个元素」——画布节点是它的根 div
      // （NodeWrapper 把 useDraggable 的 ref 挂在 bindings.root 上），
      // 组件库里的项就是 palette-item。两者同一条路径，不用分开处理。
      previewRef.current = createDragPreview(event.operation.source?.element);

      // 进入拖拽态：currNodeId 的配色从「悬停(天蓝)」切成「落点(淡黄)」，
      // 旧的悬停值先清掉，免得拖拽还没移动时残留一个悬停框
      status.dragging = true;
      status.currNodeId = '';

      const tree = treeRef.current;
      if (id.startsWith(PALETTE_PREFIX)) {
        // 从组件库拖入：不屏蔽任何容器，类型就是 palette 后面的那段
        this.blocked = new Set();
        this.dragType = id.slice(PALETTE_PREFIX.length);
      } else {
        // 从画布拖出：屏蔽自身 + 所有后代
        this.blocked = tree ? new Set(tree.collectSubtree(id)) : new Set();
        this.dragType = tree?.getNode(id)?.type ?? '';
      }

      // 两阶段测量：
      // 1) rAF 后先测一次，尽量贴近"按下瞬间"的布局
      // 2) gap 过渡结束后再测一次，得到最终布局
      requestAnimationFrame(() => {
        this.measure();
        window.setTimeout(() => this.measure(), GAP_TRANSITION_MS);
      });
    },

    dragMove(event: DragMoveEvent) {
      // ⚠️ 不能读 event.operation.position.delta。
      // DragOperation.snapshot() 里是 `position: snapshot(this.position)`，
      // 而 snapshot() 只做 for...in 浅拷贝（仅可枚举属性）；delta / initial 是
      // Position 原型上的 class getter（不可枚举），拷贝后被丢掉 → undefined。
      //
      // event.to 和 position.current 都是视口坐标（底层 getEventCoordinates
      // 取的就是 clientX / clientY）。而 hitTest 需要的是相对 canvas 左上角的
      // 坐标（measureContainers 把一切归一化到 getRelativeRect(el, canvas)），
      // 所以这里要减去 canvas 的 boundingClientRect。
      const point = event.to ?? event.operation.position.current;
      const canvas = canvasRef.current;
      if (!point || !canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = point.x - rect.left;
      const y = point.y - rect.top;

      const tree = treeRef.current;
      const id = this.activeId;
      // 拖放约束：不接收这种子节点的容器被跳过，判定往祖先容器落
      const canDrop = tree
        ? (containerId: string) => tree.canAccept(containerId, this.dragType)
        : undefined;

      const raw = hitTest(this.containers, x, y, this.blocked, { canDrop });
      if (!raw || !id) {
        if (this.drop !== null) this.drop = null;
        if (status.currNodeId !== '') status.currNodeId = '';
        return;
      }
      // 画布内节点：等价于原地不动的落点视为无效
      if (!id.startsWith(PALETTE_PREFIX) && tree && tree.isNoopDrop(id, raw)) {
        if (this.drop !== null) this.drop = null;
        if (status.currNodeId !== '') status.currNodeId = '';
        return;
      }

      const prev = this.drop;
      const same = prev !== null && prev.containerId === raw.containerId && prev.index === raw.index;

      if (!same) {
        this.drop = raw;
        // 落点容器自己把「淡黄」画在自个儿身上，不再由画布盖一层 hitTest 算出来的
        // 矩形 —— 那个对 Table / GridLayout 这类自定义子结构框不准
        if (status.currNodeId !== raw.containerId) {
          status.currNodeId = raw.containerId;
        }
      }
    },

    dragReset() {
      this.activeId = '';
      this.dragType = '';
      this.drop = null;
      // 预览的克隆体只活一次拖拽；下次 dragStart 会重新抓一份
      // （节点的 DOM 可能在两次拖拽之间变过，不能复用旧的）
      previewRef.current = null;
      this.containers = [];
      this.blocked = new Set();
      // 退出拖拽态。currNodeId 一并清掉：拖拽结束后鼠标常常还停在原地不动，
      // 不清就会一直挂着那个淡黄框
      status.dragging = false;
      status.currNodeId = '';
    },

    dragEnd() {
      const id = this.activeId;
      const target = this.drop;
      const tree = treeRef.current;

      if (id && target && tree) {
        // 落点已经过 canAccept 过滤，这里再判一次兜底（drop 可能是上一帧留下的）
        if (!tree.canAccept(target.containerId, this.dragType)) {
          this.dragReset();
          return;
        }
        if (id.startsWith(PALETTE_PREFIX)) {
          // 来自组件库：按 type 新建节点（新节点 id 由 createNode 生成 uuid v7）
          const node = tree.createAndInsert(target.containerId, target.index, id.slice(PALETTE_PREFIX.length));
          // 新建完直接把编辑面板开到新节点上
          if (node) status.editNodeId = node._id;
        } else if (!tree.isNoopDrop(id, target)) {
          // 来自画布 → 移动
          tree.move(id, target.containerId, target.index);
        }
      }
      this.dragReset();
    },
  };
}
