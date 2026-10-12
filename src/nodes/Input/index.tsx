import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import { Input, Space } from 'antd'
import { useLocalProxy } from "@/utils/valtio";
import { pick, get } from 'lodash-es';
import CONST from "@/constant";
import events from '@/utils/event';
import { useActions, useMode, usePage, useSource } from "@/context";

export default function CInput({ self, bindings }: IBaseCom) {
  const source = useSource();
  const actions = useActions();
  const mode = useMode();
  const page = usePage();
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  const [localState, localStore] = useLocalProxy({
    composing: false,
  });

  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row', flex: 1
    }}>
    <div>
      {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    </div>

    <Space.Compact block>
      {self.title ? <Space.Addon style={{ flexShrink: 0 }}>{self.title}</Space.Addon> : null}
      <Input
        value={get(source, self.widget.field)}
        name={self._id}
        onCompositionStart={() => {
          localStore.composing = true
        }}
        onCompositionEnd={() => {
          localStore.composing = false
        }}
        onChange={e => {
          actions.setDataField(self.widget, e.target.value);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' && !localStore.composing && self.widget.action === CONST.ACTION_TYPE.SEARCH) {
            actions.setDataField({
              field: 'page',
              type: 'number',
              source: '',
              value: 1,
              query: true,
              action: '',
              method: '',
              refer: [],
              mapping: {},
            }, 1)
            events.emit(CONST.ACTION_TYPE.SEARCH, { target: pick(page, ['template_id', 'path', 'param', 'query']) })
          }
        }}
      />
    </Space.Compact>
  </div>
}
