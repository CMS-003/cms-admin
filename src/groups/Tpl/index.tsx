import { IAuto, IBaseComponent } from '@/types/component'
import hbs from 'handlebars'
import { Observer, useLocalStore } from 'mobx-react'
import { useNavigate } from 'react-router-dom'

export default function CTpl({ self, mode, source, setSource, drag, dnd, children }: IAuto & IBaseComponent) {
  const local = useLocalStore(() => ({
    tpl: hbs.compile(self.widget.value)
  }))
  const navigate = useNavigate();
  return <Observer>{() => (
    <div
      className={mode + drag.className}
      onClick={() => {
        if (self.widget.action === 'goto_detail') {
          navigate(`${self.widget.action_url}?id=${source._id}`)
        }
      }}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        whiteSpace: 'nowrap',
        ...self.style,
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      {mode === 'edit' ? self.title : <div dangerouslySetInnerHTML={{ __html: local.tpl(source) }}></div>}
    </div>
  )
  }</Observer >
}