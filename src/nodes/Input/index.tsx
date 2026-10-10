import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import { Input, Space } from 'antd'
import { useLocalProxy } from "@/utils/valtio";
import { pick, get } from 'lodash-es';
import CONST from "@/constant";
import events from '@/utils/event';

export default function CInput({ self, actions, bindings, source, mode, page, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  const [localState, localStore] = useLocalProxy({
    composing: false,
  });

  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    <div>
      {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    </div>

    <Input
      style={{ flex: 1 }}
      value={get(source, self.widget.field)}
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
            refer: []
          }, 1)
          events.emit(CONST.ACTION_TYPE.SEARCH, { target: pick(page, ['template_id', 'path', 'param', 'query']) })
        }
      }}
    />
  </div>
}