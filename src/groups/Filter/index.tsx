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
        {...drag.events}
      >
        {children}
        <FullHeightFix style={{ flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {self.children.map((child, index) => <Component mode={mode} page={page} self={child} key={index} source={source} setSource={setSource} setParentHovered={drag?.setIsMouseOver} />)}
        </FullHeightFix>
        <FullHeightAuto>
          resources
        </FullHeightAuto>
      </FullHeight>
    )}
  </Observer>
}