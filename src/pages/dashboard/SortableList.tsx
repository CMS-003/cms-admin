import { set } from 'lodash';
import { Observer } from 'mobx-react';
import React, { useState, useRef, useEffect, ReactEventHandler, CSSProperties } from 'react';

export type Direction = 'horizontal' | 'vertical';
export type DataItem = {
  _id: string;
  parent_id: string;
  title: string;
  children: DataItem[];
  swap: Function;
}

interface SortableListProps {
  self: DataItem;
  direction: Direction; // 拖拽方向
  renderItem: (args:
    {
      self: DataItem,
      handle: {
        onDragStart: (e: React.DragEvent<HTMLElement>) => void,
        onDragEnter: (e: React.DragEvent<HTMLElement>) => void,
        onDragOver: (e: React.DragEvent<HTMLElement>) => void,
        onDragEnd: (e: React.DragEvent<HTMLElement>) => void,
        style: CSSProperties,
      }
    }) => JSX.Element; // 渲染每一项的方法
}

const SortableList: React.FC<SortableListProps> = ({ self, direction, renderItem }) => {
  const [draggingIndex, setDraggingIndex] = useState<number>(-1);
  const [targetIndex, setTargetIndex] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null);

  /**
   * draggingIndex index targetIndex 三者的关系
   */
  const getTranslateStyle = (index: number) => {
    const isDragging = draggingIndex !== -1;
    // 自己就是拖动的元素
    if (draggingIndex === index) return { opacity: 0.1, transform: 'none' };
    const animate = isDragging ? 'transform 0.3s ease-out' : 'none';
    // 没拖动或拖动的目标位置还未变化,剩余元素都不需要移动
    if (draggingIndex === targetIndex) return { transition: animate, transform: `translate${direction === 'horizontal' ? 'X' : 'Y'}(0px)` };

    const offset = 100;
    let d = 0;
    if (draggingIndex < index && index <= targetIndex) {
      // 前移
      d = -1
      return {
        transition: animate,
        transform: `translate${direction === 'horizontal' ? 'X' : 'Y'}(${d * offset}%)`
      }
    } else if (draggingIndex > index && index >= targetIndex) {
      // 后移
      d = 1;
      return {
        transition: animate,
        transform: `translate${direction === 'horizontal' ? 'X' : 'Y'}(${d * offset}%)`
      }
    } else {
      // 有拖动区间了,区间外都不变
      return { transition: animate, transform: `translate${direction === 'horizontal' ? 'X' : 'Y'}(0px)` };
    }
  };

  const onDragStart = (e: React.DragEvent<HTMLElement>, index: number) => {
    // 创建一个空的透明元素作为拖拽影像.直接调用preventDefault后续拖拽事件都触发不了
    // e.preventDefault();
    // e.dataTransfer.setData("text/plain", index.toString());
    // const img = new Image();
    // img.src = "data:image/svg+xml;base64,"; // 透明图片
    // img.style.opacity = '0';
    // e.dataTransfer.setDragImage(img, 0, 0);

    const clonedElement = e.currentTarget.cloneNode(true) as HTMLElement;
    setDraggedElement(clonedElement);
    clonedElement.style.position = 'fixed';
    // 设置透明度变化
    clonedElement.style.opacity = '0.3';
    clonedElement.style.userSelect = 'none';
    document.body.appendChild(clonedElement)
    setDraggingIndex(index);
    setTargetIndex(index);
  };

  const onDragEnter = (e: React.DragEvent<HTMLElement>, index: number) => {
    e.preventDefault();
    // 不加有问题,回到原位不触发
    if (index === draggingIndex && draggedElement) {
      setTargetIndex(index);
    }
  }
  /**
   * 拖拽过程中，实时更新拖拽元素的位置
   * dragggingIndex < index 时,鼠标>1/2 才更新 targetIndex
   * dragggingIndex > index 时,鼠标<1/2 才更新 targetIndex
   * 如果dragElement 被挡住了就不会触发dragOver事件
   */
  const onDragOver = (e: React.DragEvent<HTMLElement>, index: number) => {
    e.preventDefault();
    if (draggedElement) {
      const rect = e.currentTarget.getBoundingClientRect();
      if (draggingIndex < index) {
        const mousePos = direction === 'horizontal' ? e.clientX : e.clientY;
        const center = direction === 'horizontal' ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
        setTargetIndex(index + (mousePos > center ? 0 : -1));
      }
      if (draggingIndex > index) {
        const mousePos = direction === 'horizontal' ? e.clientX : e.clientY;
        const center = direction === 'horizontal' ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
        setTargetIndex(index + (mousePos < center ? 0 : 1));
      }
    }
  };

  const onDragEnd = (e: React.DragEvent<HTMLElement>) => {
    if (draggedElement === null) return;
    const element = draggedElement;
    console.log('end')
    // 放置时，执行平滑动画
    element.style.transition = 'none';// 'transform 0.3s ease-out, opacity 0.2s ease-out';
    element.style.transform = 'none';//'translateX(100%)';
    element.style.opacity = '1';

    // 更新列表顺序
    self.swap(draggingIndex, targetIndex)
    setDraggingIndex(-1);
    setTargetIndex(-1);
    setDraggedElement(null);
    document.body.removeChild(element);
  };

  return (
    <Observer>{() => (
      <div id={self._id} ref={listRef} style={{ position: 'relative', display: 'flex', flexDirection: direction === 'horizontal' ? 'row' : 'column' }}>
        {self.children.map((child, index) => (
          renderItem({
            self: child,
            handle: {
              onDragStart: (e) => onDragStart(e, index),
              onDragOver: (e) => onDragOver(e, index),
              onDragEnter: (e) => onDragEnter(e, index),
              onDragEnd,
              style: getTranslateStyle(index)
            }
          })
        ))}
      </div>
    )}</Observer>
  );
};

export default SortableList;