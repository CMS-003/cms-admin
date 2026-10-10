import { useDraggable } from '@dnd-kit/react';
import { RestrictToVerticalAxis, RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers';
import { memo, useCallback, useContext, useMemo } from 'react';
import { observer, Observer } from 'mobx-react';

import BaseNode from '@/nodes'
import { ModeContext, TreeContext, EditorStatusContext } from '@/context';
import { useProxySelector } from '@/utils/valtio';
import type { INode } from '@/types';

/** 兜底：脱离 TreeContext 时（例如独立渲染）返回空列表 */
const EMPTY_CHILDREN: any[] = [];
const EMPTY_RESOLVER = () => EMPTY_CHILDREN;

/**
 * 节点渲染器。
 *
 * - observer：组件自身读到的 MST 数据（children / attrs.layout / isDragging）变化时重渲染
 * - <Observer>：把 <Com> 的渲染也纳入追踪，节点组件本身不用逐个包 observer，
 *   里面读 self.title / self.attrs 等照样能响应
 *
 * 组件只收「它自己的东西」（self / bindings / 子节点）：
 * 共享数据（source / query / actions / mode / page）一律走 `@/context`，
 * 容器只在「给子树换数据源」时包一层 <SourceScope>（Table 的行、Form 的详情、
 * Objects 的每一项），其余自动继承 —— 少一个 prop 就少一类
 * 「容器忘了往下传」的 bug（历史上漏过 page、漏过 source）。
 */
export const NodeWrapper = memo(observer(function ComponentView({ self, onContextMenu, onSelect }: INode) {
  const mode = useContext(ModeContext);
  const tree = useContext(TreeContext);

  const modifiers = useMemo(() => {
    const mods = [];
    if (self.attrs.layout === 'horizontal') mods.push(RestrictToHorizontalAxis);
    if (self.attrs.layout === 'vertical') mods.push(RestrictToVerticalAxis);
    // if (self.constrainToParent) mods.push(restrictToParentElement);
    return mods;
  }, [self.attrs.layout]);
  const { ref, handleRef, isDragging } = useDraggable({
    id: self._id,
    // preview 模式下禁止拖拽。
    // 新库的监听目标是 `source.handle ?? source.element`，而各节点的
    // GripVertical 是 `mode === 'edit' && ...` 条件渲染的；preview 下 handle
    // 不存在（handleRef 收到 null → draggable.handle = undefined），
    // 监听目标就会回落到根节点，导致整个节点可拖。
    // disabled 是响应式的，edit/preview 切换即时生效。
    disabled: mode !== 'edit',
    modifiers,
  });

  /**
   * .node-handle 是右键菜单的入口（root 不接右键），但 handle 元素自身没有
   * data-node-id（那个在 root 上），回调里读 e.currentTarget.dataset.nodeId 只会拿到
   * undefined → 菜单永远打不开。这里在 dnd-kit 的 ref 之外补一手：
   * 把 id/type 写到 handle 元素上，这样各节点组件、以及 Table/GridLayout 里
   * 嵌套透传的 onContextMenu 都不用改。
   */
  const nodeHandleRef = useCallback(
    (element: Element | null) => {
      handleRef(element);
      if (element) {
        element.setAttribute('data-node-id', self._id);
        element.setAttribute('data-node-type', self.type);
      }
    },
    [handleRef, self._id, self.type]
  );

  // ---------- 编辑态选中框 ----------
  const status = useContext(EditorStatusContext);

  /**
   * 选中标记，决定 CSS 用哪套配色。优先级：拖拽落点 > 鼠标悬停 > 正在编辑。
   *
   * 用 useProxySelector 而不是 useSnapshot：status 是 valtio proxy，
   * 整体订阅的话鼠标每划过一个节点，画布上所有节点都会重渲染一次。
   * 这里的 selector 返回字符串，值没变 React 就跳过这次重渲染。
   */
  const mark = useProxySelector(status, (s) => {
    if (mode !== 'edit') return '';
    const id = self._id;
    if (s.currNodeId === id) return s.dragging ? 'drag' : 'curr';
    if (s.editNodeId === id) return 'edit';
    return '';
  }) ?? '';

  // mouseenter 不冒泡，所以拿到的永远是鼠标底下最内层的那个节点
  const onMouseEnter = useCallback(() => {
    // 只有编辑态参与；拖拽中 currNodeId 归 hitTest 的落点容器，别被 hover 抢走
    if (!status || mode !== 'edit' || status.dragging) return;
    if (status.currNodeId !== self._id) status.currNodeId = self._id;
  }, [status, mode, self._id]);

  const onMouseLeave = useCallback(() => {
    if (!status || mode !== 'edit') return;
    // 移进子节点不会触发父节点的 mouseleave，所以这里只用管自己
    if (status.currNodeId === self._id) status.currNodeId = '';
  }, [status, mode, self._id]);

  // 扁平存储下 self.children 是 id 列表，这里只解析一层，
  // 子节点自己会在自己的 NodeWrapper 里继续往下解析。
  // tree 是 MST store 实例（身份稳定），getChildren 是可追踪的视图。
  const childrenNodes = tree ? tree.getChildren(self._id) : EMPTY_CHILDREN;

  // 需要往下多看一层时（例如 Table 的列里还要渲染列自己的子节点）用这个
  const resolveChildren = tree ? tree.getChildren : EMPTY_RESOLVER;

  const bindings = useMemo(
    () => ({
      root: {
        ref,
        'data-node-id': self._id,
        'data-node-type': self.type,
        // 选中框全靠它：CSS 里 [data-mark='edit']::after 那条规则画
        'data-mark': mark,
        onMouseEnter,
        onMouseLeave,
      },
      // 右键菜单统一由各组件挂到 .node-handle（拖拽手柄）上，root 不再承担
      onContextMenu,
      handleRef: nodeHandleRef,
      isDragging,
    }),
    [self._id, self.type, mark, onMouseEnter, onMouseLeave, onContextMenu, isDragging, ref, nodeHandleRef]
  );

  const Com = BaseNode[self.type as keyof typeof BaseNode];
  if (!Com) {
    return <div>不支持</div>;
  }
  return (
    <Observer>
      {() => (
        <Com
          self={self}
          bindings={bindings}
          childrenNodes={childrenNodes}
          resolveChildren={resolveChildren}
          onSelect={onSelect}
        >
          {childrenNodes.map(child => (
            <NodeWrapper key={child._id} self={child} onContextMenu={onContextMenu} onSelect={onSelect} />
          ))}
        </Com>
      )}
    </Observer>
  )
}));
