import { IAuto, IBaseComponent } from '@/types/component'
import styled from 'styled-components'
import { Component } from '../auto'
import { Observer } from 'mobx-react'

const Layout = styled.div`
  display: flex;
  flex-direction: row;
`
export default function ComponentLayout({ self, mode, page, dnd, drag, source, setSource, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <Layout
      style={{  flexDirection: self.attrs.get("layout") === 'horizon' || !self.attrs.get('layout') ? 'row' : 'column', ...self.style }} id={self._id}
      className={`${mode} ${drag?.classNames}`}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.draggableProps}
      {...dnd?.dragHandleProps}
    >
      {children}
      {self.children.map((child, index) => <Component mode={mode} index={index} page={page} self={child} key={index} source={source} setSource={setSource} setParentHovered={drag?.setIsMouseOver} />)}
    </Layout>
  )}</Observer>
}