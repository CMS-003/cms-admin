import { IPageInfo } from '@/types'
import { IComponent } from '@/types/component'
import { Observer } from 'mobx-react'


export default function CForm({ self, mode, children, level, page }: { self: IComponent, mode: string, children?: any, level: number, page?: IPageInfo }) {
  return <Observer>{() => (
    <div style={{ height: '100%' }}>
      {children}
    </div>
  )}</Observer>
}