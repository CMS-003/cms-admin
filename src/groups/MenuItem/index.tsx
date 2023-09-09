import React from 'react'
import { IComponent } from '@/types/component'
import styled from 'styled-components'
import * as icons from '@ant-design/icons'

const MenuItem = styled.div`
  color: #333;
  cursor: pointer;
  padding: 5px 10px;
  &:hover {
    background-color: rgba(0,0,0,0.5);
    color: #000;
  }
`
export default function ComponentMenuItem({ self, mode, children }: { self: IComponent, mode: string, children?: any }) {
  const icon: keyof typeof icons = self.icon as any;
  const Image: any = icons[icon];
  return <div>
    <MenuItem>{Image ? <Image /> : null} {self.title}</MenuItem>
    <div style={{ textIndent: 20 }}>
      {children}
    </div>
  </div>
}