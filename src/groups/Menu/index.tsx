import { IAuto, IBaseComponent } from '@/types/component'
import { Component } from '../auto'
import { Observer } from 'mobx-react'

export default function CMenu({ self, mode, drag, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div style={self.style}
      className={`${mode} ${drag?.classNames}`}
      {...drag.events}
    >
      {children}
      {self.children.map((item, index) => (
        <Component key={index} self={item} mode={mode} index={index} setParentHovered={drag?.setIsMouseOver} />
      ))}
    </div>
  )}</Observer>
}