import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import styled from 'styled-components'

const Icon = styled.img`

`
export default function CIcon({ self, mode, drag, dnd, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.draggableProps}
      {...dnd?.dragHandleProps}
      style={{
        ...self.style,
        ...dnd?.style,
      }}
    >
      {children}
      <Icon src={self.cover} style={{ width: 24, height: 24, ...(self.style) }} />
    </div>
  )}</Observer>
}