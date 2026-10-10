import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import { message, Switch } from "antd";
import { useEffectOnce } from "react-use";
import { useLocalProxy } from "@/utils/valtio";
import apis from "@/api";
import CONST from "@/constant";

export default function CSwitch({ self, actions, bindings, source, mode, page, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  const [localState, localStore] = useLocalProxy({
    TRUE: '开启',
    FALSE: '关闭'
  })
  useEffectOnce(() => {
    const i1 = self.widget.refer.findIndex((v: any) => ['1', 1, 'true', true, 'TRUE'].includes(v.value))
    const i0 = self.widget.refer.findIndex((v: any) => !['1', 1, true, 'true', 'TRUE'].includes(v.value))
    if (i1 !== -1) {
      localStore.TRUE = self.widget.refer[i1].label
    }
    if (i0 !== -1) {
      localStore.FALSE = self.widget.refer[i0].label
    }
  })
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    <div style={{ lineHeight: '32px' }}>
      {self.title && <span style={{ marginRight: 10 }}>{self.title}</span>}
      <Switch checkedChildren={localState.TRUE} unCheckedChildren={localState.FALSE} checked={[1, '1', 'TRUE', 'true', true].includes(!self.widget.query ? source[self.widget.field] : page.query[self.widget.field])} onChange={checked => {
        actions.setDataField(self.widget, checked)
        if (self.widget.action === CONST.ACTION_TYPE.FETCH) {
          apis.fetch(self.widget.method, self.getApi({ id: source._id }), { [self.widget.field]: checked })
            .then(resp => {
              if (resp.code !== 0) {
                actions.setDataField(self.widget, !checked)
                message.error('修改失败', 1)
              } else {
                message.info('修改成功', 1)
              }

            })
            .catch(e => {
              actions.setDataField(self.widget, !checked)
              message.error('请求出错', 1)
            });
        }
      }} />
    </div>
  </div>
}