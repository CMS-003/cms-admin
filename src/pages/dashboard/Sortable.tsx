import React, { useState, useRef, useEffect, useCallback, CSSProperties } from 'react';

export interface Item {
  id: string;
  text: string;
}

type Direction = 'vertical' | 'horizontal';

interface SortableListProps {
  items: Item[];
  direction: Direction;
  sort?: (srcIndex: number, dstIndex: number) => void;
  renderItem: (props: {
    item: Item;
    refs: React.MutableRefObject<{
      [key: string]: HTMLDivElement | null;
    }>;
    isDragging: Boolean;
    style: CSSProperties;
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  }) => React.ReactNode;
  onItemsChange?: (newItems: Item[]) => void;
  dragHandleSelector?: string; // 可选：只有匹配该选择器的区域可触发拖拽
}

const SortableList: React.FC<SortableListProps> = ({
  items,
  sort,
  direction,
  renderItem,
  dragHandleSelector,
}) => {
  // 当前排序顺序
  // 当前正在拖拽的项的索引（初始时）
  const draggingIndexRef = useRef(-1);
  const draggingIdRef = useRef('');
  const targetIndexRef = useRef(-1);
  const isDraggingRef = useRef(false);

  const [isEnd, setIsEnd] = useState(true);
  // 拖拽过程中的位移（沿指定方向）
  const [delta, setDelta] = useState<number>(0);
  const deltaRef = useRef(0);
  useEffect(() => {
    deltaRef.current = delta
  }, [delta])
  const [offset, setOffset] = useState<number>(0);

  // 使用 ref 保存最新状态，避免闭包问题
  const initialMouseRef = useRef<{ x: number; y: number } | null>(null);
  // 保存拖拽开始时拖拽项的 DOM 边界（用于边界判断）
  const dragStartRectRef = useRef<DOMRect | null>(null);

  // react 不支持 onTransitionStart 事件,需原生函数处理
  const parentRef = useRef<HTMLDivElement | null>(null);
  // 记录全局动画开关
  const isAnimatingRef = useRef(false);

  // 存储每个项的 DOM ref，用于计算其边界
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});


  // 计算鼠标沿拖拽方向的位移
  const computeDelta = (e: MouseEvent) => {
    if (!initialMouseRef.current) return 0;
    return direction === 'vertical' ? e.clientY - initialMouseRef.current.y : e.clientX - initialMouseRef.current.x;
  };
  // 全局 mousemove 处理函数
  // 不加动画,偏移位置计算没问题
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!initialMouseRef.current || !dragStartRectRef.current) return;
    const newDelta = computeDelta(e);
    setDelta(newDelta);
    const draggedVirtual = direction === 'vertical'
      ? {
        front: dragStartRectRef.current.top + newDelta,
        back: dragStartRectRef.current.bottom + newDelta,
      }
      : {
        front: dragStartRectRef.current.left + newDelta,
        back: dragStartRectRef.current.right + newDelta,
      };
    // 让位动画时可以继续拖拽,但不参与计数占位
    if (isAnimatingRef.current) return;
    let finalTarget = targetIndexRef.current;
    // 遍历其他元素，看是否满足让位条件
    for (let idx = 0; idx < items.length; idx++) {
      // 正在移动的元素，跳过
      if (idx === draggingIndexRef.current) continue;
      const ref = itemRefs.current[items[idx].id];
      if (!ref) break;
      const currentRect = ref.getBoundingClientRect();
      const range = direction === 'horizontal'
        ? { start: currentRect.left, middle: currentRect.left + currentRect.width / 2, end: currentRect.right }
        : { start: currentRect.top, middle: currentRect.top + currentRect.height / 2, end: currentRect.bottom };
      // 不能包含临界值
      const inFrontHalf = draggedVirtual.front < range.middle;
      const inBackHalf = range.middle < draggedVirtual.back

      if (idx === targetIndexRef.current) {
        if (idx > draggingIndexRef.current && inFrontHalf) {
          // 右移前进 判断前边界
          finalTarget = idx - 1;
          break;
        }
        if (idx < draggingIndexRef.current && inBackHalf) {
          // 左移后撤 判断后边界
          finalTarget = idx + 1;
        }
      }
      if (idx < targetIndexRef.current && inFrontHalf) {
        // 非贪婪会 break,包含边界判断
        finalTarget = idx;
        break;
      }
      if (idx > targetIndexRef.current && inBackHalf) {
        finalTarget = idx;
      }
    }
    targetIndexRef.current = finalTarget;
  }, [items]);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>, index: number, itemId: string) => {
    // console.log('down', index)
    // 如果设置了拖拽句柄，则检查是否在句柄区域内点击
    // if (dragHandleSelector) {
    //   const target = e.target as HTMLElement;
    //   if (!target.closest(dragHandleSelector)) return;
    // }
    setIsEnd(false);
    isDraggingRef.current = true;
    draggingIndexRef.current = index;
    draggingIdRef.current = itemId;
    targetIndexRef.current = index;
    const mousePos = { x: e.clientX, y: e.clientY };
    initialMouseRef.current = mousePos;
    setDelta(0);
    const ref = itemRefs.current[itemId];
    if (ref) {
      dragStartRectRef.current = ref.getBoundingClientRect();
      setOffset(() => (direction === 'horizontal' ? dragStartRectRef.current?.width || 0 : dragStartRectRef.current?.height || 0));
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  const onMouseUp = useCallback(() => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    // console.log('mouseup', draggingIndexRef.current, targetIndexRef.current)
    // 关于交换位置: 交换后内容会立即更新,所以draggingIndex 也要更新.
    // 1.松开后修改状态: isDragging false, 拖拽元素相对占位符的偏移量(),交互位置,更新 draggingIndex
    // 2.自动重新计算样式: 已是松开状态,都无动画,立即更新位置
    // 3.异步宏任务设置拖拽元素偏移为0,且有动画.(getItemStyle 不能再触发)
    isDraggingRef.current = false;
    draggingIdRef.current = '';

    const step = targetIndexRef.current > draggingIndexRef.current ? 1 : -1;
    let translate = 0;
    for (let i = draggingIndexRef.current; ; i += step) {
      const element = itemRefs.current[items[i].id]
      if (element) {
        if (i === targetIndexRef.current) {
          break;
        } else {
          translate += step * (direction === 'horizontal' ? element.offsetWidth : element.offsetHeight);
        }
      } else {
        break;
      }
    }
    // console.log('should swap')
    sort && sort(draggingIndexRef.current, targetIndexRef.current);
    setDelta((prev) => prev - translate);
    setTimeout(() => {
      // console.log('回弹空白占位')
      setDelta(() => 0);
      // 两个index错开用于最后的回弹动画
      draggingIndexRef.current = -1
    }, 10)
  }, [onMouseMove]);

  // 计算每个项的样式
  const getItemStyle = (index: number): React.CSSProperties => {
    // 交换后拖动的元素变成了target！  isDragging false

    // 2. 微任务设置targetIndex transform none，有动画
    if ((draggingIndexRef.current === -1 && targetIndexRef.current === index)) {
      return { transition: 'transform 0.2s ease-out', transform: 'none' }
    }
    // 1. 移动和松开鼠标时所有元素有动画,拖动结束后都没动画
    if (!isDraggingRef.current) {
      return { transition: 'none', transform: targetIndexRef.current === index ? (direction === 'vertical' ? `translateY(${delta}px)` : `translateX(${delta}px)`) : 'none' }
    };
    // 被拖动元素跟随鼠标(注意松开鼠标后修改的样式不能被这里覆盖)
    if ((isDraggingRef.current && draggingIndexRef.current === index)) return { transition: 'transform 0.1s ease-out', zIndex: 1000, position: 'relative', transform: direction === 'vertical' ? `translateY(${delta}px)` : `translateX(${delta}px)` };

    let k = 0;
    if (draggingIndexRef.current < index && index <= targetIndexRef.current) {
      k = -1
    } else if (draggingIndexRef.current > index && index >= targetIndexRef.current) {
      k = 1
    }
    return {
      transform: isDraggingRef.current ? `translate${direction === 'horizontal' ? 'X' : 'Y'}(${k * offset}px)` : 'none',
      transition: 'none',
    }
  };

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const handleTransitionStart = (event: Event) => {
      const target = event.target as HTMLElement;
      const id = target.getAttribute("data-sortable-id"); // 获取 data-id
      if (id && id !== draggingIdRef.current) {
        isAnimatingRef.current = true;
      }
    };

    const handleTransitionEnd = (event: Event) => {
      const target = event.target as HTMLElement;
      const id = target.getAttribute("data-sortable-id"); // 获取 data-id
      if (id && id !== draggingIdRef.current) {
        isAnimatingRef.current = false;
        setTimeout(() => {
          setIsEnd(true)
        }, 200)
      }
    };

    parent.addEventListener("transitionstart", handleTransitionStart);
    parent.addEventListener("transitionend", handleTransitionEnd);

    return () => {
      parent.removeEventListener("transitionstart", handleTransitionStart);
      parent.removeEventListener("transitionend", handleTransitionEnd);
    };
  }, []);
  return (
    <div
      ref={parentRef}
      style={{
        display: direction === 'vertical' ? 'block' : 'flex',
        position: 'relative',
        userSelect: isDraggingRef.current ? 'none' : 'auto',
      }}
    >
      {items.map((item, index) => renderItem({
        item,
        refs: itemRefs,
        isDragging: isEnd ? false : (isDraggingRef.current ? draggingIndexRef.current === index : targetIndexRef.current === index),
        style: getItemStyle(index),
        onMouseDown: (e) => onMouseDown(e, index, item.id)
      }))}
    </div>
  );
};

export default SortableList;
