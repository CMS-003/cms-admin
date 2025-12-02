import { IAuto, IBaseComponent } from '@/types/component'
import { Component } from '../auto'
import { Observer } from 'mobx-react'
import { ComponentWrap } from '../style';

export default function GridCell({ self, mode, drag, children, ...props }: IAuto & IBaseComponent) {

  return <Observer>
    {() => (
      <ComponentWrap key={self.children.length}
        className={mode + drag.className}
        {...drag.events}
        style={{ height: '100%', }}
      >
        {children}
        {self.children.map(child => (
          <Component key={child._id} self={child} mode={mode} {...props} />
        ))}
      </ComponentWrap>
    )}
  </Observer>
}