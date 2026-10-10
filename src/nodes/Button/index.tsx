import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import { Button, message, notification } from 'antd'
import CONST from '@/constant';
import { Acon } from '@/components';
import apis from '@/api';
import { isEmpty, pick } from 'lodash-es';
import events from '@/utils/event';
import { useNavigate } from 'react-router-dom'
import { useLocalProxy } from "@/utils/valtio";

export default function CButton({ self, actions, source, bindings, mode, page, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  const navigate = useNavigate()
  const [localState, localStore] = useLocalProxy({
    template_id: '',
    id: '',
  })
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    </div>
    <Button type={self.attrs.type || 'primary'} icon={self.icon ? <Acon icon={self.icon} /> : null} onClick={async () => {
      if (self.widget.action === CONST.ACTION_TYPE.SEARCH) {
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
      } else if (self.widget.action === CONST.ACTION_TYPE.GOTO_PAGE || self.widget.action === CONST.ACTION_TYPE.OPEN_URL) {
        navigate(`${self.url}?id=`)
      } else if (self.widget.action === CONST.ACTION_TYPE.MODAL) {
        localStore.template_id = self.widget.method
      } else if (self.widget.action === CONST.ACTION_TYPE.FETCH) {
        const params = self.getApi({ id: source._id, [self.widget.field]: source[self.widget.field] });
        const data = isEmpty(self.widget.refer) ? source : pick(source, self.widget.refer.map((r: any) => r.value as string));
        const result = await apis.fetch(self.widget.method, params, data,)
        if (result.code === 0) {
          notification.info({ title: '请求成功', placement: 'topRight' })
        } else {
          message.warning(result.message);
        }
      }
    }}>{self.title}</Button>
  </div>
}