import React from 'react'
import { IComponent } from '@/types/component'
import styled from 'styled-components'
import Acon, { Icon } from '@/components/Acon'

const MenuItem = styled.div`
  color: #333;
  cursor: pointer;
  padding: 10px;
  &:hover {
    background-color: ${props => props.className === 'edit' ? 'transparent' : '#71ace3'};
  }
`
export default function ComponentMenuItem({ self, mode, children, level }: { self: IComponent, mode: string, children?: any, level: number }) {
  return <div>
    <MenuItem className={mode}><Acon icon={self.icon as Icon} />{self.title}{mode === 'edit' && <Acon icon='add' style={{ marginLeft: 15 }} onClick={() => {
      self.appendChild('MenuItem')
    }} />}</MenuItem>
    <div style={{ paddingLeft: 10 * level }}>
      {children}
    </div>
  </div>
}