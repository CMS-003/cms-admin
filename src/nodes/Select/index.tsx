import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import { Select, Space, message } from 'antd'
import store from "@/store";
import { useEffectOnce } from "react-use";
import apis from "@/api";
import CONST from "@/constant";
import { snapshot } from "valtio";

export default function CSelect({ self, actions, bindings, source, mode, page, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  const data = !self.widget.query ? source : page.query;

  useEffectOnce(() => {
    if (!source._id || mode === 'edit' || self.widget.query) {
      actions.setDataField(self.widget, self.widget.value)
    }
  })
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    <Select
      style={{ flex: 1 }}
      value={data[self.widget.field] || ''}
      onChange={async (v) => {
        if (mode === 'edit') return;
        const old = data[self.widget.value as string]
        actions.setDataField(self.widget, v)
        if (self.widget.action === CONST.ACTION_TYPE.FETCH) {
          try {
            const result = await apis.fetch(self.widget.method, self.getApi({ id: data._id }), { [self.widget.field]: v })
            if (result.code === 0) {
              message.info('修改成功', 1)
            } else {
              actions.setDataField(self.widget, old)
              message.warning(result.message);
            }
          } catch (e) {
            actions.setDataField(self.widget, old)
            message.warning('修改失败')
          }
        }
      }}
    >
      {[...self.widget.refer, ...(store.global.getValue(self.widget.source) || [])].map((t: any, i: number) => (
        <Select.Option key={i} value={t.value}>{t.label}</Select.Option>
      ))}
    </Select>
  </div>
}