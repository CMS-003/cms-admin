import { get, isNil, set } from 'lodash-es';
import { subscribe } from 'valtio';
import type { INodeActions, IPageInfo, IWidget } from '@/types';
import { getWidgetValue } from './utils';

/**
 * 查询条件域。
 *
 * 模板页里「会被多个节点共享、又被节点逐字段写入」的数据只有 query 一份：
 * 列表类的查询条件栏（widget.query === true）整页共用它。
 *
 * 因为它是**逐字段写入**而不是整体替换，光靠「传 prop」拿不到更新 ——
 * 必须有订阅。所以这里把「读 / 写 / 订阅」三件事收成一个对象，
 * 组件侧只暴露 useQuery(field)（按值订阅）和 actions.setQuery（唯一写入入口）。
 *
 * source 不在这里：它每个子树各不相同（Table 一行 / Form 详情 / 模板级），
 * 并且总是以**快照**形式下发（父级一变就换引用 → 子级自然重渲染），
 * 不需要订阅机制，硬塞进来只会让「快照」和「活对象」两套语义打架。
 */
export type QueryScope = {
  /** 读某个字段（key 省略 = 整个 query 对象）；key 支持点路径 */
  get(key?: string): any;
  /** 写某个字段（支持点路径） */
  set(key: string, value: any): void;
  /** 订阅变化（key 省略 = 整个对象） */
  watch(key: string | undefined, listener: () => void): () => void;
};

/** 空域：脱离 Provider 时兜底，保证独立渲染不崩 */
export const EMPTY_QUERY_SCOPE: QueryScope = {
  get: () => undefined,
  set: () => { },
  watch: () => () => { },
};

/**
 * 用 TView 的 page proxy 当后端。
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
      // 唯一的写入入口：page.setQuery（内部就是 this.query[key] = value）
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

/**
 * 节点方法的统一实现。三种写只有三个去处：
 * - setNodeField → 模板树（MST）
 * - widget.query 为真 → 查询域
 * - 其余 → 当前子树的数据源（source）
 *
 * `writeSource` 由所在子树提供：模板级写 `store.source`，
 * Form 写自己的详情形，Table 的单元格写所在那一行。
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
      if (!widget || !widget.field) {
        return;
      }
      const next = getWidgetValue(widget, value);
      if (isNil(next)) {
        return;
      }
      if (widget.query) {
        query.set(widget.field, next);
      } else {
        writeSource(widget.field, next);
      }
    },
  };
}
