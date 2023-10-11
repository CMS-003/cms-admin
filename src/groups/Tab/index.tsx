import { Tabs } from "antd";
import { Observer } from "mobx-react";
import { IComponent } from '@/types/component';
import { BarsOutlined } from '@ant-design/icons'
import * as icons from '@ant-design/icons'
import { Component } from '../auto'
import SortList from '@/components/SortList/';
import TabItem from "../TabItem";

export default function TagPage({ self, mode, children }: { self: IComponent, mode: string, children?: any }) {
  const icon: keyof typeof icons = self.icon as any;
  const Image: any = icons[icon];
  return <Observer>
    {() => (
      <Tabs
        defaultActiveKey={self.attrs.selected_id}
        tabBarExtraContent={{ right: Image ? <Image /> : <BarsOutlined /> }}
      >
        {self.children.map(child => (
          <Tabs.TabPane tab={child.title} key={child._id}>
            <TabItem self={child} mode={mode}>
              <SortList
                sort={(oldIndex: number, newIndex: number) => {
                  self.swap(oldIndex, newIndex);
                }}
                droppableId={self._id}
                items={child.children}
                itemStyle={{ display: 'flex', alignItems: 'center' }}
                mode={mode}
                direction={'vertical'}
                renderItem={({ item, handler }: { item: IComponent, handler: HTMLObjectElement }) => <Component mode={mode} handler={handler} self={item} key={item._id} />}
              />
            </TabItem>
          </Tabs.TabPane>
        ))}
      </Tabs>
    )}
  </Observer>
}