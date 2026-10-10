import { createContext, useCallback, useContext, useMemo, useRef, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { get, isNil, set } from 'lodash-es';
import { subscribe } from 'valtio';
import type { INodeActions, IPageInfo, IWidget } from '@/types';

/**
 * 数据环境：当前子树能看到的全部共享数据 + 写它们的通道。
 *
 * 为什么走 context 而不是逐层传 prop：渲染子节点的是各容器组件自己
 * （Form / Table / GridLayout / Tab …），它们每渲染一层都要记得把共享数据原样透传 ——
 * 漏一个就是一个 bug（历史上漏过 page、漏过 source）。现在容器只在
 * **需要换数据源**时包一层 <SourceScope>，其余一律继承。
 *
 * 三样数据两种语义，故意不统一：
 * - `source`：**快照**语义。谁提供谁负责在数据变化时换引用，
 *   所以组件里 `get(source, field)` 直读天然是准的，不需要订阅。
 * - `query`：**订阅**语义。整页共用一份、逐字段写入，读的人必须按值订阅（useQuery）。
 * - `actions`：写入口。三种写只有三个去处（节点字段 / 查询域 / 当前子树数据源）。
 */
export type DataEnv = {
  /** 当前子树的数据快照：Table 的一行 / Form 的详情 / 模板级 tree.source */
  source: any;
  /** 页面查询条件域（整页共用一份） */
  query: QueryScope;
  /** 节点方法（setNodeField / setDataField / setQuery） */
  actions: INodeActions;
};

// ---------------------------------------------------------------------------
// 查询条件域
// ---------------------------------------------------------------------------

/**
 * 查询条件域。
 *
 * 模板页里「会被多个节点共享、又被节点逐字段写入」的数据只有 query 一份：
 * 列表类的查询条件栏（widget.query === true）整页共用它。
 *
 * 因为它是**逐字段写入**而不是整体替换，光靠「传 prop」拿不到更新 —— 必须有订阅。
 * 所以把「读 / 写 / 订阅」三件事收成一个对象。
 */
export type QueryScope = {
  /** 读某个字段（key 省略 = 整个 query 对象）；key 支持点路径 */
  get(key?: string): any;
  /** 写某个字段（支持点路径） */
  set(key: string, value: any): void;
  /** 订阅变化（key 省略 = 整个对象） */
  watch(key: string | undefined, listener: () => void): () => void;
};

/** 空域：脱离 Provider 时兜底，保证节点被单独渲染不崩 */
export const EMPTY_QUERY_SCOPE: QueryScope = {
  get: () => undefined,
  set: () => { },
  watch: () => () => { },
};

/**
 * 用页面的 page proxy 当后端。
 *
 * 为什么不另起一个 store：`page.query` 已经是这份数据，且外面还有一堆
 * 老用法要整体读它（`pick(page, ['template_id','query',...])` 发 SEARCH 事件、
 * `self.getApi(page.query)` 拼 URL）。与其维护两份再同步，不如就地包一层：
 * 写入统一走 `page.setQuery`，订阅直接挂在 page 上。
 */
export function createQueryScope(page: IPageInfo): QueryScope {
  const query = () => (page as any).query;
  return {
    get(key) {
      return key === undefined ? query() : get(query(), key);
    },
    set(key, value) {
      // 唯一的写入入口：page.setQuery
      if (typeof key === 'string' && key.indexOf('.') === -1) {
        page.setQuery(key, value);
      } else {
        // 点路径（少见）直接落到 query 上，valtio 一样能追踪
        set(query(), key, value);
      }
    },
    watch(_key, listener) {
      try {
        // valtio 对非 proxy 会抛（PageContext 的默认值就是普通对象），兜住
        return subscribe(page as any, listener);
      } catch (e) {
        return () => { };
      }
    },
  };
}

// ---------------------------------------------------------------------------
// 写入口
// ---------------------------------------------------------------------------

/** widget 的值归一化：boolean / number / array / json 各自转成真实类型 */
function getWidgetValue(widget: IWidget, value: any) {
  switch (widget.type) {
    case 'boolean':
      value = [1, '1', 'true', 'TRUE', true].includes(value) ? true : false;
      break;
    case 'number':
      value = value === '' ? "" : parseFloat(value) || 0;
      break;
    case 'array':
    case 'json':
      try {
        value = typeof value === 'string' ? JSON.parse(value) : value;
      } catch (e) {
        return;
      }
      break;
    default: break;
  }
  return value;
}

/**
 * 节点方法的统一实现。三种写只有三个去处：
 * - setNodeField → 模板树（MST）
 * - widget.query 为真 → 查询域
 * - 其余 → 当前子树的数据源（source）
 *
 * `writeSource` 由所在子树提供：模板级写 `tree.source`，
 * Form 写自己的详情形，Table 的单元格写所在那一行（见 SourceScope）。
 */
export function createNodeActions(opts: {
  query: QueryScope;
  setNodeField: INodeActions['setNodeField'];
  writeSource: (field: string, value: any) => void;
}): INodeActions {
  const { query, setNodeField, writeSource } = opts;
  return {
    setNodeField,
    setQuery(field, value) {
      query.set(field, value);
    },
    setDataField(widget: IWidget, value: any) {
      if (!widget || !widget.field) return;
      const next = getWidgetValue(widget, value);
      if (isNil(next)) return;
      if (widget.query) {
        query.set(widget.field, next);
      } else {
        writeSource(widget.field, next);
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Context / hooks
// ---------------------------------------------------------------------------

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

/** 当前子树的数据快照 */
export function useSource<T = any>(): T {
  return useContext(DataEnvContext).source as T;
}

/** 节点方法集合 */
export function useActions(): INodeActions {
  return useContext(DataEnvContext).actions;
}

/** 查询条件域（命令式读 / 写时用，例如 fetch 前取参数） */
export function useQueryScope(): QueryScope {
  return useContext(DataEnvContext).query;
}

/**
 * 按值订阅查询条件的某个字段。
 *
 * selector 返回的是原始值（string / number / boolean …），值没变 React 会跳过
 * 这次渲染 —— 查询栏每敲一个字都会写 query，整体订阅会让整个画布重渲染。
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
 * 给一个子树换数据源（Table 的一行、Form 的详情、Objects 的每一项…）。
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
