import { IAuto, IBaseComponent } from '@/types/component'
import { Select, message } from 'antd'
import { Observer, useLocalObservable } from 'mobx-react'
import CONST from '@/constant';
import apis from '@/api';
import { useEffectOnce } from 'react-use';

export default function CSelect({ self, mode, drag, dnd, source, query, setDataField, children }: IAuto & IBaseComponent) {
  // TODO: 编辑状态下右键会触发下拉
  const data = self.widget.in === 'body' ? source : query;
  const local = useLocalObservable(() => ({
    open: false,
    setOpen(b: boolean) {
      this.open = b
    }
  }))
  useEffectOnce(() => {
    if (!source._id || mode === 'edit') {
      setDataField(self.widget, self.widget.value)
    }
  })
  return <Observer>{() => (
    <div
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        display: 'flex',
        flexDirection: 'row',
        whiteSpace: 'nowrap',
        alignItems: 'center',
        flex: 0,
        ...self.style,
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <span className="ant-input-group-wrapper">
        <span className="ant-input-wrapper ant-input-group">
          {self.title && <span className="ant-input-group-addon">{self.title}</span>}
          <Select
            open={local.open}
            value={data[self.widget.field]}
            onChange={async (v) => {
              const old = data[self.widget.value as string]
              setDataField(self.widget, v)
              if (self.widget.action === CONST.ACTION_TYPE.UPDATE && self.api) {
                try {
                  const result = await apis.putData(self.getApi(data._id), { [self.widget.field]: v })
                  if (result.code === 0) {

                  } else {
                    setDataField(self.widget, old)
                    message.warn(result.message);
                  }
                } catch (e) {
                  setDataField(self.widget, old)
                  message.warn('修改失败')
                }
              }
            }}
            onMouseDown={(e) => {
              if (e.button === 0) {
                local.setOpen(!local.open)
              }
            }}
          >
            {self.widget.refer.map((t, i) => (
              <Select.Option key={i} value={t.value}>{t.label}</Select.Option>
            ))}
          </Select>
        </span>
      </span>
    </div>
  )}</Observer>
}