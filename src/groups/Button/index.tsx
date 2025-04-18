import { IAuto, IBaseComponent } from '@/types/component'
import { Button } from 'antd'
import { Observer, useLocalObservable } from 'mobx-react'
import { usePageContext } from '../context'
import events from '@/utils/event';
import { pick } from 'lodash';
import { useNavigate } from 'react-router-dom'
import CONST from '@/constant';
import { Acon } from '@/components';
import ModalPage from '../modal';

export default function CButton({ self, mode, drag, dnd, children }: IAuto & IBaseComponent) {
  const navigate = useNavigate()
  const page = usePageContext()
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
    <div
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        flex: 0,
        ...self.style,
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <Button type={self.attrs.type || 'primary'} icon={self.icon ? <Acon icon={self.icon as any} /> : null} onClick={() => {
        if (self.widget.action === CONST.ACTION_TYPE.SEARCH) {
          page.setQuery('page', 1)
          events.emit(CONST.ACTION_TYPE.SEARCH, { target: pick(page, ['template_id', 'path', 'param', 'query']) })
        } else if (self.widget.action === CONST.ACTION_TYPE.GOTO_PAGE) {
          navigate(`${self.widget.action_url}?id=`)
        } else if (self.widget.action === CONST.ACTION_TYPE.MODAL) {
          local.setValue('template_id', self.widget.action_url)
        }
      }}>{self.title}</Button>
      {local.template_id && <ModalPage parent={page} template_id={local.template_id} path={''} close={() => {
        // page.close() // 调这个就关闭标签页了
        local.setValue('template_id', '')
      }} />}
    </div>
  )}</Observer>
}