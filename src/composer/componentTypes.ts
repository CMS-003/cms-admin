import store from '@/store';
import type { IComponentType } from '@/types';
import { canAcceptIn } from './tree';

/**
 * 组件类型表（admin 里维护的 name / accepts / level）。
 *
 * 这张表是「接收规则」的权威来源：节点上的 accepts 是加载时从这张表回填的，
 * 而 level 只存在于类型上、不存在于节点上。
 *
 * 注意：这里的读取都发生在渲染 / 事件回调里，不走响应式订阅 ——
 * 类型表在应用启动时就拉好了，之后不会变。
 */
export function getComponentTypes(): IComponentType[] {
  return (store.component.types as unknown as IComponentType[]) || [];
}

/** 按 name 查类型定义 */
export function findComponentType(type: string): IComponentType | undefined {
  return getComponentTypes().find((t) => t.name === type);
}

/**
 * 某个类型允许接收的子节点类型。
 *
 * 返回 undefined 表示类型表里没有这个类型 —— 调用方应保留节点自己存的 accepts
 * （类型表比模板数据晚加载时，不能把「查不到」当成「什么都不收」）。
 */
export function typeAccepts(type: string): string[] | undefined {
  const def: any = findComponentType(type);
  if (!def) return undefined;
  const accepts = def.accepts;
  if (!accepts) return [];
  return typeof accepts.toJSON === 'function' ? accepts.toJSON() : Array.from(accepts);
}

/** 类型的层级，默认 1（和 ComponentType 模型的默认值一致） */
export function typeLevel(type: string): number {
  const def: any = findComponentType(type);
  return def?.level ?? 1;
}

// ---------------------------------------------------------------------------
// 「只能挂在哪」的父子约束
// ---------------------------------------------------------------------------
//
// 类型表里的 accepts 描述的是「容器收哪些子节点」，管不住反方向：
// 容器只要配了 'all'，所有 level === 1 的类型都会被它收进来 ——
// 包括 TableColumn 这种结构上必须贴着 Table 的子节点，于是它就能被拖到页面一级去。
//
// 这张表补上反方向的约束（子类型 → 允许的父类型），作为接收判定的最后一道闸：
// 命中的子类型，父类型不在允许列表里就一律拒绝（页面根同样拦）。
// 需要新的强约束时往这里加一行即可。

const EXCLUSIVE_PARENTS: Record<string, string[]> = {
  TableColumn: ['Table'],
};

/** 这个子类型允许的父类型；返回 undefined 表示没有父子约束 */
export function exclusiveParentsOf(childType: string): string[] | undefined {
  return EXCLUSIVE_PARENTS[childType];
}

/** 父子约束：这个子类型能不能挂在 parentType 下（没有约束的类型恒为 true） */
export function parentAllowed(parentType: string, childType: string): boolean {
  const allowed = EXCLUSIVE_PARENTS[childType];
  if (!allowed) return true;
  return allowed.indexOf(parentType) >= 0;
}

/**
 * 容器能不能接收某个类型的子节点。
 *
 * accepts 优先取类型表（权威），类型表里查不到才回落到节点自己存的值。
 * level 取子节点类型的 level —— 它是类型的属性，不在节点上。
 * 先过父子约束：父类型不对（比如往 Layout 里放 TableColumn）直接不收。
 */
export function canAcceptType(
  parentType: string,
  parentAccepts: string[] | undefined,
  childType: string,
): boolean {
  if (!parentAllowed(parentType, childType)) return false;
  const live = typeAccepts(parentType);
  return canAcceptIn(live ?? parentAccepts, childType, typeLevel(childType));
}

/**
 * 页面根（template 外壳）能不能接收某个类型的子节点。
 *
 * 根不是业务容器，没有实体的 accepts，规则固定为：**只接收 level === 1 的一级节点**。
 * 这样 TableColumn / GridCell 之类必须贴在特定容器里的结构子节点就到不了页面一级。
 * 父子约束同样生效（所以 TableColumn 即便 level 是 1 也进不来）。
 */
export function canAcceptAtRoot(parentType: string, childType: string): boolean {
  if (!parentAllowed(parentType, childType)) return false;
  return typeLevel(childType) === 1;
}

/** 某个容器能接收哪些类型 —— 右键菜单「新增子节点」列表用 */
export function acceptedTypes(
  parentType: string,
  parentAccepts: string[] | undefined,
): IComponentType[] {
  const live = typeAccepts(parentType);
  const accepts = live ?? parentAccepts;
  return getComponentTypes().filter(
    (t) => parentAllowed(parentType, t.name) && canAcceptIn(accepts, t.name, t.level ?? 1),
  );
}

/** 页面根能接收哪些类型 —— 右键菜单挂到根上时的「新增子节点」列表 */
export function rootAcceptedTypes(parentType: string): IComponentType[] {
  return getComponentTypes().filter((t) => canAcceptAtRoot(parentType, t.name));
}
