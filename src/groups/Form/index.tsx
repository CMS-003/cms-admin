import { AlignAround, FullHeight, FullHeightAuto } from '@/components/style'
import { IPageInfo } from '@/types'
import { IComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { Button } from 'antd'
import { SortList } from '@/components'
import { Component } from '../auto'


export default function CForm({ self, mode, page, setParentHovered, source, setSource, }: { self: IComponent, mode: string, source: any, setSource?: Function, setParentHovered?: Function, page?: IPageInfo, }) {
  return <Observer>{() => (
    <FullHeight style={{ height: '100%' }}>
      <FullHeightAuto>
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
          renderItem={({ item, handler: h2, index }: { item: IComponent, handler: HTMLObjectElement, index: number }) => <Component mode={mode} page={page} handler={h2} setSource={setSource} self={item} key={index} source={source} setParentHovered={setParentHovered} />}
        />
      </FullHeightAuto>
      <AlignAround style={{ padding: 8 }}>
        <Button type='primary'>保存</Button>
      </AlignAround>
    </FullHeight>
  )}</Observer>
}