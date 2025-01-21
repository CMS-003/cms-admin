import React from 'react'
import { IComponent } from '@/types/component'
import styled from 'styled-components'
import Acon, { Icon } from '@/components/Acon'

const MenuItem = styled.div`
  color: #333;
  cursor: pointer;
  padding: 5px 10px;
  &:hover {
    background-color: #71ace3;
    color: #000;
  }
`
export default function ComponentMenuItem({ self, mode, children, level }: { self: IComponent, mode: string, children?: any, level: number }) {
  return <div>
    <MenuItem><Acon icon={self.icon as Icon} /> {self.title}</MenuItem>
    <div style={{ marginLeft: 3 * level }}>
      {children}
    </div>
  </div>
}