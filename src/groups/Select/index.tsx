import { IAuto, IBaseComponent } from '@/types/component'
import { Select, message } from 'antd'
import { Observer, useLocalObservable } from 'mobx-react'
import CONST from '@/constant';
import apis from '@/api';
import { useEffectOnce } from 'react-use';
import { ComponentWrap } from '../style';

export default function CSelect({ self, mode, drag, dnd, source, query, setDataField, children }: IAuto & IBaseComponent) {
  const data = !self.widget.query ? source : query;
  useEffectOnce(() => {
    if (!source._id || mode === 'edit' || self.widget.query) {
      setDataField(self.widget, self.widget.value)
    }
  })
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        whiteSpace: 'nowrap',
        flex: 0,
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <span className="ant-input-group-wrapper" style={self.style}>
        <span className="ant-input-wrapper ant-input-group" style={{ width: 'auto' }}>
          {self.title && <span className="ant-input-group-addon">{self.title}</span>}
          <Select
            value={data[self.widget.field]}
            disabled={mode === 'edit'}
            onChange={async (v) => {
              const old = data[self.widget.value as string]
              setDataField(self.widget, v)
              if (self.widget.action === CONST.ACTION_TYPE.FETCH) {
                try {
                  const result = await apis.fetch(self.widget.method, self.getApi(data._id), { [self.widget.field]: v })
                  if (result.code === 0) {
                    message.info('修改成功', 1)
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
          >
            {self.widget.refer.map((t, i) => (
              <Select.Option key={i} value={t.value}>{t.label}</Select.Option>
            ))}
          </Select>
        </span>
      </span>
    </ComponentWrap>
  )}</Observer>
}