import { IAuto, IBaseComponent } from '@/types/component'
import { Select } from 'antd'
import { Observer, useLocalObservable } from 'mobx-react'
import { usePageContext } from '../context';

export default function CSelect({ self, mode, drag, dnd, children }: IAuto & IBaseComponent) {
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
          <span className="ant-input-group-addon">{self.title}</span>
          <Select
            open={local.open}
            defaultValue={self.widget.value}
            onChange={v => {
              page.setQuery(self.widget.field, v)
            }}
            onMouseDown={(e) => {
              if (e.button === 0) {
                setTimeout(() => {
                  local.setOpen(!local.open)
                }, 200)
              }
            }}
          >
            {self.widget.refer.map(t => (
              <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
            ))}
          </Select>
        </span>
      </span>
    </div>
  )}</Observer>
}