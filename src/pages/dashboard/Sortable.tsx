import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface Item {
  id: string;
  text: string;
}

type Direction = 'vertical' | 'horizontal';

interface SortableListProps {
  items: Item[];
  direction: Direction;
  renderItem: (item: Item, index: number) => React.ReactNode;
  onItemsChange?: (newItems: Item[]) => void;
  dragHandleSelector?: string; // 可选：只有匹配该选择器的区域可触发拖拽
}

const SortableList: React.FC<SortableListProps> = ({
  items,
  direction,
  renderItem,
  onItemsChange,
  dragHandleSelector,
}) => {
  // 当前排序顺序
  const [order, setOrder] = useState<Item[]>(items);
  // 当前正在拖拽的项的索引（初始时）
  const draggingIndexRef = useRef(-1);
  const targetIndexRef = useRef(-1);
  const isDraggingRef = useRef(false);
  // 拖拽过程中的位移（沿指定方向）
  const [delta, setDelta] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);

  // 使用 ref 保存最新状态，避免闭包问题
  const initialMouseRef = useRef<{ x: number; y: number } | null>(null);
  // 保存拖拽开始时拖拽项的 DOM 边界（用于边界判断）
  const dragStartRectRef = useRef<DOMRect | null>(null);

  // 存储每个项的 DOM ref，用于计算其边界
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});


  // 计算鼠标沿拖拽方向的位移
  const computeDelta = (e: MouseEvent) => {
    if (!initialMouseRef.current) return 0;
    return direction === 'vertical' ? e.clientY - initialMouseRef.current.y : e.clientX - initialMouseRef.current.x;
  };

  // 全局 mousemove 处理函数
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!initialMouseRef.current || !dragStartRectRef.current) return;
    const newDelta = computeDelta(e);
    setDelta(newDelta);

    // 当前拖拽项的“虚拟边界”
    let draggedVirtual: { front: number; back: number };
    if (direction === 'vertical') {
      draggedVirtual = {
        front: dragStartRectRef.current.top + newDelta,   // 上边界
        back: dragStartRectRef.current.bottom + newDelta,   // 下边界
      };
    } else {
      draggedVirtual = {
        front: dragStartRectRef.current.left + newDelta,    // 左边界
        back: dragStartRectRef.current.right + newDelta,     // 右边界
      };
    }

    // 遍历其他元素，看是否满足交换条件
    order.forEach((item, idx) => {
      if (idx === draggingIndexRef.current) return;
      const ref = itemRefs.current[item.id];
      if (!ref) return;
      const targetRect = ref.getBoundingClientRect();

      if (direction === 'vertical') {
        // 对于垂直排序：
        // 若拖拽项原在上方（draggingIndex < idx），检查拖拽项的下边界是否超过目标项的下边界
        if (draggingIndexRef.current < idx) {
          if (draggedVirtual.back > targetRect.bottom) {
            targetIndexRef.current = idx;
          }
        }
        // 若拖拽项原在下方（draggingIndex > idx），检查拖拽项的上边界是否小于目标项的上边界
        else if (draggingIndexRef.current > idx) {
          if (draggedVirtual.front < targetRect.top) {
            targetIndexRef.current = idx;
          }
        }
      } else {
        // 水平排序
        if (draggingIndexRef.current < idx) {
          if (draggedVirtual.back > targetRect.left + targetRect.width / 2) {
            targetIndexRef.current = idx;
          }
        } else if (draggingIndexRef.current > idx) {
          if (draggedVirtual.front < targetRect.left + targetRect.width / 2) {
            targetIndexRef.current = idx;
          }
        }
      }
    });
  }, [direction, order]);

  // 交换顺序，并更新拖拽起始状态
  const reorder = (fromIndex: number, toIndex: number) => {
    setOrder((prevOrder) => {
      const newOrder = [...prevOrder];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      onItemsChange && onItemsChange(newOrder);
      return newOrder;
    });
    // // 更新拖拽状态：将拖拽项更新为目标索引，并重置初始鼠标位置与拖拽项边界
    // setDraggingIndex(toIndex);
    // draggingIndexRef.current = toIndex;
    // const newMousePos = { x: e.clientX, y: e.clientY };
    // initialMouseRef.current = newMousePos;
    // // 更新拖拽项的新边界
    // const ref = itemRefs.current[order[toIndex].id];
    // if (ref) {
    //   dragStartRectRef.current = ref.getBoundingClientRect();
    // }
    // setDelta(0);
  };

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>, index: number, itemId: string) => {
    console.log('down')
    // 如果设置了拖拽句柄，则检查是否在句柄区域内点击
    if (dragHandleSelector) {
      const target = e.target as HTMLElement;
      if (!target.closest(dragHandleSelector)) return;
    }
    console.log(index)
    isDraggingRef.current = true;
    draggingIndexRef.current = index;
    targetIndexRef.current = index;
    const mousePos = { x: e.clientX, y: e.clientY };
    initialMouseRef.current = mousePos;
    setDelta(0);
    const ref = itemRefs.current[itemId];
    if (ref) {
      dragStartRectRef.current = ref.getBoundingClientRect();
      console.log(dragStartRectRef.current)
      setOffset(() => (direction === 'horizontal' ? dragStartRectRef.current?.width || 0 : dragStartRectRef.current?.height || 0));
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  const onMouseUp = useCallback(() => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    console.log('mouseup', draggingIndexRef.current, targetIndexRef.current)
    isDraggingRef.current = false;

    const step = targetIndexRef.current > draggingIndexRef.current ? 1 : -1;
    console.log(draggingIndexRef.current, targetIndexRef.current)
    let translate = 0;
    for (let i = targetIndexRef.current; ; i -= step) {
      const element = itemRefs.current[order[i].id]
      if (element) {
        if (i === draggingIndexRef.current) {
          console.log(translate)
          element.style.transform = direction === 'horizontal' ? `translateX(${translate}px)` : `translateY(${translate}px)`;
          break;
        } else {
          console.log(element.offsetWidth, i);
          translate += direction === 'horizontal' ? element.offsetWidth : element.offsetHeight;
        }
      } else {
        break;
      }
    }

    const dragedElement = itemRefs.current[order[draggingIndexRef.current].id]
    if (dragedElement) {
      dragedElement.style.transform = direction === 'horizontal' ? `translateX(${translate}px)` : `translateY(${translate}px)`;
    }
    setTimeout(() => {
      console.log('should swap')
      reorder(draggingIndexRef.current, targetIndexRef.current);
      draggingIndexRef.current = -1
      targetIndexRef.current = -1
    }, 300)
  }, [onMouseMove]);


  // 计算每个项的样式
  const getItemStyle = (index: number): React.CSSProperties => {
    // 移动和松开鼠标时所有元素有动画,拖动结束后都没动画
    if (draggingIndexRef.current === -1 || targetIndexRef.current === -1) return { /*transition: 'none', transform: 'none' */ };
    const transition = 'transform 0.3s ease-out';
    // 被拖动元素跟随鼠标(注意松开鼠标后修改的样式不能被这里覆盖)
    if (draggingIndexRef.current === index) return { transition, zIndex: 1000, position: 'relative', transform: direction === 'vertical' ? `translateY(${delta}px)` : `translateX(${delta}px)` };

    let k = 0;
    if (draggingIndexRef.current < index && index <= targetIndexRef.current) {
      k = -1
    } else if (draggingIndexRef.current > index && index >= targetIndexRef.current) {
      k = 1
    }
    return {
      transform: `translate${direction === 'horizontal' ? 'X' : 'Y'}(${k * offset}px)`,
      transition,
    }
  };

  return (
    <div
      style={{
        display: direction === 'vertical' ? 'block' : 'flex',
        position: 'relative',
      }}
    >
      <span style={{ position: 'absolute', top: 100, left: 100 }}>{offset}</span>
      {order.map((item, index) => (
        <div
          key={item.id}
          ref={(el) => (itemRefs.current[item.id] = el)}
          onMouseDown={(e) => onMouseDown(e, index, item.id)}
          style={{
            userSelect: 'none',
            padding: '5px',
            border: '1px solid #aaa',
            cursor: dragHandleSelector ? 'default' : 'move',
            ...getItemStyle(index),
          }}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
};

export default SortableList;
