import CONST from '@/constant'
import { IAuto, IBaseComponent } from '@/types/component'
import * as T from 'squirrelly'
import { Observer, useLocalObservable } from 'mobx-react'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'

T.filters.define('date', function (str) {
  return new Date(str);
});
T.filters.define('format', function (o, format) {
  if (o instanceof Date) {
    return moment(o).format(format);
  }
  return o;
})

export default function CTpl({ self, mode, source, setSource, drag, dnd, children }: IAuto & IBaseComponent) {
  const local = useLocalObservable(() => ({
    tpl: T.compile(self.widget.value as string, { useWith: true })
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
      {mode === 'edit' ? self.title : <div style={{ whiteSpace: 'normal' }} dangerouslySetInnerHTML={{ __html: local.tpl(source || {}, T.getConfig({ useWith: true })) }}></div>}
    </div>
  )
  }</Observer >
}