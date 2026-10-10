import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import { Select, Space, message } from 'antd'
import store from "@/store";
import { useEffect } from "react";
import apis from "@/api";
import CONST from "@/constant";
import { get } from 'lodash-es';
import { useActions, useMode, useQuery, useQueryScope, useSource } from "@/context";

export default function CSelect({ self, bindings }: IBaseCom) {
  const source = useSource();
  const actions = useActions();
  const mode = useMode();
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  /** 仅查询：数据源是页面查询条件，不是表单的 source */
  const isQuery = !!self.widget.query;
  const field = self.widget.field;
  // 在 render 里读一次默认值 —— 编辑面板改「默认值」时能重渲染，下面那个 effect 才会重跑。
  const defaultValue = self.widget.value;

  const queryScope = useQueryScope();
  /**
   * 仅查询模式下数据源是页面查询条件域（逐字段写入）。
   * useQuery 按值订阅：selector 返回原始值，值没变 React 会跳过这次渲染 ——
   * 所以查询栏每敲一个字不会把整个画布带着重渲染。
   */
  const queryValue = useQuery(field);

  // 不能用 `source[field] || ''`：0 / false 都是合法值（状态类下拉就是从 0 起步），
  // `||` 会把它们吞成空串，框里看着像「没值」。
  // 字段支持点路径（和后端字段同名），所以走 lodash get，与 Input / Radio 保持一致。
  const value = isQuery ? queryValue : get(source, field);

  useEffect(() => {
    // 编辑态 / 仅查询 / 还没有真实数据（新建）时，把默认值灌进数据源
    if (mode === 'edit' || isQuery || !source?._id) {
      actions.setDataField(self.widget, defaultValue);
    }
    // source / actions 故意不进依赖：数据源一变就重灌会把用户刚填的值冲掉
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue, mode, isQuery]);

  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}

    <Space.Compact>
      {self.title ? <Space.Addon>{self.title}</Space.Addon> : null}
      <Select
        style={{ flex: 1 }}
        // null / undefined 才当归成「没值」（显示 placeholder）。
        // 只把 nullish 归一，'' 要留着 —— 「全部」这类选项的 value 就是 ''，得能匹配上。
        value={value ?? undefined}
        onChange={async (v) => {
          if (mode === 'edit') return;
          // 回滚要读的是「本字段」的原值（现读查询域 / 当前子树的数据源）
          const data: any = isQuery ? (queryScope.get() ?? {}) : source;
          const old = get(data, field)
          actions.setDataField(self.widget, v)
          if (self.widget.action === CONST.ACTION_TYPE.FETCH) {
            try {
              const result = await apis.fetch(self.widget.method, self.getApi({ id: data?._id }), { [field]: v })
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
    </Space.Compact>
  </div>
}
