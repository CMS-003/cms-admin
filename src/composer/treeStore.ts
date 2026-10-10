import { types, Instance, flow, getSnapshot, isStateTreeNode } from 'mobx-state-tree';
import { message } from 'antd';
import { cloneDeep, isEqual, set as ldset } from 'lodash-es';
import apis from '@/api';
import type { IWidget } from '@/types';
import { mergeQuery } from './utils';
import { canAcceptType, typeAccepts } from './componentTypes';
import { createNode, resolveTreeId, resolveInsertIndex, toPayload, TreeData } from './tree';

/**
 * mobx-state-tree 版扁平树 store。
 *
 * 之前 valtio 方案里「读走 stateRef 快照、写走 live store」是两半，
 * 迁回 MST 后读写同源：组件里读的是 MST 实例（observer 自动追踪），
 * 写走 store 的 action（MST 天然事务化，不用 runInAction 也不用拆两半）。
 *
 * 结构和 valtio 版完全一致：
 * - 所有节点平铺在 map 里，key 是 _id
 * - 每个节点的 children 是「子节点 id 的有序列表」
 * - parent_id 是反向指针（根的直接子级为 ''）
 * - children / parent_id 双写只允许在 insertAt / remove / move 里发生
 */

function clampIndex(index: number, len: number): number {
  return Math.max(0, Math.min(index, len));
}

/** 旧 Component 模型里的 URL 模板工具（:param 占位符 + query 合并） */
function buildApiUrl(rawUrl: string, params: any, query: any): string {
  let url = rawUrl || '';
  const regex = /:([a-zA-Z\-_]+)/g;
  const matches = [...url.matchAll(regex)];
  matches.forEach(match => {
    url = url.replace(match[0], params[match[1]]);
  });
  return mergeQuery(url, query);
}

const WidgetModel = types.model('NodeWidget', {
  field: types.optional(types.string, ''),
  value: types.optional(
    types.union(types.string, types.number, types.boolean, types.frozen<any>()),
    '',
  ),
  type: types.optional(types.string, 'string'),
  query: types.optional(types.boolean, false),
  source: types.optional(types.string, ''),
  refer: types.optional(
    types.array(types.model('NodeRefer', {
      value: types.optional(types.union(types.string, types.number, types.boolean), ''),
      label: types.optional(types.string, ''),
    })),
    [],
  ),
  action: types.optional(types.string, ''),
  method: types.optional(types.string, ''),
});

const ResourceModel = types.model('NodeResource', {
  _id: types.identifier,
  title: types.optional(types.string, ''),
  cover: types.optional(types.string, ''),
  poster: types.optional(types.string, ''),
  thumbnail: types.optional(types.string, ''),
  status: types.optional(types.number, 0),
});

export const NodeModel = types
  .model('Node', {
    _id: types.identifier,
    type: types.optional(types.string, ''),
    parent_id: types.optional(types.string, ''),
    children: types.optional(types.array(types.string), []),
    template_id: types.optional(types.string, ''),
    project_id: types.optional(types.string, ''),
    tree_id: types.optional(types.string, ''),
    title: types.optional(types.string, ''),
    name: types.optional(types.string, ''),
    icon: types.optional(types.string, ''),
    cover: types.optional(types.string, ''),
    desc: types.optional(types.string, ''),
    url: types.optional(types.string, ''),
    order: types.optional(types.number, 0),
    status: types.optional(types.number, 1),
    /** 任意 JSON，dot 路径写入时由 store.setField 整体替换（frozen 不能原地改） */
    attrs: types.optional(types.frozen<any>(), {}),
    style: types.optional(types.frozen<any>(), {}),
    widget: types.optional(WidgetModel, {}),
    accepts: types.optional(types.frozen<string[]>(), []),
    queries: types.optional(types.array(types.string), []),
    resources: types.optional(types.array(ResourceModel), []),
    // ---------- 编辑态字段（库里没有，保存时剥掉） ----------
    $origin: types.optional(types.frozen<any>(), {}),
    $new: types.optional(types.boolean, false),
    $selected: types.optional(types.boolean, false),
  })
  .views(self => ({
    /** 可直接发给后端的 payload（剥掉 children 与 $ 编辑态字段） */
    get payload(): Record<string, any> {
      return toPayload(self);
    },
    /** 相对 $origin 是否变更（新增节点恒为真）。根节点不参与，由 store 过滤 */
    get changed(): boolean {
      if (self.$new) return true;
      return !isEqual(self.$origin, this.payload);
    },
    /** :param 占位符 URL 模板 + query 合并（旧 Component 模型同名视图） */
    getApi(params: any = {}, query: any = {}) {
      return buildApiUrl(self.url, params, query);
    },
  }));

export type TreeNode = Instance<typeof NodeModel>;

export const TreeStore = types
  .model('TreeStore', {
    template_id: types.optional(types.string, ''),
    rootId: types.optional(types.string, ''),
    map: types.map(NodeModel),
    /** 待提交删除的节点 id。$new 的没落过库，删除时直接丢弃，不进这里 */
    removedIds: types.optional(types.array(types.string), []),
    saving: false,
    loading: true,
    /** 表单数据源（setDataField 非 query 部分写这里） */
    source: types.optional(types.frozen<any>(), {}),
  })
  .views(self => ({
    getNode(id: string) {
      return self.map.get(id);
    },
    getChildren(id: string): TreeNode[] {
      const node = self.map.get(id);
      if (!node) return [];
      const out: TreeNode[] = [];
      node.children.forEach(cid => {
        const child = self.map.get(cid);
        if (child) out.push(child);
      });
      return out;
    },
    getParent(id: string): TreeNode | undefined {
      const node = self.map.get(id);
      if (!node || !node.parent_id) return undefined;
      return self.map.get(node.parent_id);
    },
    getSiblingIndex(id: string): number {
      const node = self.map.get(id);
      if (!node) return -1;
      const parent = self.map.get(node.parent_id);
      return parent ? parent.children.indexOf(id) : -1;
    },
    /** 自身 + 所有后代 id（前序） */
    collectSubtree(id: string): string[] {
      const out: string[] = [];
      const dfs = (nid: string) => {
        out.push(nid);
        const n = self.map.get(nid);
        if (n) n.children.forEach(dfs);
      };
      dfs(id);
      return out;
    },
    /** 该落点是否等价于「原地不动」 */
    isNoopDrop(dragId: string, target: { containerId: string; index: number }): boolean {
      const node = self.map.get(dragId);
      if (!node || node.parent_id !== target.containerId) return false;
      const parent = self.map.get(target.containerId);
      if (!parent) return false;
      const idx = parent.children.indexOf(dragId);
      if (idx < 0) return false;
      return target.index === idx || target.index === idx + 1;
    },
    /** 拖放 / 新增共用的接收判定。root 是页面壳，不做约束 */
    canAccept(containerId: string, childType: string): boolean {
      if (!childType) return true;
      if (containerId === self.rootId) return true;
      const parent = self.map.get(containerId);
      if (!parent) return false;
      return canAcceptType(parent.type, parent.accepts, childType);
    },
    /** 待提交的变更节点 id（新增 + 修改）。根节点（template 本身）不算 */
    get dirtyIds(): string[] {
      const out: string[] = [];
      self.map.forEach(node => {
        if (node._id !== self.rootId && node.changed) out.push(node._id);
      });
      return out;
    },
    get dirtyCount(): number {
      return this.dirtyIds.length + self.removedIds.length;
    },
    isDirty(id: string): boolean {
      return this.dirtyIds.indexOf(id) !== -1;
    },
    /** 收集需要提交的 payload（父在子前，依赖 map 插入顺序） */
    collectChanges(): Record<string, any>[] {
      const out: Record<string, any>[] = [];
      self.map.forEach(node => {
        if (node._id !== self.rootId && node.changed) out.push(node.payload);
      });
      return out;
    },
  }))
  .actions(self => ({
    setKV(key: string, value: any) {
      if (key === 'saving') {
        self.saving = value;
      }
      if (key === 'loading') {
        self.loading = value;
      }
      if (key === 'template_id') {
        self.template_id = value;
      }
    }
  }))
  .actions(self => ({
    /** 用 normalizeTree 的产出整体替换树（刷新 / 换页） */
    load(data: TreeData) {
      self.rootId = data.rootId;
      self.map.replace(data.map as any);
      // $origin 必须以 MST snapshot 形态重新落基线：
      // normalizeTree 算的是普通对象形态，而 MST 会把声明过的默认字段补齐
      // （queries / resources 等缺失键），两边形态不一致会把所有节点误判成脏
      self.map.forEach(node => {
        if (node._id !== self.rootId) {
          node.$origin = cloneDeep(node.payload);
        }
      });
      self.removedIds.clear();
    },
    /** 整体替换 source 里的某个字段路径 */
    setSource(field: string, value: any) {
      self.source = ldset(cloneDeep(self.source ?? {}), field, value);
    },
    /**
     * 改节点字段，key 支持 'title' / 'widget.field' / 'attrs.x' 路径。
     * - 声明过的嵌套 model（widget.*）由 lodash 直接赋值，MST 可追踪
     * - attrs / style 是 frozen（任意 JSON），dot 路径必须整体替换才被追踪
     */
    setField(id: string, key: string, value: any) {
      const node = self.map.get(id) as any;
      if (!node) return;
      const dot = key.indexOf('.');
      if (dot > 0) {
        const head = key.slice(0, dot);
        if (head === 'attrs' || head === 'style') {
          node[head] = ldset(cloneDeep(node[head] ?? {}), key.slice(dot + 1), value);
        } else {
          ldset(node, key, value);
        }
      } else {
        node[key] = value;
      }
    },
    insertAt(parentId: string, index: number, node: any) {
      const parent = self.map.get(parentId);
      if (!parent || !node || !node._id) return;
      // MST 实例或普通对象统一转 snapshot，深拷贝避免外部引用被间接改写
      const snap: any = isStateTreeNode(node) ? getSnapshot(node) : cloneDeep(node);
      snap._id = node._id;
      snap.parent_id = parentId;
      snap.children = [];
      self.map.put(snap);
      parent.children.splice(clampIndex(index, parent.children.length), 0, node._id);
    },
    /** 按数组顺序把容器的 children 的 order 重写成 0..n-1 */
    reindex(parentId: string) {
      const parent = self.map.get(parentId);
      if (!parent) return;
      parent.children.forEach((cid, i) => {
        const child = self.map.get(cid);
        if (child && child.order !== i) child.order = i;
      });
    },
    /** 节点移动 / 插入之后，按规则重写整棵子树的 tree_id */
    refreshTreeIds(id: string, newParentId: string) {
      const parent = self.map.get(newParentId);
      const node = self.map.get(id);
      if (!parent || !node) return;
      const parentIsRoot = parent.parent_id === '';
      const myTreeId = resolveTreeId(parent as any, parentIsRoot);
      const childTreeId = parentIsRoot ? id : myTreeId;
      const walk = (nid: string, tid: string, nextTid: string) => {
        const n = self.map.get(nid);
        if (!n) return;
        if (n.tree_id !== tid) n.tree_id = tid;
        n.children.forEach(c => walk(c, nextTid, nextTid));
      };
      walk(id, myTreeId, childTreeId);
    },
    /** 保存成功后就地重置基线（不重新拉取，冲掉选中态 / 滚动位置） */
    resetBaseline(updates: Record<string, any>[]) {
      for (const p of updates) {
        const n = self.map.get(p._id);
        if (!n) continue;
        n.$origin = cloneDeep(p);   // 必须深拷贝：p 里的 attrs / style 可能还是活引用
        n.$new = false;
      }
      self.removedIds.clear();
    },
  }))
  // 第二个 actions 块：这里的 self 在类型上已包含上面的方法，可以互相调用
  .actions(self => ({
    remove(id: string) {
      const node = self.map.get(id);
      if (!node) return;
      const parentId = node.parent_id;
      const subtree = self.collectSubtree(id);
      // 先记账再删：$new 的还没进数据库，直接丢弃
      for (const nid of subtree) {
        if (nid === self.rootId) continue;
        const n = self.map.get(nid);
        if (n && !n.$new && self.removedIds.indexOf(nid) === -1) {
          self.removedIds.push(nid);
        }
      }
      const parent = self.map.get(parentId);
      if (parent) parent.children.remove(id);
      for (const nid of subtree) self.map.delete(nid);
    },
    move(id: string, parentId: string, index: number) {
      const node = self.map.get(id);
      const to = self.map.get(parentId);
      if (!node || !to || id === parentId) return;
      const sameContainer = node.parent_id === parentId;
      const fromId = node.parent_id;
      const from = fromId ? self.map.get(fromId) : undefined;
      const oldIndex = from ? from.children.indexOf(id) : -1;
      // 先摘除；index 的语义是「摘除之前」的兄弟列表里的落点
      if (from && oldIndex >= 0) from.children.remove(id);
      to.children.splice(clampIndex(resolveInsertIndex(sameContainer, oldIndex, index), to.children.length), 0, id);
      if (node.parent_id !== parentId) node.parent_id = parentId;
      // 两边容器的 order 都要重排
      const containers = sameContainer ? [parentId] : [fromId, parentId];
      containers.forEach(cid => cid && self.reindex(cid));
      // 换了所属一级子树时，整棵子树的 tree_id 跟着改
      self.refreshTreeIds(id, parentId);
    },
    /** 按类型新建节点并插入（拖放约束对「新增」同样生效），返回新节点 */
    createAndInsert(parentId: string, index: number, type: string): TreeNode | null {
      const parent = self.map.get(parentId);
      if (!parent) return null;
      if (parentId !== self.rootId && !canAcceptType(parent.type, parent.accepts, type)) {
        message.warning(`「${parent.title || parent.type}」不接收「${type}」类型的子节点`);
        return null;
      }
      const node = createNode({
        type,
        parent: parent as any,
        parentIsRoot: parentId === self.rootId,
        index,
        template_id: self.template_id || parent.template_id,
        project_id: parent.project_id,
        accepts: typeAccepts(type) ?? [],
      });
      self.insertAt(parentId, index, node);
      return self.map.get(node._id) ?? null;
    },
    save: flow(function* save() {
      if (self.saving) return;
      const updates = self.collectChanges();
      const removes = self.removedIds.slice() as unknown as string[];
      if (!updates.length && !removes.length) return;
      self.saving = true;
      try {
        if (updates.length) {
          yield apis.batchUpdateComponent({ body: updates });
        }
        if (removes.length) {
          yield apis.batchDestroyComponent({ ids: removes.join(',') });
        }
        self.resetBaseline(updates);
      } catch (err: any) {
        message.error(`保存失败：${err?.message || err}`);
        throw err;
      } finally {
        self.saving = false;
      }
    }),
  }));

export type TreeStoreInstance = Instance<typeof TreeStore>;
