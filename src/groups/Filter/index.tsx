import { FullHeight, FullHeightAuto, FullHeightFix } from '@/components/style'
import { IComponent } from '@/types/component'
import _ from 'lodash'
import styled from 'styled-components'
import SortList from '@/components/SortList/';
import { Component } from '../auto'
import { PlusOutlined } from '@ant-design/icons'

export default function ComponentFilter({ self, mode, children, ...props }: { self: IComponent, mode: string, children?: any, props?: any }) {
  return <FullHeight>
    <FullHeightFix>
      {mode === 'edit' ? <>
        <SortList
          listStyle={Object.fromEntries(self.style)}
          sort={(oldIndex: number, newIndex: number) => {
            self.swap(oldIndex, newIndex);
          }}
          droppableId={self._id}
          items={self.children}
          itemStyle={{ display: 'flex', alignItems: 'center', }}
          mode={mode}
          direction={'vertical'}
          renderItem={({ item, handler: h2 }: { item: IComponent, handler: HTMLObjectElement }) => <Component mode={mode} handler={h2} self={item} key={item._id} {...({ level: _.get(props, 'level', 1) + 1 })} />}
        />
        <PlusOutlined />
      </> : <div style={{ width: '100%', padding: 5 }}>
        {self.children.map(child => <Component self={child} mode={mode} key={child._id} />)}
      </div>}

    </FullHeightFix>
    <FullHeightAuto>
      resources
    </FullHeightAuto>
  </FullHeight>
}