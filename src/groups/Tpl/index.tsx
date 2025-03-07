import CONST from '@/constant'
import { IAuto, IBaseComponent } from '@/types/component'
import hbs from 'handlebars'
import { Observer, useLocalObservable } from 'mobx-react'
import { useNavigate } from 'react-router-dom'

export default function CTpl({ self, mode, source, setSource, drag, dnd, children }: IAuto & IBaseComponent) {
  const local = useLocalObservable(() => ({
    tpl: hbs.compile(self.widget.value)
  }))
  const navigate = useNavigate();
  return <Observer>{() => (
    <div
      className={mode + drag.className}
      onClick={() => {
        if (self.widget.action === CONST.ACTION_TYPE.GOTO_PAGE) {
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
      {mode === 'edit' ? self.title : <div style={{ whiteSpace: 'normal' }} dangerouslySetInnerHTML={{ __html: local.tpl(source) }}></div>}
    </div>
  )
  }</Observer >
}