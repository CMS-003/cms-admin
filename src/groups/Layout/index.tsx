import { IAuto, IBaseComponent} from '@/types/component'
import styled from 'styled-components'
import { Component } from '../auto'

const Layout = styled.div`
  display: flex;
  flex-direction: row;
`
export default function ComponentLayout({ self, mode, page, drag, source, setSource, children }: IAuto & IBaseComponent) {
  return <Layout
    style={{ minHeight: mode === 'edit' ? 32 : 'unset', flexDirection: self.attrs.get("layout") === 'horizon' || !self.attrs.get('layout') ? 'row' : 'column', ...self.style }} id={self._id}
    className={`${mode} ${drag?.classNames}`}
    {...drag.events}
  >
    {children}
    {self.children.map((child, index) => <Component mode={mode} page={page} self={child} key={index} source={source} setSource={setSource} setParentHovered={drag?.setIsMouseOver} />)}
  </Layout>
}