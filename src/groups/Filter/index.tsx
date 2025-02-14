import { FullHeight, FullHeightAuto, FullHeightFix } from '@/components/style'
import { IComponent } from '@/types/component'
import _ from 'lodash'
import SortList from '@/components/SortList/';
import { Component } from '../auto'
import Acon from '@/components/Acon';
import { Observer } from 'mobx-react';
import NatureSortable from '@/components/NatureSortable';

export default function ComponentFilter({ self, mode, children, setParentHovered, ...props }: { self: IComponent, mode: string, children?: any, setParentHovered?: Function, props?: any }) {
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
              renderItem={({ item, handler: h2 }: { item: IComponent, handler: HTMLObjectElement }) => <Component mode={mode} handler={h2} self={item} key={item._id} setParentHovered={setParentHovered} {...({ level: _.get(props, 'level', 1) + 1 })} />}
            />
            {/* <NatureSortable
              droppableId={self._id}
              items={self.children}
              onDragEnd={(result) => {
                if (!result.destination) return;
                self.swap(result.source.index, result.destination.index)
              }}
              renderItem={({ item, isDragging, provided, index }) => {
                return <div
                  key={index}
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  style={{
                    background: isDragging ? "lightblue" : "",
                    // 合并由react-beautiful-dnd提供的样式，避免覆盖拖拽动画样式
                    ...provided.draggableProps.style,
                  }}
                >
                  <Component mode={mode} self={item} key={item._id} setParentHovered={setParentHovered} {...({ level: _.get(props, 'level', 1) + 1 })} />
                </div>
              }} /> */}
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