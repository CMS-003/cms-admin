import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useSnapshot } from 'valtio';

export type MenuAction =
  | { kind: 'append'; parentId: string; nodeType: string }
  | { kind: 'delete'; nodeId: string }
  | { kind: 'edit'; nodeId: string };
const NODE_TYPES: Array<{ type: string; label: string }> = [
  { type: 'row', label: '水平容器' },
  { type: 'column', label: '垂直容器' },
  { type: 'text', label: '文本' },
];

export function ContextMenuContent({
  contextmenu, onAction,
}: {
  contextmenu: { x: number; y: number; id: string; open: Function; close: Function };
  onAction: (a: MenuAction) => void;
}) {
  const state = useSnapshot(contextmenu)
  console.log(state)
  const canAppend = true;// node.dir != null;         // 只有容器能加子节点
  const canDelete = true;//node._id !== nodeId;       // root 不可删

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
          {canAppend && (
            <>
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger className="ctx-item">
                  新增子节点
                  <span className="ctx-arrow">▶</span>
                </DropdownMenu.SubTrigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.SubContent className="ctx-menu" sideOffset={4}>
                    {NODE_TYPES.map((t) => (
                      <DropdownMenu.Item
                        key={t.type}
                        className="ctx-item"
                        onSelect={() =>
                          onAction({
                            kind: 'append',
                            parentId: state.id,
                            nodeType: t.type,
                          })
                        }
                      >
                        {t.label}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.SubContent>
                </DropdownMenu.Portal>
              </DropdownMenu.Sub>

              <DropdownMenu.Separator className="ctx-sep" />
            </>
          )}

          <DropdownMenu.Item
            className="ctx-item"
            onSelect={() => onAction({ kind: 'edit', nodeId: state.id })}
          >
            编辑属性
          </DropdownMenu.Item>

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
