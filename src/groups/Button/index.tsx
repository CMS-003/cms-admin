import { IAuto, IBaseComponent } from '@/types/component'
import { Button, message, notification } from 'antd'
import { Observer, useLocalObservable } from 'mobx-react'
import events from '@/utils/event';
import { isEmpty, pick } from 'lodash-es';
import { useNavigate } from 'react-router-dom'
import CONST from '@/constant';
import { Acon } from '@/components';
import ModalPage from '../modal';
import { ComponentWrap } from '../style';
import apis from '@/api';

export default function CButton({ self, drag, source, setDataField, children, mode, page }: IAuto & IBaseComponent) {
  const navigate = useNavigate()
  const local = useLocalObservable(() => ({
    template_id: '',
    id: '',
    setValue(k: string, v: string) {
      if (k === 'template_id') {
        local.template_id = v
      } else if (k === 'id') {
        local.id = v;
      }
    }
  }))
  return <Observer>{() => (
    <ComponentWrap
      className={drag.className}
      {...drag.events}
      style={self.style}
    >
      {children}
      <Button type={self.attrs.type || 'primary'} icon={self.icon ? <Acon icon={self.icon} /> : null} onClick={async () => {
        if (self.widget.action === CONST.ACTION_TYPE.SEARCH) {
          setDataField({
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
          local.setValue('template_id', self.widget.method)
        } else if (self.widget.action === CONST.ACTION_TYPE.FETCH) {
          const params = self.getApi({ id: source._id, [self.widget.field]: source[self.widget.field] });
          const data = isEmpty(self.widget.refer) ? source : pick(source, self.widget.refer.map(r => r.value as string));
          const result = await apis.fetch(self.widget.method, params, data,)
          if (result.code === 0) {
            notification.info({ title: '请求成功', placement: 'topRight' })
          } else {
            message.warning(result.message);
          }
        }
      }}>{self.title}</Button>
      {local.template_id && <ModalPage parent={page} template_id={local.template_id} path={''} close={() => {
        // page.close() // 调这个就关闭标签页了
        local.setValue('template_id', '')
      }} />}
    </ComponentWrap>
  )
  }</Observer >
}