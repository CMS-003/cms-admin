import Content from '@/components/FormEditor/content'
import { IComponent, IEditorComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { Fragment } from 'react'


export default function CForm({ self, mode, children, level }: { self: IComponent, mode: string, children?: any, level: number }) {
  return <Observer>{() => (
    <div style={{ height: '100%' }}>
      {children}
    </div>
  )}</Observer>
}