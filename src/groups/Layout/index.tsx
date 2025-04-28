import { IAuto, IBaseComponent } from '@/types/component'
import styled from 'styled-components'
import { Component } from '../auto'
import { Observer } from 'mobx-react'
import NatureSortable from '@/components/NatureSortable'
import { usePageContext } from '../context'
import { ComponentWrap } from '../style';

export default function ComponentLayout({ self, mode, dnd, drag, children, ...props }: IAuto & IBaseComponent) {
  const page = usePageContext()
  return <Observer>{() => (
    <ComponentWrap
      id={self._id}
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        minHeight: self.children.length === 0 ? 32 : 'auto',
        flex: self.attrs.flex ? 1 : 0,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
        ...dnd?.style,
      }}
    >
      {children}
      <NatureSortable
        droppableId={self._id}
        direction={self.attrs.layout === 'horizontal' ? 'horizontal' : 'vertical'}
        disabled={mode === 'preview'}
        style={{
          flex: 1,
          flexDirection: self.attrs.layout === 'horizontal' ? 'row' : 'column',
          ...self.style,
        }}
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
    </ComponentWrap>
  )}</Observer>
}