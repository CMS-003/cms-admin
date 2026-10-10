import { types, IMSTArray } from 'mobx-state-tree'
import { IComponentType } from '@/types'

/**
 * 组件类型表（admin 里维护的 name / accepts / level）+ 全部接收判定。
 *
 * 为什么要和判定放在一起：判定完全由这张表推导（accepts / level / 父子约束），
 * 分成两个模块后「表在这里、规则在那里」，改规则要来回找。现在一个文件里
 * 「表 + 读表的方法」齐了，编辑器只需要 `import { canAcceptType } from '@/store/component'`。
 *
 * 约定：这些函数读的是 manager.types —— 在渲染 / 事件回调里读，
 * MST 会自动建立依赖（类型表在启动时拉一次就固定了，实际很少变）。
 */
const ComponentType = types.model('ComponentType', {
  _id: types.string,
  name: types.string,
  title: types.string,
  group: types.optional(types.string, ''),
  cover: types.optional(types.string, ''),
  status: types.optional(types.number, 0),
  /** 层级（见 IComponentType.level），默认 1 */
  level: types.optional(types.number, 1),
  accepts: types.array(types.string),
})

const componentStore = types.model('ComponentStore', {
  /** 组件类型表 */
  types: types.array(ComponentType),
  typesLoading: types.optional(types.boolean, true),
  /** 通用排序拖拽（components/SortableDD）正在拖 —— 拖的时候要屏蔽画布的其它响应 */
  isDragging: types.optional(types.boolean, false),
}).actions(self => ({
  setTypes(items: IComponentType[]) {
    self.types = items as IMSTArray<typeof ComponentType>;
    self.typesLoading = false;
  },
  setIsDragging(is: boolean) {
    self.isDragging = is;
  },
}))

const manager = componentStore.create();

export default manager;

// ---------------------------------------------------------------------------
// 读表
// ---------------------------------------------------------------------------

/** 类型表（MST 数组 → 普通数组形态） */
export function componentTypes(): IComponentType[] {
  return manager.types as unknown as IComponentType[];
}

/** 按 name 查类型定义 */
export function findComponentType(type: string): IComponentType | undefined {
  return componentTypes().find(t => t.name === type);
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

/** 类型的层级，默认 1 */
export function typeLevel(type: string): number {
  const def: any = findComponentType(type);
  return def?.level ?? 1;
}

// ---------------------------------------------------------------------------
// 接收判定
// ---------------------------------------------------------------------------

/** 父节点 accepts 里的通配项：声明了它就还能接收 level === 1 的其它类型 */
export const DROP_ACCEPT_ALL = 'all';

/**
 * 父节点能不能接收这个类型的子节点（判定原语）。
 *
 * - 父节点的 accepts 里显式列出了子节点类型 → 接收
 * - 否则，只有「子节点类型的 level === 1 且父节点 accepts 含 'all'」才接收
 * - accepts 为空数组 → 什么都不收
 *
 * level 是「组件类型」的属性（不在节点上）：level 为 2 / 3 的类型只能被父节点点名，
 * 不能走 'all' 通配。拖动和新增两条路径都走这一个判定，避免两边规则跑偏。
 */
export function canAcceptIn(
  parentAccepts: string[] | undefined | null,
  childType: string,
  childLevel: number,
): boolean {
  if (!childType) return false;
  const accepts = parentAccepts || [];
  if (accepts.indexOf(childType) >= 0) return true;
  return childLevel === 1 && accepts.indexOf(DROP_ACCEPT_ALL) >= 0;
}

/**
 * 「只能挂在哪」的父子约束（子类型 → 允许的父类型）。
 *
 * 类型表里的 accepts 描述的是「容器收哪些子节点」，管不住反方向：容器只要配了 'all'，
 * 所有 level === 1 的类型都会被它收进来 —— 包括 TableColumn 这种结构上必须贴着
 * Table 的子节点，于是它就能被拖到页面一级去。这张表是反方向的最后一道闸。
 * **新增「只能挂在某容器下」的规则就往这里加一行。**
 */
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
  return componentTypes().filter(
    t => parentAllowed(parentType, t.name) && canAcceptIn(accepts, t.name, t.level ?? 1),
  );
}

/** 页面根能接收哪些类型 —— 右键菜单挂在根上时的「新增子节点」列表 */
export function rootAcceptedTypes(parentType: string): IComponentType[] {
  return componentTypes().filter(t => canAcceptAtRoot(parentType, t.name));
}
