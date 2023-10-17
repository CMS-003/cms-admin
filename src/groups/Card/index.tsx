import { IComponent } from '@/types/component'
import { Observer } from 'mobx-react'

export default function ComponentFilterTag({ self, mode, children }: { self: IComponent, mode: string, children?: any }) {
  return <Observer>{() => (
    <div>
      <div>
        {self.title}
      </div>
    </div>
  )}</Observer>
}