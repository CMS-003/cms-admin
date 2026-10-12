import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import Acon from '@/components/Acon'
import styled from 'styled-components'
import { Tabs } from "antd";
import { cloneDeep } from "lodash-es";
import { TemplateView } from "@/composer/TemplateView";
import { NodeWrapper } from "@/composer/NodeWrapper";
import { useActions, useMode, usePage } from "@/context";

const TabWrap = styled.div`
  height: 100%;
  flex: 1;
  & > div {
    height: 100%;
  }
  & > .ant-tabs-top > .ant-tabs-nav {
    margin: 0;
  }
`
const TabItemWrap = styled.div`
  display: flex;
  width: 100%;
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

export default function CTabbar({ self, bindings, childrenNodes }: IBaseCom) {
  const actions = useActions();
  const mode = useMode();
  const page = usePage();
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');

  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row', height: '100%'
    }}>
    {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    <TabItemWrap>
      <Tabs
        style={{ height: '100%', width: '100%' }}
        activeKey={self.attrs.selected_id}
        tabBarStyle={{ width: '100%' }}
        tabPlacement='bottom'
        centered={true}
        onChange={activeKey => {
          const attrs = cloneDeep(self.attrs);
          attrs.selected_id = activeKey
          actions.setNodeField(self, 'attrs', attrs)
        }}
        items={childrenNodes.map((child, i) => ({
          label: <TabItemWrap>
            {mode === 'edit' ? <NodeWrapper key={child._id} self={child} special={true} onContextMenu={bindings.onContextMenu} /> : <>
              {child.icon ? <Acon icon={child.icon} /> : null}
              {child.title}
            </>}
          </TabItemWrap>,
          key: child._id,
          children: (
            child.attrs.content_type === 'template'
              ? <TemplateView mode='preview' template_id={child.attrs.template_id} path={page.path} close={page.close} />
              : <NodeWrapper self={child} onContextMenu={bindings.onContextMenu} />
          )
        }))}
      />
    </TabItemWrap>
  </div>
}
