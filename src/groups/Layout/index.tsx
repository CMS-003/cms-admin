import { IAuto, IBaseComponent } from '@/types/component'
import { Component } from '../auto'
import { Observer } from 'mobx-react'
import { usePageContext } from '../context'
import { ComponentWrap } from '../style';
import store from '@/store'
import { SortDD } from '@/components/SortableDD'

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
      <SortDD
        mode={mode as 'edit' | 'preview'}
        disabled={mode === 'preview' || store.component.can_drag_id !== self._id}
        direction={self.attrs.layout === 'horizontal' ? 'horizontal' : 'vertical'}
        items={self.children.map(child => ({ id: child._id, data: child }))}
        sort={self.swap}
        renderItem={(item: any) => (
          <Component
            mode={mode}
            self={item.data}
            page={page}
            {...props}
          />
        )}
      />
    </ComponentWrap>
  )}</Observer>
}