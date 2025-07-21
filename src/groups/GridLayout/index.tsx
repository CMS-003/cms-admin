import { useEffect, useCallback } from "react";
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

export default function GridLayout({ self, mode, drag, dnd, children, ...props }: IAuto & IBaseComponent) {
  const local = useLocalObservable(() => ({
    loading: true,
    layouts: [],
    setValue(k: 'loading' | 'items' | 'layouts', v: any) {
      // @ts-ignore
      local[k] = v;
    }
  }))
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
      if (d._id === layouts[i].i) {
        d.attrs.x = layouts[i].x;
        d.attrs.y = layouts[i].y;
        d.attrs.w = layouts[i].w;
        d.attrs.h = layouts[i].h;
        if (!local.loading) {
          c.setAttr('attrs', d.attrs)
        }
      }
      return d;
    });
    mode === 'preview' && apis.batchUpdateComponent({ body: diffs });
  }, [])
  useEffect(() => {
    local.setValue('layouts', generateLayout())
    local.setValue('loading', false)
  })
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
        <Responsive
          autoSize={true}
          style={{ width: '100%', height: '100%' }}
          cols={12}
          rowHeight={100}
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
          containerPadding={[10, 10]}
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