import { createContext, useCallback, useContext, useMemo, useRef, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import type { INodeActions } from '@/types';
import { EMPTY_QUERY_SCOPE, createNodeActions } from './data';
import type { QueryScope } from './data';

/**
 * 一个「数据环境」= 当前子树能看到的全部共享数据 + 写它们的通道。
 *
 * 为什么走 context 而不是逐层传 prop：
 * 渲染子节点的是各容器组件自己（Form / Table / GridLayout / Tab …），
 * 它们每渲染一层都要记得把 source / page / actions 原样透传下去 ——
 * 漏一个就是一个 bug（历史上漏过 page、漏过 source）。现在容器只在
 * **需要换数据源**时包一层 <SourceScope>，其余一律继承。
 *
 * source：读用「快照」语义 —— 谁提供谁负责在数据变化时换引用，
 *   所以组件里 `source[field]` 这种直读天然是准的，不需要订阅。
 * query：读用「订阅」语义 —— 逐字段写入，读的人必须按值订阅（useQuery）。
 */
export type DataEnv = {
  /** 当前子树的数据快照：Table 的一行 / Form 的详情 / 模板级 store.source */
  source: any;
  /** 页面查询条件域（整页共用一份） */
  query: QueryScope;
  /** 节点方法（setNodeField / setQuery / setDataField） */
  actions: INodeActions;
};

const NOOP = () => { };

/** 没有 Provider 时的兜底（例如节点被单独渲染） */
const FALLBACK_ENV: DataEnv = {
  source: {},
  query: EMPTY_QUERY_SCOPE,
  actions: createNodeActions({
    query: EMPTY_QUERY_SCOPE,
    setNodeField: NOOP,
    writeSource: NOOP,
  }),
};

export const DataEnvContext = createContext<DataEnv>(FALLBACK_ENV);

/** 拿整个数据环境（需要命令式读写时用） */
export function useDataEnv(): DataEnv {
  return useContext(DataEnvContext);
}

/** 节点方法集合 */
export function useActions(): INodeActions {
  return useContext(DataEnvContext).actions;
}

/** 当前子树的数据快照 */
export function useSource<T = any>(): T {
  return useContext(DataEnvContext).source as T;
}

/** 查询条件域（命令式读 / 写时用，例如 fetch 前取参数） */
export function useQueryScope(): QueryScope {
  return useContext(DataEnvContext).query;
}

/**
 * 按值订阅查询条件的某个字段。
 *
 * selector 返回的是原始值（string / number / boolean …），值没变
 * React 会跳过这次渲染 —— 查询栏每敲一个字都会写 query，
 * 整体订阅会让整个画布重渲染。
 */
export function useQuery<T = any>(field?: string): T | undefined {
  const scope = useQueryScope();
  const subscribeFn = useCallback(
    (onStoreChange: () => void) => scope.watch(field, onStoreChange),
    [scope, field]
  );
  const getSnapshot = useCallback(() => scope.get(field), [scope, field]);
  return useSyncExternalStore(subscribeFn, getSnapshot) as T | undefined;
}

/**
 * 给一个子树换数据源（Table 的一行、Form 的详情…）。
 *
 * - `source` 用来读：父级数据一变就换引用，子级自然重渲染
 * - `write` 用来写：`widget.query` 为假的字段落这里；
 *   注意要写**活对象**，不是传下来那个快照（快照改了没人知道）
 */
export function SourceScope({ source, write, children }: {
  source: any;
  write?: (field: string, value: any) => void;
  children: ReactNode;
}) {
  const parent = useContext(DataEnvContext);

  // write 基本都是行内箭头函数（每次渲染都是新的），用 ref 兜住最新的那份，
  // 这样 env 只在 source / parent 变化时重建
  const writeRef = useRef(write);
  writeRef.current = write;

  const value = useMemo<DataEnv>(() => ({
    source,
    query: parent.query,
    actions: createNodeActions({
      query: parent.query,
      setNodeField: parent.actions.setNodeField,
      writeSource: (field, next) => {
        if (writeRef.current) writeRef.current(field, next);
      },
    }),
  }), [parent, source]);

  return <DataEnvContext.Provider value={value}>{children}</DataEnvContext.Provider>;
}
