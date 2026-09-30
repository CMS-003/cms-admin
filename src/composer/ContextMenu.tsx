// src/ContextMenu.tsx
import React from 'react';
import * as RadixMenu from '@radix-ui/react-context-menu';
import { IComponent, ITemplate } from '@/types';

export type MenuAction =
  | { kind: 'append'; parentId: string; nodeType: string }
  | { kind: 'delete'; nodeId: string }
  | { kind: 'edit'; nodeId: string };

type Props = {
  node: ITemplate | IComponent;
  /** 由父级注入：整个树的 root id，用于禁用 root 的删除 */
  template_id: string;
  onAction: (a: MenuAction) => void;
  children: React.ReactNode;
};

export function ContextMenu({ node, template_id, onAction, children }: Props) {
  const canAppend = true;// node.dir != null;              // 只有容器能加子节点
  const canDelete = node._id !== template_id;            // root 不可删
  const hasChildren = (node.children?.length ?? 0) > 0;

  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild>{children}</RadixMenu.Trigger>

      <RadixMenu.Portal>
        <RadixMenu.Content className="ctx-menu" collisionPadding={8}>
          {canAppend && (
            <>
              <RadixMenu.Sub>
                <RadixMenu.SubTrigger className="ctx-item">
                  新增子节点
                  <span className="ctx-arrow">▶</span>
                </RadixMenu.SubTrigger>
                <RadixMenu.Portal>
                  <RadixMenu.SubContent className="ctx-menu" sideOffset={4}>
                    {(['row', 'column', 'text']).map((t) => (
                      <RadixMenu.Item
                        key={t}
                        className="ctx-item"
                        onSelect={() =>
                          onAction({ kind: 'append', parentId: node._id, nodeType: t })
                        }
                      >
                        {t === 'row' ? '水平容器' : t === 'column' ? '垂直容器' : '文本'}
                      </RadixMenu.Item>
                    ))}
                  </RadixMenu.SubContent>
                </RadixMenu.Portal>
              </RadixMenu.Sub>
              <RadixMenu.Separator className="ctx-sep" />
            </>
          )}

          <RadixMenu.Item
            className="ctx-item"
            onSelect={() => onAction({ kind: 'edit', nodeId: node._id })}
          >
            编辑属性
          </RadixMenu.Item>

          <RadixMenu.Separator className="ctx-sep" />

          <RadixMenu.Item
            className="ctx-item ctx-item--danger"
            disabled={!canDelete}
            onSelect={() => onAction({ kind: 'delete', nodeId: node._id })}
          >
            删除{hasChildren ? '（含子节点）' : ''}
          </RadixMenu.Item>
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}