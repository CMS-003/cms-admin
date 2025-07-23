import React, { useEffect, useCallback, useRef, useState } from "react";
import { IAuto, IBaseComponent } from '@/types/component'
import { Component } from '../auto'
import { Observer, useLocalObservable } from 'mobx-react';
import { ComponentWrap } from '../style';
import _ from 'lodash'
import RGL, { WidthProvider } from 'react-grid-layout'
import styled from "styled-components";
import apis from "@/api";

const Responsive = WidthProvider(RGL)
const Cell = styled.div`
  background-color: #d9d9d9c7;
`
const LineV = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #cccd;
  z-index: -1;
`
const LineH = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: #cccd;
  z-index: -1;
`
const GridLines = React.forwardRef<HTMLDivElement, {}>((props, ref) => {
  const { cols = 12, rows = 8 } = props as any;
  return (
    <div ref={ref} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
      {/* 垂直线 */}
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <LineV key={`v-${i}`} style={{ left: (100 * i / cols).toFixed(2) + '%', marginLeft: i === cols ? -1 : 0 }} />
      ))}
      {/* 水平线 */}
      {Array.from({ length: rows + 1 }).map((_, i) => (
        <LineH key={`h-${i}`} style={{ top: (100 * i / rows).toFixed(2) + '%', marginTop: i === rows ? -1 : 0 }} />
      ))}
    </div>
  );
})

export default function GridLayout({ self, mode, drag, dnd, children, ...props }: IAuto & IBaseComponent) {
  const local = useLocalObservable(() => ({
    loading: true,
    layouts: [],
    setValue(k: 'loading' | 'items' | 'layouts', v: any) {
      // @ts-ignore
      local[k] = v;
    }
  }))
  const rows = 8;
  const cols = 12;
  const gap = self.attrs.gap || 10;
  const gridRef = useRef<HTMLDivElement | null>(null)
  const [rowHeight, setRowHeight] = useState(30)
  const generateLayout = useCallback(function () {
    return _.map(self.children, function (item, i) {
      return {
        x: _.get(item.attrs, 'x', i * 2),
        y: _.get(item.attrs, 'y', i),
        w: _.get(item.attrs, 'w', 2),
        h: _.get(item.attrs, 'h', 2),
        i: item._id,
      }
    })
  }, [self.children])
  const sync = useCallback(function (layouts: any) {
    const diffs = self.children.map((c, i) => {
      const d = _.cloneDeep(c.toJSON())
      const o = c.$origin;
      if (d._id === layouts[i].i) {
        d.attrs.x = layouts[i].x;
        d.attrs.y = layouts[i].y;
        d.attrs.w = layouts[i].w;
        d.attrs.h = layouts[i].h;
        if (!local.loading) {
          c.setAttr('attrs', d.attrs)
        }
      }
      if (_.isEqual(d.attrs, o.attrs)) {
        return null
      } else {
        c.resetOrigin(d)
      }
      return d;
    }).filter(v => v !== null);
    if (mode === 'preview' && !_.isEmpty(diffs)) {
      apis.batchUpdateComponent({ body: diffs });
    }
  }, [])
  useEffect(() => {
    local.setValue('layouts', generateLayout())
    local.setValue('loading', false)
  })
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
  return <Observer>
    {() => (
      <ComponentWrap key={self.children.length}
        className={mode + drag.className}
        {...drag.events}
        ref={dnd?.ref}
        {...dnd?.props}
        style={{ height: '100%', width: '100%', ...dnd?.style }}
      >
        {children}
        <GridLines ref={gridRef} />
        <Responsive
          autoSize={true}
          style={{ width: '100%', height: '100%', zIndex: 1 }}
          cols={cols}
          // 指定可以拖动的选择器
          draggableHandle=".drag"
          rowHeight={rowHeight}
          // 自由放置
          compactType={null}
          layout={local.layouts}
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
          onDragStop={sync}
          onResizeStop={sync}
        // onLayoutChange={layouts => {

        // }}
        >
          {self.children.map((child) => (
            <Cell key={child._id}>
              <Component
                key={child._id}
                self={child}
                mode={mode}
                dnd={dnd}
                {...props} />
            </Cell>
          ))}
        </Responsive>
      </ComponentWrap>
    )}
  </Observer>
}