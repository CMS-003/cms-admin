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

/**
 * 容器能不能接收某个类型的子节点。
 *
 * accepts 优先取类型表（权威），类型表里查不到才回落到节点自己存的值。
 * level 取子节点类型的 level —— 它是类型的属性，不在节点上。
 */
export function canAcceptType(
  parentType: string,
  parentAccepts: string[] | undefined,
  childType: string,
): boolean {
  const live = typeAccepts(parentType);
  return canAcceptIn(live ?? parentAccepts, childType, typeLevel(childType));
}

/** 某个容器能接收哪些类型 —— 右键菜单「新增子节点」列表用 */
export function acceptedTypes(
  parentType: string,
  parentAccepts: string[] | undefined,
): IComponentType[] {
  const live = typeAccepts(parentType);
  const accepts = live ?? parentAccepts;
  return getComponentTypes().filter((t) => canAcceptIn(accepts, t.name, t.level ?? 1));
}
