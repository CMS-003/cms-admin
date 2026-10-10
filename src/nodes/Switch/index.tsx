import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import { message, Switch } from "antd";
import { useEffectOnce } from "react-use";
import { useLocalProxy } from "@/utils/valtio";
import { useQuery } from "@/composer/DataContext";
import { get } from 'lodash-es';
import apis from "@/api";
import CONST from "@/constant";

export default function CSwitch({ self, actions, bindings, source, mode, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  /** 仅查询：数据源是页面查询条件，不是表单的 source */
  const isQuery = !!self.widget.query;
  const field = self.widget.field;
  const [localState, localStore] = useLocalProxy({
    TRUE: '开启',
    FALSE: '关闭'
  })

  /**
   * 仅查询模式下数据源是页面查询条件域（逐字段写入）。
   * 必须按值订阅（useQuery）：直接 `page.query[field]` 读是一次性的，
   * 查询条件变了开关不会动。
   */
  const queryValue = useQuery(field);

  // 非查询走当前子树的数据源（快照语义，父级换引用即重渲染）。
  // 字段支持点路径，所以走 lodash get，与 Input / Select 保持一致。
  const raw = isQuery ? queryValue : get(source, field);
  const checked = [1, '1', 'TRUE', 'true', true].includes(raw as any);

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
      <Switch checkedChildren={localState.TRUE} unCheckedChildren={localState.FALSE} checked={checked} onChange={next => {
        actions.setDataField(self.widget, next)
        if (self.widget.action === CONST.ACTION_TYPE.FETCH) {
          apis.fetch(self.widget.method, self.getApi({ id: source?._id }), { [field]: next })
            .then(resp => {
              if (resp.code !== 0) {
                actions.setDataField(self.widget, !next)
                message.error('修改失败', 1)
              } else {
                message.info('修改成功', 1)
              }

            })
            .catch(e => {
              actions.setDataField(self.widget, !next)
              message.error('请求出错', 1)
            });
        }
      }} />
    </div>
  </div>
}