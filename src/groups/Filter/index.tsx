import { FullHeight, FullHeightAuto, FullHeightFix } from '@/components/style'
import { IAuto, IBaseComponent } from '@/types/component'
import _ from 'lodash'
import SortList from '@/components/SortList/';
import { Component } from '../auto'
import Acon from '@/components/Acon';
import { Observer } from 'mobx-react';

export default function CFilter({ self, mode, drag, page, source, setSource, children }: IAuto & IBaseComponent) {
  return <Observer>
    {() => (
      <FullHeight key={self.children.length}
        className={`${mode} ${drag?.classNames}`}
        onMouseEnter={drag?.onMouseEnter || ((e) => { })}
        onMouseLeave={drag?.onMouseLeave || ((e) => { })}
        onContextMenu={drag?.onContextMenu || ((e) => { })}
        onDragOver={drag?.onDragOver || ((e) => { })}
        onDrop={drag?.onDrop || ((e) => { })}
        onDragLeave={drag?.onDragLeave || ((e) => { })}
      >
        {children}
        <FullHeightFix style={{ flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {self.children.map((child, index) => <Component index={index} mode={mode} page={page} self={child} key={index} source={source} setSource={setSource} setParentHovered={drag?.setIsMouseOver} />)}
        </FullHeightFix>
        <FullHeightAuto>
          resources
        </FullHeightAuto>
      </FullHeight>
    )}
  </Observer>
}