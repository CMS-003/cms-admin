import { IAuto, IBaseComponent } from '@/types/component'
import { Component } from '../auto'

export default function CMenu({ self, mode, drag, children }: IAuto & IBaseComponent) {
  return <div style={self.style}
    className={`${mode} ${drag?.classNames}`}
    onMouseEnter={drag?.onMouseEnter || ((e) => { })}
    onMouseLeave={drag?.onMouseLeave || ((e) => { })}
    onContextMenu={drag?.onContextMenu || ((e) => { })}
    onDragOver={drag?.onDragOver || ((e) => { })}
    onDrop={drag?.onDrop || ((e) => { })}
    onDragLeave={drag?.onDragLeave || ((e) => { })}
  >
    {children}
    {self.children.map((item, index) => (
      <Component key={index} index={index} self={item} mode={mode} setParentHovered={drag?.setIsMouseOver} />
    ))}
  </div>
}