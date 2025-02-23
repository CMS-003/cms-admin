import { IAuto, IBaseComponent } from '@/types/component'
import hbs from 'handlebars'
import { Observer, useLocalStore } from 'mobx-react'
import { useNavigate } from 'react-router-dom'

export default function CTpl({ self, mode, source, setSource, drag, children }: IAuto & IBaseComponent) {
  const local = useLocalStore(() => ({
    tpl: hbs.compile(self.widget.value)
  }))
  const navigate = useNavigate();
  return <Observer>{() => (
    <div style={{ lineHeight: 2.5 }}
      className={`${mode} ${drag?.classNames}`}
      onClick={() => {
        if (self.widget.action === 'goto_detail') {
          navigate(`${self.widget.action_url}?id=${source._id}`)
        }
      }}
      {...drag.events}
    >
      {children}
      {mode === 'edit' ? self.title : <div dangerouslySetInnerHTML={{ __html: local.tpl(source) }}></div>}
    </div>
  )
  }</Observer >
}