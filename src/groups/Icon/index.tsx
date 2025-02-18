import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import styled from 'styled-components'

const Icon = styled.img`

`
export default function CIcon({ self, mode, drag, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div
      className={`${mode} ${drag?.classNames}`}
      {...drag.events}
    >
      {children}
      <Icon src={self.cover} style={{ width: 24, height: 24, ...(self.style) }} />
    </div>
  )}</Observer>
}