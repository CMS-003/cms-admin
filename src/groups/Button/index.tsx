import { IAuto, IBaseComponent } from '@/types/component'
import { Button } from 'antd'
import { Observer } from 'mobx-react'
import { usePageContext } from '../context'
import events from '@/utils/event';
import { pick } from 'lodash';

export default function CButton({ self, mode, drag, dnd, children }: IAuto & IBaseComponent) {
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
        page.setQuery('page', 1)
        events.emit('PageQuery', { target: pick(page, ['template_id', 'path', 'param', 'query']) })
      }}>{self.title}</Button>
    </div>
  )}</Observer>
}