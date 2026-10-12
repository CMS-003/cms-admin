import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Spin } from 'antd';
import { autorun } from 'mobx';
import { observer } from 'mobx-react';
import { proxy, subscribe } from 'valtio';

import apis from '@/api';
import { typeAccepts } from '@/store/component';
import { createTreeStore, normalizeTree, type TreeStoreInstance } from '@/store/tree';
import { parseQuery } from '@/utils/url';
import type { EditorStatus, IPageInfo, MenuAction } from '@/types';
import {
  DataEnv,
  DataEnvContext,
  createNodeActions,
  createQueryScope,
  ModeContext,
  PageContext,
  TreeContext,
  EditorStatusContext,
  createEditorStatus,
  useSetTitleContext,
} from '@/context';

import { ContextMenuContent, ContextMenuContext } from './ContextMenu';
import { NodeWrapper } from './NodeWrapper';

/**
 * 节点样式（.node / .node-handle / 选中框 / 右键菜单 / 拖拽预览宿主）。
 *
 * ⚠️ 必须挂在**这个模块**上，不能挂在 EditorPage（编辑器入口）上：
 * 模板渲染器是所有渲染路径的公共入口 —— 编辑器、弹框（ModalView）、
 * 动态页（pages/dynamic）都要渲染它。编辑器入口是懒加载路由，
 * 挂在那边时弹框 / 动态页拿不到这份 CSS，`.node` 的
 * box-sizing / display:flex / position:relative 全丢，表现为布局散架。
 * 判据：样式要挂在「所有渲染路径都会加载的模块」上。
 */
import './styles.css';

export type TemplateViewProps = {
  /** 模板 id（页面根节点的 id 就是它） */
  template_id: string;
  mode: 'edit' | 'preview';
  /** 页面路径，query string 会落成页面的查询条件初值（弹框靠它传记录 id） */
  path: string;
  close: Function;
  /**
   * 把树 store 交给外层（EditorView 拖拽要用）。
   * 用 ref 直连而不是全局事件：模板渲染器是多实例的（画布 / 弹框内嵌 / 动态页），
   * 全局事件会让几个实例互相串台。
   */
  apiRef?: React.MutableRefObject<TreeStoreInstance | null>;
  /**
   * 编辑器状态（脏数据数量 / 保存 / 当前编辑节点）。由需要工具栏的那一层创建后传进来；
   * 独立渲染时不传，内部自己造一份。
   */
  status?: EditorStatus;
};

/**
 * 模板渲染器：一个模板页 = 一棵树 + 一套数据环境 + 一摞上下文。
 *
 * 它只负责「把模板渲染出来」，编辑器的工具栏 / 组件库 / 属性面板 / 拖拽都在
 * `EditorView` 里 —— 弹框和动态页只想要渲染，不该把编辑器整套拖进来。
 */
export const TemplateView = React.memo(observer(function TemplateView({
  template_id, mode, path, close, apiRef, status,
}: TemplateViewProps) {
  // 编辑器状态要在 action 之前解析：menuAction 要写它。用 ref 读，避免闭包捕获旧对象
  const [ownStatus] = useState(() => createEditorStatus());
  const editorStatus = status ?? ownStatus;
  const statusRef = useRef(editorStatus);
  statusRef.current = editorStatus;

  // 树 store：MST 实例，读写同源。observer 包着，加载完成 / 结构变化会自动重渲染
  const [tree] = useState(() => createTreeStore(template_id));
  const setTitle = useSetTitleContext()
  /**
   * 页面级共享数据（模板 id / 路径 / 查询条件）。
   *
   * 必须**身份稳定**：`useState` 建一次，后续渲染复用同一个实例。
   * 早期写成 `const page = proxy(...)` 直接放在 render 里 → 每次渲染造一个新 proxy，
   * 「写」和「读」落在两个对象上：Select 通过 actions 写进了新的那个（打印得到），
   * 而 Table / Form 这类在 `useEffectOnce` / `useCallback` 里捕获过 page 的节点
   * 读到的永远是第一次渲染造出来的死对象 —— 搜索时 page.query 是空的。
   */
  const [page] = useState(() => proxy<IPageInfo>({
    template_id,
    path,
    close,
    param: {},
    // path 里的 query string 是查询条件的初值（弹框传 ?id=xxx 就靠它）
    query: parseQuery(path) as any,
    setQuery(field, value) {
      this.query[field] = value;
    },
  }));

  // template_id / path / close 是 props 派生出来的，props 变了要同步进同一个实例。
  // 只改字段、不换对象 —— 换对象就等于把上面那条「身份稳定」又破坏了。
  useEffect(() => {
    if (page.template_id !== template_id) page.template_id = template_id;
    if (page.path !== path) {
      page.path = path;
      // path 换了（弹框换记录 / 动态页跳转）要重新落一次查询条件。
      // 不重新解析的话 Form 读到的 id 还是上一条记录的 —— 弹框会一直显示旧数据。
      page.query = parseQuery(path) as any;
    }
    if (page.close !== close) page.close = close;
  }, [page, template_id, path, close]);

  // ---------- 数据环境 ----------
  // 一个模板页只建一份。三种数据的归属：
  //   query  → 挂在 page 上（列表页的查询条件整页共用），逐字段写、按值订阅
  //   source → 模板级就是 tree.source（MST frozen，整体替换）
  //   子树的 source（Table 的行 / Form 的详情 / Objects 的每一项）由各自的
  //   <SourceScope> 覆盖
  const query = useMemo(() => createQueryScope(page), [page]);

  const env = useMemo<DataEnv>(() => ({
    // 读一次 tree.source：整体替换时（setSource 会 cloneDeep）引用变化，
    // observer 追踪到 → 重渲染 → env 重建 → 子树拿到新快照
    source: tree.source,
    query,
    actions: createNodeActions({
      query,
      setNodeField(node: any, key: string, value: any) {
        const id = typeof node === 'string' ? node : node && node._id;
        if (id) tree.setField(id, key, value);
      },
      writeSource: (field, value) => tree.setSource(field, value),
    }),
  }), [tree, query, tree.source]);

  // ---------- 数据加载 ----------
  const refreshTemplateDetail = useCallback(async () => {
    try {
      if (!template_id) return;
      tree.setKV('loading', true);
      const resp = await apis.getTemplateComponents(template_id);
      // normalizeTree 一次性把 $origin 基线、order、tree_id、accepts 归一化
      const data = normalizeTree(resp.data as any, typeAccepts);
      setTitle(page.path, resp.data.title)
      tree.setKV('template_id', template_id);
      tree.load(data);
      // 换页/刷新后原来编辑的节点已经不存在了，别留着 id 指向空气
      statusRef.current.editNodeId = '';
      tree.setKV('loading', false);
    } catch (err) {
      tree.setKV('loading', false);
      console.log(err);
    }
  }, [template_id, tree]);

  useEffect(() => {
    refreshTemplateDetail();
  }, [template_id]);

  // ---------- 编辑器状态同步（工具栏保存按钮靠这个）----------
  useEffect(() => {
    editorStatus.save = () => tree.save();
    const dispose = autorun(() => {
      editorStatus.dirtyCount = tree.dirtyCount;
      editorStatus.saving = tree.saving;
    });
    return () => {
      dispose();
      editorStatus.save = async () => { };
    };
  }, [editorStatus, tree]);

  // 交给外层：ref 直连，实例作用域
  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = tree;
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, tree]);

  const contextmenu = useMemo(() => proxy({
    id: '',
    x: 0,
    y: 0,
    open(id: string, x: number, y: number) {
      this.id = id;
      this.x = x;
      this.y = y;
    },
    close() {
      this.id = '';
    },
  }), [template_id]);

  /**
   * 右键回调：打开菜单。
   *
   * 目标 id 从 handle 元素上读：NodeWrapper 的 nodeHandleRef 会给 .node-handle
   * 注入 data-node-id（id 只挂在 root 上，而右键发生在 handle 上）；
   * 万一某些组件把右键挂到了别处，再向上找最近的节点 root 兜底。
   */
  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();  // 阻止冒泡到父节点
      const el = e.currentTarget as HTMLElement;
      const anchor = el.dataset?.nodeId
        ? el
        : (el.closest?.('[data-node-id]') as HTMLElement | null);
      const nodeId = anchor?.dataset?.nodeId || '';
      if (nodeId) {
        contextmenu.open(nodeId, e.clientX, e.clientY);
      }
    },
    [contextmenu]
  );

  const menuAction = useCallback((action: MenuAction) => {
    const id = action.nodeId;
    if (!id || !tree.map.get(id)) return;

    if (action.kind === 'edit') {
      // 选中 → EditorView 那边据此从树里取节点，交给 EditorPanel
      statusRef.current.editNodeId = id;
      statusRef.current.editNodeTab = action.tab || 'base';
      return;
    }

    if (action.kind === 'append') {
      if (!action.type) return;
      const parent = tree.map.get(id);
      if (!parent) return;
      const node = tree.createAndInsert(id, parent.children.length, action.type);
      if (node) {
        // 新建完直接把编辑面板开到这个新节点上
        statusRef.current.editNodeId = node._id;
        statusRef.current.editNodeTab = 'base';
      }
      return;
    }

    if (action.kind === 'delete') {
      // 删的可能是整棵子树，而面板里正在编辑的节点可能就在这棵子树里。
      // 不关掉的话 editNodeId 会指向一个已死的节点，EditorPanel 会继续渲染它 ——
      // 读 node.title / node._id 就会触发 MST 的
      // "You are trying to read or write to an object that is no longer part of a state tree"。
      // （collectSubtree 要在 remove 之前取：节点一删就查不到了）
      const editing = statusRef.current.editNodeId;
      if (editing && tree.collectSubtree(id).indexOf(editing) !== -1) {
        statusRef.current.editNodeId = '';
      }
      tree.remove(id);
    }
  }, [tree]);

  // ---------- 树根（template 壳）的选中框 ----------
  // rootId === template_id，也就是树的根就是下面那个壳 div —— 它没有 React 组件
  // 承载，走不了 NodeWrapper 那一套，所以这里单独盯 DOM 属性。
  // 用 effect + subscribe 而不是 state：标记跟着鼠标高频变化，
  // 走 state 会把整个渲染器（连带画布上所有节点）重渲染。
  const shellRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const update = () => {
      const mark = mode !== 'edit' ? ''
        : editorStatus.currNodeId === tree.rootId ? (editorStatus.dragging ? 'drag' : 'curr')
          : editorStatus.editNodeId === tree.rootId ? 'edit'
            : '';
      if (el.dataset.mark === mark) return;
      if (mark) el.dataset.mark = mark;
      else delete el.dataset.mark;
    };
    update();
    return subscribe(editorStatus, update);
  }, [editorStatus, tree, mode]);

  const rootNodes = tree.rootId ? tree.getChildren(tree.rootId) : [];

  return <ModeContext.Provider value={mode}>
    <PageContext.Provider value={page}>
      <TreeContext.Provider value={tree}>
        {/* 选中框（edit / curr / drag 三种配色）靠它驱动，NodeWrapper 消费 */}
        <EditorStatusContext.Provider value={editorStatus}>
          {/* 数据环境：source 快照 + query 域 + 写入通道。子树靠 <SourceScope> 覆盖 */}
          <DataEnvContext.Provider value={env}>
            <ContextMenuContext.Provider value={contextmenu}>
              <div
                ref={shellRef}
                // position: relative 是给选框的 ::after 当定位基准用的
                // （inline 的 display: flex 会盖掉 .node 里那条，这里不受影响）
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }}
                data-node-id={template_id}
              >
                {rootNodes.map(c => (
                  <NodeWrapper key={c._id} self={c} onContextMenu={onContextMenu} />
                ))}
                {mode === 'edit' && <ContextMenuContent contextmenu={contextmenu} onAction={menuAction} />}
                {tree.loading && <Spin fullscreen spinning />}
              </div>
            </ContextMenuContext.Provider>
          </DataEnvContext.Provider>
        </EditorStatusContext.Provider>
      </TreeContext.Provider>
    </PageContext.Provider>
  </ModeContext.Provider>
}));
