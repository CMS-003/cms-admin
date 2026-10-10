import { IBaseCom, IResource } from "@/types";
import { GripVertical } from "lucide-react";
import styled from 'styled-components';
import { get } from 'lodash-es';
import { FullHeight } from "@/components/style";
import { NodeWrapper } from "@/composer/NodeWrapper";
import { SourceScope, useActions, useMode, useSource } from "@/context";

const ObjectItem = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  align-items: flex-start;
  flex: 1;
  padding: 2px;
  border: 1px dashed #00000036;
  width: 100%;
  gap: 5px;
`

export default function CObjects({ self, bindings, children, childrenNodes }: IBaseCom) {
  const source = useSource();
  const actions = useActions();
  const mode = useMode();
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');

  /** 本节点铺开的就是 source 里 widget.field 指向的那个数组（参考 groups 的 ObjectList） */
  const field = get(source, self.widget.field);
  const list: IResource[] = Array.isArray(field) ? field : [];

  /**
   * 某一行的写回。数组整体躺在别处（模板级 store.source / Form 的 source），
   * 直接改 item 是改快照，没人会知道，所以是「整段替换后交给所在子树写」：
   * 走 actions.setDataField → 由当前 DataEnv 的 writeSource 落到该写的地方。
   */
  const writeItem = (item: any, fallbackIndex: number) => (field: string, value: any) => {
    const current = get(source, self.widget.field);
    if (!Array.isArray(current)) return;
    // 优先按 _id 定位（列表可能被重排 / 增删），没有 id 才退回下标
    const idx = item?._id ? current.findIndex((it: any) => it?._id === item._id) : fallbackIndex;
    if (idx < 0 || idx >= current.length) return;
    const next = current.slice();
    next[idx] = { ...next[idx], [field]: value };
    actions.setDataField(self.widget, next);
  };

  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    </div>
    <FullHeight style={{ flex: 1, gap: 5 }}>
      {mode === 'edit'
        ? children
        : list.map((item: IResource, i: number) => (
          /* 每行数据 = 一个数据域：子树读它自己的那一份，写回落回数组对应的那一项 */
          <SourceScope key={item?._id ?? i} source={item} write={writeItem(item, i)}>
            <ObjectItem>
              {childrenNodes.map(child => (
                <NodeWrapper key={child._id} self={child} onContextMenu={bindings.onContextMenu} />
              ))}
            </ObjectItem>
          </SourceScope>
        ))}
    </FullHeight>
  </div>
}
