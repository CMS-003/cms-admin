import { IAuto, IBaseComponent } from '@/types/component'
import { Select, message } from 'antd'
import { Observer, useLocalObservable } from 'mobx-react'
import { usePageContext } from '../context';
import CONST from '@/constant';
import apis from '@/api';

export default function CSelect({ self, mode, drag, dnd, source, children }: IAuto & IBaseComponent) {
  const page = usePageContext();
  const local = useLocalObservable(() => ({
    open: false,
    setOpen(b: boolean) {
      this.open = b
    }
  }))
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
            defaultValue={self.widget.action === CONST.ACTION_TYPE.FILTER ? self.widget.value : (source || {})[self.widget.field]}
            onChange={async (v) => {
              if (self.widget.action === CONST.ACTION_TYPE.FILTER) {
                page.setQuery(self.widget.field, v)
              } else if (self.widget.action === CONST.ACTION_TYPE.UPDATE) {
                const old = source[self.widget.value as string]
                try {
                  const result = await apis.putData(self.getApi(source._id), { [self.widget.field]: v })
                  if (result.code === 0) {

                  } else {
                    message.warn(result.message);
                  }
                } catch (e) {
                  message.warn('修改失败')
                }
              }
            }}
            onMouseDown={(e) => {
              if (e.button === 0) {
                setTimeout(() => {
                  local.setOpen(!local.open)
                }, 200)
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