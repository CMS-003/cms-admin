import { useDraggable } from '@dnd-kit/react';
import { RestrictToVerticalAxis, RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers';
import { INode } from '../types';
import { ModeContext, PageContext } from '@/groups/context';
import { memo, useCallback, useContext, useMemo } from 'react';
import { observer, Observer } from 'mobx-react';
import BaseNode from '../nodes/index'
import { TreeContext } from './TreeContext';

/** 兜底：脱离 TreeContext 时（例如独立渲染）返回空列表 */
const EMPTY_CHILDREN: any[] = [];
const EMPTY_RESOLVER = () => EMPTY_CHILDREN;

/**
 * 节点渲染器。
 *
 * - observer：组件自身读到的 MST 数据（children / attrs.layout / isDragging）变化时重渲染
 * - <Observer>：把 <Com> 的渲染也纳入追踪，节点组件本身不用逐个包 observer，
 *   里面读 self.title / self.attrs 等照样能响应
 * - 方法类 props（setNodeField / setDataField / setQuery）合并成一个 actions 对象传递
 */
export const NodeWrapper = memo(observer(function ComponentView({ self, actions, source, page, onContextMenu }: INode) {
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
   * 把 id/type 写到 handle 元素上，这样 34 个节点组件、以及 Table/GridLayout 里
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
      },
      // 右键菜单统一由各组件挂到 .node-handle（拖拽手柄）上，root 不再承担
      onContextMenu,
      handleRef: nodeHandleRef,
      isDragging,
    }),
    [self._id, self.type, onContextMenu, isDragging, ref, nodeHandleRef]
  );

  const Com = BaseNode[self.type as keyof typeof BaseNode];
  if (Com) {
    return (
      <Observer>
        {() => (
          <Com self={self} actions={actions} bindings={bindings} page={page} source={source} mode={mode} childrenNodes={childrenNodes} resolveChildren={resolveChildren}>
            {childrenNodes.map(child => (
              <NodeWrapper key={child._id} self={child} page={page} source={source} actions={actions} onContextMenu={onContextMenu} />
            ))}
          </Com>
        )}
      </Observer>
    )
  } else {
    return <div>不支持</div>
  }
}));
