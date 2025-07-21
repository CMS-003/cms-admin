import { IAuto, IBaseComponent } from '@/types/component'
import { Component } from '../auto'
import { Observer } from 'mobx-react'
import { ComponentWrap } from '../style';

export default function GridCell({ self, mode, dnd, drag, children, ...props }: IAuto & IBaseComponent) {

  return <Observer>
    {() => (
      <ComponentWrap key={self.children.length}
        className={mode + drag.className}
        {...drag.events}
        ref={dnd?.ref}
        {...dnd?.props}
        style={{ height: '100%', ...dnd?.style }}
      >
        {children}
        {self.children.map(child => (
          <Component key={child._id} self={child} mode={mode} {...props} />
        ))}
      </ComponentWrap>
    )}
  </Observer>
}