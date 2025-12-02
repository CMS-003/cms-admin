import { IAuto, IBaseComponent } from '@/types/component'
import { Switch, message } from 'antd'
import { runInAction } from 'mobx';
import { Observer, useLocalObservable } from 'mobx-react'
import { useEffectOnce } from 'react-use'
import { ComponentWrap } from '../style';
import CONST from '@/constant';
import apis from '@/api';

export default function CSwitch({ self, mode, query = {}, source = {}, drag, initField = true, setDataField, children }: IAuto & IBaseComponent) {
  const local = useLocalObservable(() => ({
    TRUE: '开启',
    FALSE: '关闭',

  }))
  useEffectOnce(() => {
    const i1 = self.widget.refer.findIndex(v => ['1', 1, 'true', true, 'TRUE'].includes(v.value))
    const i0 = self.widget.refer.findIndex(v => !['1', 1, true, 'true', 'TRUE'].includes(v.value))
    runInAction(() => {
      if (i1 !== -1) {
        local.TRUE = self.widget.refer[i1].label
      }
      if (i0 !== -1) {
        local.FALSE = self.widget.refer[i0].label
      }
    })
    if (!source._id && initField) {
      setDataField(self.widget, self.widget.value)
    }
  })
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
      style={self.style}
    >
      {children}
      <div style={{ lineHeight: '32px' }}>
        {self.title && <span style={{ marginRight: 10 }}>{self.title}</span>}
        {/* @ts-ignore */}
        <Switch checkedChildren={local.TRUE} unCheckedChildren={local.FALSE} checked={[1, '1', 'TRUE', 'true', true].includes(!self.widget.query ? source[self.widget.field] : query[self.widget.field])} onChange={checked => {
          setDataField(self.widget, checked)
          if (self.widget.action === CONST.ACTION_TYPE.FETCH) {
            apis.fetch(self.widget.method, self.getApi(source._id), { [self.widget.field]: checked })
              .then(resp => {
                if (resp.code !== 0) {
                  setDataField(self.widget, !checked)
                  message.error('修改失败', 1)
                } else {
                  message.info('修改成功', 1)
                }

              })
              .catch(e => {
                setDataField(self.widget, !checked)
                message.error('请求出错', 1)
              });
          }
        }} />
      </div>
    </ComponentWrap>
  )}</Observer>
}