import type { IResource } from './resource';

/**
 * 组件的**数据形态**（后端 / 数据库里长什么样）。
 * 编辑器侧的渲染契约在 `types/editor.ts`，扁平化之后的树节点在 `types/tree.ts`。
 */

export type IWidget = {
  field: string,
  value: any;
  /**
   * 是否仅用于查询
   */
  query: boolean;
  type: 'boolean' | 'number' | 'string' | 'json' | 'array';
  source: string;
  /**
   * **数据来源**（列表类节点用：Card / Banner …），默认 `'data'`。
   *
   * | 值         | 数据来自                                                         |
   * |------------|------------------------------------------------------------------|
   * | `'data'`   | 节点自己的 `resources`（「数据」面板维护的静态数据）              |
   * | `'global'` | 全局配置里 `source` 指向的那一段（`store.global.getValue(source)`） |
   * | `'api'`    | 请求 `method` + 节点 `url`，响应按 `mapping` 翻译后再取列表        |
   *
   * 取数与归一在 `@/nodes/_shared/useResourceList`。
   */
  from: 'data' | 'global' | 'api';
  refer: {
    label: string;
    value: string | number | boolean;
  }[];
  action: string;
  method: string;
  /**
   * **响应映射**（只有 `action === 'FETCH'` 用）。
   *
   * 外部接口的响应包装格式各不相同（本项目是 `{code, message, data}`，
   * 第三方可能是 `{status, result: {list: [...]}}`），这份配置把「原始响应 body」
   * 映射成项目统一的结构：`{ [目标字段]: 规则 }`。
   *
   * - 规则以 `$` 开头 = 取值路径，lodash `get(body, path)`（`'$data.list'` → `body.data.list`）
   * - 其他值 = 默认填充值，原样写进结果
   *
   * 例：`{ code: 0, data: '$data.list' }` → `{ code: 0, data: body.data.list }`
   * 语义与实现见 `@/utils/mapping`，编辑器里在「事件」面板配置。
   */
  mapping: Record<string, any>;
}

/**
 * 一条组件记录。
 *
 * 服务端的模板接口返回的是**嵌套**结构（children 里塞子对象），
 * 编辑器加载后会用 `normalizeTree` 打平成 FlatNode 再渲染。
 * 编辑态字段（$origin / $new / $selected）不在这里 —— 那是编辑器加上去的。
 */
export type IComponent = {
  _id: string;
  type: string;
  template_id?: string;
  project_id?: string;
  parent_id?: string;
  tree_id?: string;
  title?: string;
  name?: string;
  icon?: string;
  cover?: string;
  desc?: string;
  url?: string;
  order?: number;
  status?: number;
  attrs?: any;
  style?: any;
  widget?: Partial<IWidget>;
  accepts?: string[];
  queries?: string[];
  resources?: IResource[];
  children?: IComponent[];
}

/** 一个模板页（页面根就是它，children 是页面下的一级子节点） */
export type ITemplate = {
  _id: string;
  project_id: string;
  title: string;
  name: string;
  desc: string;
  cover: string;
  type: string;
  path: string;
  attrs: object;
  style: object;
  available: boolean;
  order: number;
  children: IComponent[];
}

/**
 * 组件类型（admin 里维护的那张表）。
 *
 * 这张表是「接收规则」的权威来源：节点上的 accepts 是加载时从这张表回填的，
 * 而 level 只存在于类型上、不存在于节点上。
 */
export type IComponentType = {
  _id: string;
  name: string;
  group: string;
  title: string;
  cover: string;
  status: number;
  /**
   * 层级：1 = 可以接收任意子节点；2 / 3 = 只能是 accepts 里指定类型的子节点，
   * 父节点也必须在自己的 accepts 里。拖放和新增都要按这个校验。
   */
  level?: number;
  /** 允许接收的子节点类型；含 'all' 表示全收，空数组表示不接收子节点 */
  accepts: string[];
}

export type IConfig = {
  _id?: string;
  name?: string;
  cover?: string;
  desc?: string;
  available?: string;
  createdAt?: Date;
  updatedAt?: Date;
  type: string;
  data: any;
}

export enum IEditorComponent {
  Select = 'Select',
  Input = 'Input',
  Number = 'Number',
  Hidden = 'Hidden',
  Area = 'Area',
  Read = 'Read',
  Switch = 'Switch',
  RemoteSelect = 'RemoteSelect',
  Image = 'Image',
  Editor = 'Editor',
}

export type IEditorField = {
  field: string;
  title: string;
  type: string;
  component: IEditorComponent;
  defaultValue: string | boolean | number;
  autoFocus?: boolean;
  value: { value: string | number | boolean, name: string }[];
  fetch?: Function;
}
