import React from 'react'
import { IComponent } from '@/types/component'
import styled from 'styled-components'

const Layout = styled.div`
  display: flex;
  flex-direction: row;
  min-height: 30px;
`
export default function ComponentLayout({ self, mode, children, level }: { self: IComponent, mode: string, children?: any, level: number }) {
  return <Layout style={{ flexDirection: self.attrs.get("layout") === 'horizon' ? 'row' : 'column', ...Object.fromEntries(self.style) }} id={self._id}>
    {children}
  </Layout>
}