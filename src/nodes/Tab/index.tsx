import { IBaseCom } from "@/types";
import { Grip } from "lucide-react";
import { Tabs } from "antd";
import styled from "styled-components";
import Acon from '@/components/Acon'
import { TemplateView } from '@/composer/TemplateView'
import { NodeWrapper } from "@/composer/NodeWrapper";
import { useActions, useMode, usePage } from "@/context";

const TabWrap = styled.div`
  height: 100%;
  flex: 1;
  overflow: hidden;
  & > div {
    height: 100%;
  }
  & > .ant-tabs-top > .ant-tabs-nav {
    margin: 0;
  }
`
const TabItemWrap = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  & > span.anticon {
    margin: 0;
    visibility: hidden;
  }
  &:hover > span {
    visibility: visible
  }
`

export default function CTab({ self, bindings, childrenNodes }: IBaseCom) {
  const actions = useActions();
  const mode = useMode();
  const page = usePage();
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <Grip className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    </div>
    <TabWrap>
      <Tabs
        activeKey={self.$selected_id || self.attrs.selected_id}
        tabBarExtraContent={{ right: <Acon icon={(self.icon) || 'Menu'} /> }}
        onChange={activeKey => {
          actions.setNodeField(self, '$selected_id', activeKey)
        }}
        items={childrenNodes.map((child, i) => ({
          label: <TabItemWrap>
            {/* {child.title} */}
            {mode === 'edit' ? <NodeWrapper key={child._id} self={child} special={true} onContextMenu={bindings.onContextMenu} /> : child.title}
          </TabItemWrap>,
          key: child._id,
          children: (
            child.attrs.content_type === 'template'
              ? <TemplateView key={child._id} mode={'preview'} template_id={child.attrs.template_id} path={page.path} close={page.close} />
              : <NodeWrapper key={child._id} self={child} onContextMenu={bindings.onContextMenu} />
          )
        }))}
      />
    </TabWrap>
  </div>
}
