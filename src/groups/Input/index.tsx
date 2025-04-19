import CONST from '@/constant';
import { IAuto, IBaseComponent } from '@/types/component'
import { Input } from 'antd'
import { Observer } from 'mobx-react'
import { usePageContext } from '../context';

export default function CInput({ self, mode, source = {}, drag, dnd, setSource, children }: IAuto & IBaseComponent) {
  const page = usePageContext();
  return <Observer>{() => (
    <div
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        ...self.style,
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <Input value={source[self.widget.field]} style={self.style} onChange={e => {
        if (self.widget.action === CONST.ACTION_TYPE.FILTER) {
          self.widget.field && page.setQuery(self.widget.field, e.target.value)
        } else {
          setSource && setSource(self.widget.field, e.target.value);
        }
      }} />
    </div>
  )}</Observer>
}