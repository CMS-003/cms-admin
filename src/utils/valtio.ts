import { useCallback, useRef, useSyncExternalStore } from "react";
import { proxy, subscribe, useSnapshot } from 'valtio'

export function useLocalProxy<T extends object>(initialState: T) {
  // 保持 proxy 引用不变
  const ref = useRef(proxy(initialState))
  // 订阅变化 - 这会自动触发重新渲染
  const snap = useSnapshot(ref.current)
  return [snap, ref.current] as const;
}

/**
 * 只订阅 proxy 上的某一个「值」（selector 的结果）。
 *
 * 为什么需要它：`useSnapshot` 订阅的是整个 proxy —— 画布上每个节点如果都用它，
 * 鼠标每划过一个节点（currNodeId 变化）都会把所有节点重渲染一遍。
 * 这里用 useSyncExternalStore：subscribe 仍然听整个 proxy，
 * 但 getSnapshot 返回 selector 的结果，React 拿到后自己比较，
 * 值没变就直接跳过重渲染。
 *
 * 约定：selector 必须返回**原始值**（string / number / boolean / null）。
 * 返回新对象会因为引用每次都不相等而完全失去意义。
 */
export function useProxySelector<T extends object, S>(
  target: T | null | undefined,
  selector: (state: T) => S
): S | undefined {
  // selector 通常是行内箭头函数，每次渲染都是新的。用 ref 兜住最新的一份，
  // 否则 subscribe / getSnapshot 的依赖会每次变化，白白重订阅。
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const subscribeFn = useCallback(
    (onStoreChange: () => void) => {
      if (!target) return () => { };
      try {
        return subscribe(target, onStoreChange);
      } catch (err) {
        // target 可能是普通对象（例如 PageContext 的默认值）—— valtio 的 subscribe
        // 对非 proxy 会直接抛。这类对象本来就不可订阅，退化成「不订阅」，
        // 别把整棵组件树打崩（调用方已经做了 `page ?? null`，这只是兜底）。
        return () => { };
      }
    },
    [target]
  );
  const getSnapshot = useCallback(
    () => (target ? selectorRef.current(target) : undefined),
    [target]
  );

  return useSyncExternalStore(subscribeFn, getSnapshot);
}
