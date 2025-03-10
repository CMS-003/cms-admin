import { IAuto, IBaseComponent } from '@/types/component'
import styled from 'styled-components'
import { Component } from '../auto'
import { Observer } from 'mobx-react'
import NatureSortable from '@/components/NatureSortable'

const Layout = styled.div`
  display: flex;
  flex-direction: row;
`
export default function ComponentLayout({ self, mode, dnd, drag, children, ...props }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <Layout
      id={self._id}
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        minHeight: self.children.length === 0 ? 25 : 'auto',
        flexDirection: self.attrs.get("layout") === 'horizontal' ? 'row' : 'column',
        ...self.style,
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      {self.children.map((child, index) => (
        <Component
          mode={mode}
          self={child}
          key={index}
          {...props}
        />
      ))}
    </Layout>
  )}</Observer>
}