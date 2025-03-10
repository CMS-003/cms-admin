import { IAuto, IBaseComponent } from '@/types/component'
import { Button } from 'antd'
import { Observer } from 'mobx-react'
import { usePageContext } from '../context'
import events from '@/utils/event';
import { pick } from 'lodash';
import { useNavigate } from 'react-router-dom'
import CONST from '@/constant';

export default function CButton({ self, mode, drag, dnd, children }: IAuto & IBaseComponent) {
  const navigate = useNavigate()
  const page = usePageContext()
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
      <Button type={self.attrs.get('type') || 'primary'} onClick={() => {
        if (self.widget.action === CONST.ACTION_TYPE.SEARCH) {
          page.setQuery('page', 1)
          events.emit(CONST.ACTION_TYPE.SEARCH, { target: pick(page, ['template_id', 'path', 'param', 'query']) })
        } else if (self.widget.action === CONST.ACTION_TYPE.GOTO_PAGE) {
          navigate(`${self.widget.action_url}?id=`)
        }
      }}>{self.title}</Button>
    </div>
  )}</Observer>
}