import React from 'react'
import { IComponent } from '@/types/component'
import styled from 'styled-components'

const MenuItem = styled.div`
  color: #333;
  cursor: pointer;
  padding: 5px 10px;
  &:hover {
    color: #000;
  }
`
export default function ComponentMenuItem({ self, mode, children }: { self: IComponent, mode: string, children?: any }) {
  return <div>
    <MenuItem>{self.title}</MenuItem>
    <div style={{ textIndent: 20 }}>
      {children}
    </div>
  </div>
}