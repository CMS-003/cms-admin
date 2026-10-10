import { useEffect, useRef, useState } from 'react';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { PointerSensor, PointerActivationConstraints } from '@dnd-kit/dom';

import store from '@/store';
import type { TreeStoreInstance } from '@/store/tree';
import { useLocalProxy, useProxySelector } from '@/utils/valtio';
import { createEditorStatus } from '@/context';
import type { EditorStatus } from '@/types';

import { TemplateView } from './TemplateView';
import { EditorPanel } from './EditorPanel';
import { Palette } from './Palette';
import { createDragStore } from './dnd/dragStore';

/**
 * 该元素是否允许发起拖拽。
 * 命中 [data-no-dnd] 的祖先（如 GridCell、react-grid-layout 容器）时禁止拖动。
 */
function shouldHandleEvent(element: Element | null): boolean {
  let cur: Element | null = element;
  while (cur) {
    const dataset = (cur as HTMLElement).dataset;
    if (dataset && dataset.noDnd) {
      return false;
    }
    cur = cur.parentElement;
  }
  return true;
}

export type EditorViewProps = {
  template_id: string;
  mode: 'edit' | 'preview';
  path: string;
  close: Function;
  /**
   * 编辑器状态（脏数据数量 / 保存 / 当前编辑节点）。
   * 由「需要工具栏的那一层」（EditorPage）创建后传进来；不传就自己造一份。
   */
  status?: EditorStatus;
};

/**
 * 编辑器：组件库 + 画布 + 属性面板 + 拖拽。
 *
 * 只做编辑这一件事 —— 模板的渲染交给 `<TemplateView>`（弹框和动态页复用同一个组件），
 * 拖拽交给 `dnd/`。这里负责把两者接起来：树 store 通过 ref 从 TemplateView 拿回来，
 * 落点写进编辑器状态驱动画布上的选框，松手时调树的 move / createAndInsert。
 */
export function EditorView({ template_id, mode, path, close, status }: EditorViewProps) {
  // 编辑器状态在「需要工具栏的那一层」创建，嵌套实例共用不了同一份。
  // 这里也要读 editNodeId 来渲染 EditorPanel，所以必须有兜底的那一份。
  const [ownStatus] = useState(() => createEditorStatus());
  const editorStatus = status ?? ownStatus;

  // 只订阅这两个值。status 里还有 currNodeId / dragging（鼠标划过高频变化），
  // 整体 useSnapshot 会让整个 EditorView 连带 EditorPanel 跟着重渲染
  const editNodeId = useProxySelector(editorStatus, s => s.editNodeId) ?? '';
  const editNodeTab = useProxySelector(editorStatus, s => s.editNodeTab) ?? 'base';

  // canvas 既是 DragOverlay 的挂载点，也是 hitTest 的坐标原点
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // ---------- 拖拽预览 ----------
  // 被拖元素 DOM 的深拷贝，和它要挂进去的宿主节点。
  // 克隆体是原生 DOM，塞进 valtio proxy 会被包成 proxy 而炸掉，所以只能走 ref。
  const previewRef = useRef<HTMLElement | null>(null);
  const previewHostRef = useRef<HTMLDivElement | null>(null);

  // TemplateView 挂载后把树 store 交到这里（实例作用域，不走全局事件）
  const treeRef = useRef<TreeStoreInstance | null>(null);

  // 拖拽状态机（量容器 / 命中测试 / 落点 / 松手时改树），细节见 dnd/dragStore.ts
  const [editorState, editorStore] = useLocalProxy(createDragStore({
    status: editorStatus,
    treeRef,
    canvasRef,
    previewRef,
  }));

  /**
   * 把拖拽预览的克隆体挂进 DragOverlay。
   *
   * 这里**故意不写依赖数组**：宿主 div 是 DragOverlay 的 children，
   * 而它只在「有 source」时才会渲染出来 —— 宿主挂载和「dragStart 里抓克隆」
   * 不在同一个 effect 周期里。每次 commit 都试挂一遍最稳：
   * 宿主一出现就挂上，已经挂好（firstChild 就是它）就直接跳过，开销可以忽略。
   *
   * 克隆体是原生 DOM，React 渲染不了，只能手动 appendChild。
   */
  useEffect(() => {
    const host = previewHostRef.current;
    const el = previewRef.current;
    if (!host || !el || host.firstChild === el) return;
    host.replaceChildren(el);
  });

  // 当前编辑的节点：只存 id，节点对象每次从树里取 ——
  // 取到的是 MST 节点实例，EditorPanel 是 observer，改数据面板能跟着刷新。
  const selectedNode = editNodeId && treeRef.current
    ? (treeRef.current.getNode(editNodeId) ?? null)
    : null;

  return (
    <>
      <DragDropProvider
        sensors={
          [
            PointerSensor.configure({
              activationConstraints: [
                new PointerActivationConstraints.Distance({ value: 8 })
              ],
            }),
          ]}
        // 迁移自旧版 CustomMouseSensor：命中 [data-no-dnd] 的元素不允许发起拖拽
        onBeforeDragStart={e => {
          if (!shouldHandleEvent(e.operation.source?.element ?? null)) {
            e.preventDefault();
          }
        }}
        onDragStart={e => editorStore.dragStart(e)}
        onDragMove={e => editorStore.dragMove(e)}
        onDragEnd={() => editorStore.dragEnd()}
      >
        <div className="app">
          {mode === 'edit' && <Palette types={store.component.types} loading={store.component.typesLoading} />}
          <div className='canvas' ref={canvasRef} style={{ boxShadow: 'inset 0 0 10px #1890ff' }}>
            <TemplateView
              template_id={template_id}
              path={path}
              mode={mode}
              close={close}
              apiRef={treeRef}
              status={editorStatus}
            />
            {mode === 'edit' && editorState.indicator && (
              <div
                className="drop-indicator-wrap"
                style={{
                  left: editorState.indicator.left,
                  top: editorState.indicator.top,
                  width: editorState.indicator.width,
                  height: editorState.indicator.height,
                }}
              >
                {/* key 变化 → 内层重挂载 → pop 动画重播 */}
                <div
                  className="drop-indicator-inner"
                  key={`${editorState.drop!.containerId}:${editorState.drop!.index}`}
                />
              </div>
            )}
            {/* 落点容器的高亮不再由这里盖一层算出来的矩形，改由落点节点自己的
                .node[data-mark='drag']::after 画 —— Table / GridLayout 这类
                自定义子结构的实际边界只有节点自己知道 */}
          </div>
          {mode === 'edit' && selectedNode && <EditorPanel
            // 换节点就重挂载，面板里的 tab / 弹窗状态跟着重置
            key={selectedNode._id}
            node={selectedNode}
            tabKey={editNodeTab}
            onChange={(field, value) => {
              const id = editorStatus.editNodeId;
              if (id) treeRef.current?.setField(id, field, value);
            }}
            onClose={() => { editorStatus.editNodeId = ''; }}
          />}
          {/* 拖拽预览：内容是 dragStart 时克隆的源元素 DOM，由上面那个 effect
              挂进这个宿主 div。dnd-kit 会把 overlay 自身定成和源元素一样大并
              跟着指针走，所以这里只需要一个撑满的宿主 + 让克隆体贴满它
              （样式见 styles.css） */}
          <DragOverlay dropAnimation={null}>
            <div ref={previewHostRef} className="drag-preview-host" />
          </DragOverlay>
        </div>
      </DragDropProvider>
    </>
  )
}
