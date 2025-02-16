import { FullHeight, FullHeightAuto, FullHeightFix } from '@/components/style'
import { IAuto, IComponent } from '@/types/component'
import _ from 'lodash'
import SortList from '@/components/SortList/';
import { Component } from '../auto'
import Acon from '@/components/Acon';
import { Observer } from 'mobx-react';

export default function CFilter({ self, mode, setParentHovered }: IAuto) {
  return <Observer>
    {() => (
      <FullHeight key={self.children.length}>
        <FullHeightFix style={{ flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {mode === 'edit' ? <>
            <SortList
              listStyle={self.style || {}}
              sort={(oldIndex: number, newIndex: number) => {
                self.swap(oldIndex, newIndex);
              }}
              droppableId={self._id}
              items={self.children}
              itemStyle={{ display: 'flex', alignItems: 'center', }}
              mode={mode}
              direction={'vertical'}
              renderItem={({ item, handler: h2 }: { item: IComponent, handler: HTMLObjectElement }) => <Component mode={mode} handler={h2} self={item} key={item._id} setParentHovered={setParentHovered} />}
            />
            <div style={{ width: '100%' }}>
              <Acon icon='PlusCircleOutlined' size={18} onClick={() => {
                self.appendChild('FilterRow')
              }} />
            </div>
          </> : <div style={{ width: '100%', padding: 5 }}>
            {self.children.map(child => <Component self={child} mode={mode} key={child._id} />)}
          </div>}
        </FullHeightFix>
        <FullHeightAuto>
          resources
        </FullHeightAuto>
      </FullHeight>
    )}
  </Observer>
}