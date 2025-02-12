import store from '@/store'
import { IComponent } from '@/types/component'
import hbs from 'handlebars'
import { Observer, useLocalStore } from 'mobx-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Text({ self, mode, source }: { self: IComponent, mode: string, children?: any, level: number, source: any }) {
  const local = useLocalStore(() => ({
    tpl: hbs.compile(self.widget?.value)
  }))
  const navigate = useNavigate();
  return <Observer>{() => (
    <div onClick={() => {
      if (self.widget?.action === 'goto_detail') {
        navigate(`${self.widget.action_url}?id=${source._id}`)
      }
    }}>
      {mode === 'edit' ? self.title : <div dangerouslySetInnerHTML={{ __html: local.tpl(source) }}></div>}
    </div>
  )
  }</Observer >
}