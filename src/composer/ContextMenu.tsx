import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { createContext, useContext } from 'react';
import { useSnapshot } from 'valtio';
import { TreeContext } from './TreeContext';
import { acceptedTypes } from './componentTypes';

export type MenuAction = {
  kind: 'edit' | 'append' | 'delete';
  nodeId: string;
  /** kind === 'append'：要新建的子节点类型 */
  type?: string;
  /** kind === 'edit'：EditorPanel 打开后定位到哪个 tab */
  tab?: string;
};

type CONTEXTMENU = {
  id: string;
  x: number;
  y: number;
  open: Function;
  close: Function;
}

export const ContextMenuContext = createContext<CONTEXTMENU | null>(null)

/** tab 入口，key 和 EditorPanel 的 items 一一对应 */
const TABS: Array<{ tab: string; label: string }> = [
  { tab: 'base', label: '编辑属性' },
  { tab: 'widget', label: '控件' },
  { tab: 'data', label: '数据' },
  { tab: 'event', label: '事件' },
  { tab: 'layout', label: '布局' },
];

export function ContextMenuContent({
  contextmenu, onAction,
}: {
  contextmenu: { x: number; y: number; id: string; open: Function; close: Function };
  onAction: (a: MenuAction) => void;
}) {
  const state = useSnapshot(contextmenu)
  const tree = useContext(TreeContext);

  // 目标节点：能不能加子节点、能加哪些类型，全看它自己的 accepts / level
  const node = state.id && tree ? tree.getNode(state.id) : undefined;
  const childTypes = node ? acceptedTypes(node.type, node.accepts) : [];
  const canAppend = !!node;
  const canDelete = !!node && !!node.parent_id;   // 根节点不可删

  return (
    <DropdownMenu.Root open={state.id !== ''} onOpenChange={(o) => { if (!o) contextmenu.close(); }}>
      {/* Trigger 是一个 0×0 的 fixed span，每次打开时定位到 (x, y) */}
      <DropdownMenu.Trigger asChild>
        <span className="ctx-anchor" style={{ left: state.x, top: state.y }} />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="ctx-menu"
          side="right"
          align="start"
          sideOffset={4}
          collisionPadding={8}
          // 关键：阻止关闭时焦点跑回 0×0 的 trigger
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {TABS.map((t) => (
            <DropdownMenu.Item
              key={t.tab}
              className="ctx-item"
              onSelect={() => onAction({ kind: 'edit', nodeId: state.id, tab: t.tab })}
            >
              {t.label}
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator className="ctx-sep" />

          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className="ctx-item" disabled={!canAppend}>
              新增子节点
              <span className="ctx-arrow">▶</span>
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent className="ctx-menu" sideOffset={4}>
                {/* 只有 accepts 里点名接收、或 accepts 含 all 且 level 为 1 的类型才会出现在这里 */}
                {childTypes.length === 0
                  ? (
                    <DropdownMenu.Item className="ctx-item" disabled>
                      {canAppend ? '不接受任何子节点' : '—'}
                    </DropdownMenu.Item>
                  )
                  : childTypes.map((t) => (
                    <DropdownMenu.Item
                      key={t.name}
                      className="ctx-item"
                      onSelect={() => onAction({ kind: 'append', nodeId: state.id, type: t.name })}
                    >
                      {t.title || t.name}
                    </DropdownMenu.Item>
                  ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>

          <DropdownMenu.Separator className="ctx-sep" />

          <DropdownMenu.Item
            className="ctx-item ctx-item--danger"
            disabled={!canDelete}
            onSelect={() => onAction({ kind: 'delete', nodeId: state.id })}
          >
            删除
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
