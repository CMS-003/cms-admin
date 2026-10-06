import apis from "@/api";
import { NodeWrapper } from "@/composer/NodeWrapper";
import { IBaseCom } from "@/types";
import { useLocalProxy } from "@/utils/valtio";
import { map, get, cloneDeep, isEqual, isEmpty } from "lodash-es";
import { GripVertical } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import RGL, { WidthProvider } from 'react-grid-layout'
import type { ResponsiveProps } from "react-grid-layout";
import styled from "styled-components";

const Cell = styled.div`
  background-color: #d9d9d9c7;
`
const Responsive = WidthProvider(RGL) as unknown as (
  props: ResponsiveProps
) => JSX.Element;

export default function GridLayout({ self, bindings, mode, children }: IBaseCom) {
  const [localState, localStore] = useLocalProxy({
    loading: true,
    layouts: [] as { x: number; y: number; w: number; h: number; i: string }[],
  });
  const rows = 8;
  const cols = 12;
  const gap = self.attrs.gap || 10;
  const gridRef = useRef<HTMLDivElement | null>(null)
  const [rowHeight, setRowHeight] = useState(30)
  const generateLayout = useCallback(function () {
    return map(self.children, function (item, i) {
      return {
        x: get(item.attrs, 'x', i * 2),
        y: get(item.attrs, 'y', i),
        w: get(item.attrs, 'w', 2),
        h: get(item.attrs, 'h', 2),
        i: item._id,
      }
    })
  }, [self.children])
  const sync = useCallback(function (layouts: any) {
    // TODO: 
    return console.log('update data')
    const diffs = self.children.map((c, i) => {
      const d = cloneDeep(c.toJSON())
      const o = c.$origin;
      if (d._id === layouts[i].i) {
        d.attrs.x = layouts[i].x;
        d.attrs.y = layouts[i].y;
        d.attrs.w = layouts[i].w;
        d.attrs.h = layouts[i].h;
        if (!localStore.loading) {
          c.setAttr('attrs', d.attrs)
        }
      }
      if (c.$new !== true && isEqual(d.attrs, o.attrs)) {
        return null
      } else if (mode === 'preview') {
        c.setAttr('$origin', d)
      }
      return d;
    }).filter(v => v !== null);
    if (mode === 'preview' && !isEmpty(diffs)) {
      apis.batchUpdateComponent({ body: diffs });
    }
  }, [])

  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  useEffect(() => {
    if (localStore.loading) {
      localStore.layouts = generateLayout();
      localStore.loading = false;
    }
  });

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (gridRef.current) {
        setRowHeight((gridRef.current.offsetHeight - ((rows) * gap)) / rows)
      }
    });
    gridRef.current && observer.observe(gridRef.current);
    // 清理逻辑
    return () => {
      observer.disconnect();
    };
  }, [gridRef.current])

  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'column',
    }}>
    <Responsive
      autoSize={true}
      style={{ width: '100%', height: '100%', zIndex: 1 }}
      //@ts-ignore
      cols={cols}
      // 指定可以拖动的选择器
      // draggableHandle=".drag"
      draggableCancel="[data-no-dnd]"
      rowHeight={rowHeight}
      // 自由放置
      compactType={null}
      layout={localState.layouts}
      isResizable={true}
      resizeHandles={['se']}
      // 允许重叠
      // allowOverlap={true}
      // 防止碰撞
      preventCollision={true}
      // 限制在边界内
      isBounded={true}
      containerPadding={[gap / 2, gap / 2]}
      margin={[gap, gap]}
      // onLayoutChange={layouts => {

      // }}
      onDragStop={sync}
      onResizeStop={sync}
    >
      {self.children.map(child => (
        <Cell key={child._id} data-no-dnd>
          <NodeWrapper self={child} />
        </Cell>
      ))}
    </Responsive>
  </div>
}