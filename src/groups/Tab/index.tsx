import { Tabs } from "antd";
import { Observer } from "mobx-react";
import { IComponent } from '@/types/component';
import { BarsOutlined } from '@ant-design/icons'
import * as icons from '@ant-design/icons'

export default function TagPage({ self, mode, children }: { self: IComponent, mode: string, children?: any }) {
  const icon: keyof typeof icons = self.icon as any;
  const Image: any = icons[icon];
  return <Observer>
    {() => (
      <div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 30 }}>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            {children}
            {/* {self.children.map(child => (<span key={child._id}>{child.title}</span>))} */}
          </div>
          {Image ? <Image /> : null}
        </div>
        <div>
          {/* {children} */}
        </div>
      </div>
      // <Tabs
      //   tabBarExtraContent={{ right: Image ? <Image /> : <BarsOutlined /> }}
      //   //items={self.children.map(child => ({ label: child.title, key: child._id, children: 'test' }))}
      // >
      //   {self.children.map(child => (
      //     <Tabs.TabPane tab={child.title} key={child._id}>

      //     </Tabs.TabPane>
      //   ))}
      // </Tabs>
    )}
  </Observer>
}