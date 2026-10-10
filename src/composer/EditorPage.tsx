import { useCallback, useState } from 'react';
import { Button, Space, Divider, Switch, message, TreeSelect, notification } from 'antd';
import { useEffectOnce } from 'react-use';
import { groupBy, isEmpty } from 'lodash-es';
import type { DataNode } from 'antd/es/tree';

import apis from '@/api';
import store from '@/store';
import { AlignAside } from '@/components/style';
import type { ITemplate } from '@/types';
import { useLocalProxy, useProxySelector } from '@/utils/valtio';
import { createEditorStatus } from '@/context';

import { EditorView } from './EditorView';

/** 模板选择器里的一棵子树（模板 → 项目 → 类型 → 模板） */
type PageTreeNode = {
  value: string;
  title: string;
  selectable?: boolean;
  children: PageTreeNode[];
}

/** 按「应用 / 项目 → 类型」把模板列表铺成选择器的树 */
function buildPageTree(templates: ITemplate[]): PageTreeNode[] {
  const types = [
    { type: 'Dynamic', title: '动态页' },
    { type: 'page', title: '列表页' },
    { type: 'form', title: '表单页' },
  ];
  const trees: PageTreeNode[] = [];
  const appTree: PageTreeNode = { value: 'app', title: '应用', selectable: false, children: [] };
  templates.forEach(t => {
    if (t.type === 'app') {
      appTree.children.push({ title: t.title, value: t._id, children: [] });
    }
  });
  trees.push(appTree);
  store.project.list.forEach(p => {
    const grouped = groupBy(templates.filter(t => t.project_id === p._id && t.type !== 'app'), 'type');
    if (isEmpty(grouped)) return;
    const projectTree: PageTreeNode = {
      value: p._id,
      title: `${p.title} ${p.name}`,
      selectable: false,
      children: [],
    };
    types.forEach(tt => {
      if (!grouped[tt.type]) return;
      projectTree.children.push({
        value: `${p._id}|${tt.type}`,
        title: tt.title,
        selectable: false,
        children: grouped[tt.type].map(t => ({ value: t._id, title: t.title, children: [] })),
      });
    });
    trees.push(projectTree);
  });
  return trees;
}

/**
 * 可视化编辑页：模板选择 + 工具栏（刷新 / 清缓存 / 编辑预览切换 / 保存）+ 画布。
 *
 * 编辑器状态（脏数据 / 保存）在这里创建：工具栏的保存按钮要跟着 dirtyCount 走，
 * 而树在 `<EditorView>` → `<TemplateView>` 内部，层级差着两层，靠 context 打通。
 */
export default function EditorPage(props: { path?: string }) {
  const [snap, proxy] = useLocalProxy({
    locked: false,
    pageTree: [] as PageTreeNode[],
    template_id: '',
    loading: true,
    mode: 'edit' as 'edit' | 'preview',
  });

  // 只订阅这两个字段：status 里还有 currNodeId / dragging（鼠标划过时高频变化），
  // 整体 useSnapshot 会让整个工具栏每次 hover 都重渲染
  const [status] = useState(() => createEditorStatus());
  const dirtyCount = useProxySelector(status, s => s.dirtyCount) ?? 0;
  const saving = useProxySelector(status, s => s.saving) ?? false;

  const refreshTemplates = useCallback(async () => {
    try {
      const result = await apis.getTemplates({ query: { project_id: store.app.project_id } });
      const templates: ITemplate[] = result.data.items;
      proxy.pageTree = buildPageTree(templates);
      if (!proxy.template_id && templates.length !== 0) {
        proxy.template_id = templates[0]._id;
      }
      proxy.loading = false;
    } catch (err) {
      // 拉不到就保持空列表，用户点「刷新」重试
    }
  }, []);

  useEffectOnce(() => {
    // 地址栏带 id 就是「锁定到这个模板」，不允许在选择器里换
    const template_id = new URLSearchParams(props.path?.split('?')[1] || '').get('id') || '';
    if (template_id) {
      proxy.template_id = template_id;
      proxy.locked = true;
    }
    refreshTemplates();
  });

  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <AlignAside style={{ padding: 10, width: '100%', justifyContent: 'center' }}>
        <Space>
          <TreeSelect
            disabled={snap.locked}
            treeData={snap.pageTree as unknown as DataNode[]}
            value={snap.template_id}
            style={{ width: 300 }}
            onChange={(v: string) => { proxy.template_id = v; }}
            treeDefaultExpandAll
          />
        </Space>
        <Divider orientation="vertical" />
        <Space>
          <Button type="primary" loading={snap.loading} onClick={() => { refreshTemplates(); }}>刷新</Button>
        </Space>
        <Divider orientation="vertical" />
        <Switch
          checked={snap.mode === 'edit'}
          onChange={v => { proxy.mode = v ? 'edit' : 'preview'; }}
        />
        {snap.mode === 'edit' ? '编辑' : '预览'}
        <Divider orientation="vertical" />
        <Space>
          <Button type="primary" onClick={async () => {
            apis.clearTemplateCache(snap.template_id).then(result => {
              if (result.code === 0) {
                notification.success({ title: '缓存清理成功' });
              } else {
                notification.error({ title: `请求失败 ${result.message}` });
              }
            }).catch(err => {
              notification.error({ title: `请求失败 ${err.message}` });
            });
          }}>清除缓存</Button>
        </Space>
        <Divider orientation="vertical" />
        {/* 有变更时可点并高亮；没有变更时禁用。提交走 tree.save()
            （batchUpdateComponent / batchDestroyComponent，diff 已按 tree_id 归组） */}
        <Button
          type="primary"
          danger={dirtyCount > 0}
          disabled={dirtyCount === 0}
          loading={saving}
          style={{ minWidth: 90 }}
          onClick={async () => {
            try {
              await status.save();
              message.success('保存成功');
            } catch (e) {
              // save() 里已经弹过错误提示了
            }
          }}
        >
          保存{dirtyCount > 0 ? ` (${dirtyCount})` : ''}
        </Button>
      </AlignAside>
      <EditorView
        template_id={snap.template_id}
        mode={snap.mode}
        path=""
        close={() => { }}
        status={status}
      />
    </div>
  );
}
