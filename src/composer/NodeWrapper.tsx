import { useDraggable } from '@dnd-kit/react';
import { RestrictToElement, RestrictToWindow } from '@dnd-kit/dom/modifiers';
import { RestrictToVerticalAxis, RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers';
import { INode } from '../types';
import { ModeContext, PageContext } from '@/groups/context';
import { memo, useContext, useMemo } from 'react';
import BaseNode from '../nodes/index'
import { TreeContext } from './TreeContext';

/** 兜底：脱离 TreeContext 时（例如独立渲染）返回空列表。身份稳定，避免破坏 memo */
const EMPTY_CHILDREN = () => [];

export const NodeWrapper = memo(function ComponentView({ self, setNodeField, source, setDataField, page, setQuery, onContextMenu, ...props }: INode) {
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

  // 扁平存储下 self.children 是 id 列表，这里只解析一层，
  // 子节点自己会在自己的 NodeWrapper 里继续往下解析。
  // tree.getChildren 读的是最新快照 → 读操作照常建立响应式依赖；
  // 而 tree 本身身份稳定，所以不会打破下面 memo 的比较。
  const childrenNodes = useMemo(
    () => (tree ? tree.getChildren(self._id) : []),
    [tree, self._id, self.children],
  );

  // 需要往下多看一层时（例如 Table 的列里还要渲染列自己的子节点）用这个
  const resolveChildren = tree ? tree.getChildren : EMPTY_CHILDREN;

  const bindings = useMemo(
    () => ({
      root: {
        ref,
        'data-node-id': self._id,
        'data-node-type': self.type,
        onContextMenu,
      },
      handleRef,
      isDragging,
    }),
    [self._id, self.type, onContextMenu, isDragging, ref, handleRef]
  );

  const Com = BaseNode[self.type as keyof typeof BaseNode];
  if (Com) {
    return (
      <Com self={self} setNodeField={setNodeField} bindings={bindings} page={page} setQuery={setQuery} source={source} setDataField={setDataField} mode={mode} childrenNodes={childrenNodes} resolveChildren={resolveChildren}>
        {childrenNodes.map(child => <NodeWrapper key={child._id} self={child} page={page} setQuery={setQuery} setNodeField={setNodeField} source={source} setDataField={setDataField} onContextMenu={bindings.root.onContextMenu} />)}
      </Com>
    )
  } else {
    return <div>不支持</div>
  }
})
