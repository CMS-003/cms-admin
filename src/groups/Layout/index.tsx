import React from 'react'
import { IComponent } from '@/types/component'
import styled from 'styled-components'

const Layout = styled.div`
  display: flex;
  flex-direction: row;
`
export default function ComponentLayout({ self, mode, children, level }: { self: IComponent, mode: string, children?: any, level: number }) {
  return <Layout style={{ minHeight: mode === 'edit' ? 35 : 'unset', flexDirection: self.attrs.get("layout") === 'horizon' || !self.attrs.get('layout') ? 'row' : 'column', ...Object.fromEntries(self.style) }} id={self._id}>
    {children}
  </Layout>
}