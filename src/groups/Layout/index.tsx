import { IAuto, IBaseComponent } from '@/types/component'
import styled from 'styled-components'
import { Component } from '../auto'
import { Observer } from 'mobx-react'
import NatureSortable from '@/components/NatureSortable'
import { usePageContext } from '../context'

const Layout = styled.div`
  display: flex;
  flex-direction: row;
  ${(props) => (props as any)['data-isdragging'] ? "background-color: lightblue !important;" : ""}
`
export default function ComponentLayout({ self, mode, dnd, drag, children, ...props }: IAuto & IBaseComponent) {
  const page = usePageContext()
  return <Observer>{() => (
    <Layout
      id={self._id}
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      data-isdragging={dnd?.isDragging}
      style={{
        minHeight: self.children.length === 0 ? 25 : 'auto',
        flexDirection: self.attrs.get("layout") === 'horizontal' ? 'row' : 'column',
        ...self.style,
        ...dnd?.style,
      }}
    >
      {children}
      <NatureSortable
        droppableId={self._id}
        direction={self.attrs.get("layout") === 'horizontal' ? 'horizontal' : 'vertical'}
        style={self.style}
        items={self.children}
        sort={self.swap}
        renderItem={({ item, dnd }) => (
          <Component
            mode={mode}
            self={item}
            dnd={dnd}
            page={page}
            {...props}
          />
        )}
      />
      {/* {self.children.map((child, index) => (
        <Component
          mode={mode}
          self={child}
          key={index}
          {...props}
        />
      ))} */}
    </Layout>
  )}</Observer>
}