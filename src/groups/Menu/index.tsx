import { IAuto, IBaseComponent } from '@/types/component'
import { Component } from '../auto'

export default function CMenu({ self, mode, drag, children }: IAuto & IBaseComponent) {
  return <div style={self.style}
    className={`${mode} ${drag?.classNames}`}
    {...drag.events}
  >
    {children}
    {self.children.map((item, index) => (
      <Component key={index} self={item} mode={mode} index={index} setParentHovered={drag?.setIsMouseOver} />
    ))}
  </div>
}