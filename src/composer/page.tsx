import { useCallback, useState } from 'react';

import { Button, Space, Select, Image, Divider, Switch, Spin, message, TreeSelect, notification, } from 'antd';
import { AlignAside } from '@/components/style'
import apis from '@/api'

import { TemplateView } from './TemplateView';
import { createEditorStatus } from './status';

import './styles.css';
import store from '../store';
import { ITemplate } from '@/types';
import { useEffectOnce } from 'react-use';
import { groupBy, isEmpty } from 'lodash-es';
import { useLocalProxy, useProxySelector } from '@/utils/valtio';
import { DataNode } from 'antd/es/tree';

type PageTreeNode = {
  value: string;
  title: string;
  selectable?: boolean;
  children: PageTreeNode[];
}
export default function Composer(props: any) {
  const [snap, proxy] = useLocalProxy({
    locked: false,
    pageTree: [] as PageTreeNode[],
    template_id: '',
    loading: true,
    mode: 'edit' as 'edit' | 'preview',
  })

  // 编辑器状态（脏数据数量 / 保存中）。由这里创建、往下传给 TemplateView → TView，
  // 这样工具栏上的保存按钮能按 dirtyCount 高亮，而嵌套的 TView 用的是各自的状态。
  const [status] = useState(() => createEditorStatus());
  // 只订阅这两个字段：status 里还有 currNodeId / dragging（鼠标划过时高频变化），
  // 整体 useSnapshot 会让整个工具栏每次 hover 都重渲染
  const dirtyCount = useProxySelector(status, s => s.dirtyCount) ?? 0;
  const saving = useProxySelector(status, s => s.saving) ?? false;

  // 获取模板页
  const refreshTemplates = useCallback(async () => {
    try {
      const result = await apis.getTemplates({ query: { project_id: store.app.project_id } })
      const templates: ITemplate[] = result.data.items;
      const trees: PageTreeNode[] = [];

      const types = [
        { type: 'Dynamic', title: '动态页' },
        { type: 'page', title: '列表页' },
        { type: 'form', title: '表单页' },
      ]
      const appTree: PageTreeNode = {
        value: 'app',
        title: '应用',
        selectable: false,
        children: []
      }
      templates.forEach(t => {
        if (t.type === 'app') {
          appTree.children.push({ title: t.title, value: t._id, children: [] });
        }
      });
      trees.push(appTree);
      store.project.list.forEach(p => {
        const o = groupBy(templates.filter(t => t.project_id === p._id && t.type !== 'app'), 'type')
        const typeTree: PageTreeNode = {
          value: p._id,
          title: p.title + ' ' + p.name,
          selectable: false,
          children: []
        }
        if (!isEmpty(o)) {
          types.forEach(tt => {
            if (o[tt.type]) {
              typeTree.children.push({
                value: `${p._id}|${tt.type}`,
                title: tt.title,
                selectable: false,
                children: o[tt.type].map(t => ({ value: t._id, title: t.title, children: [] })),
              });
            }
          });
          trees.push(typeTree);
        }
      })
      proxy.pageTree = trees;
      if (!proxy.template_id && templates.length !== 0) {
        proxy.template_id = templates[0]._id;
      }
      proxy.loading = false;
    } catch (err) {

    }
  }, []);
  useEffectOnce(() => {
    const template_id = new URLSearchParams(props.path.split('?')[1] || '').get('id') || '';
    if (template_id) {
      proxy.template_id = template_id
      proxy.locked = true;
    }
    refreshTemplates()
  })
  return (
    <div
      style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <AlignAside style={{ padding: 10, width: '100%', justifyContent: 'center' }}>
        <Space>
          <TreeSelect
            disabled={snap.locked}
            treeData={snap.pageTree as unknown as DataNode[]}
            value={snap.template_id}
            style={{ width: 300 }}
            onChange={(v: string) => {
              proxy.template_id = v;
            }}
            treeDefaultExpandAll
          />
        </Space>
        <Divider orientation="vertical" />
        <Space>
          < Button type="primary" loading={snap.loading} onClick={() => {
            refreshTemplates()
          }}>刷新</Button>
        </Space>
        <Divider orientation="vertical" />
        <Switch checked={snap.mode === 'edit'} onChange={v => { proxy.mode = (v ? 'edit' : 'preview') }} />{snap.mode === 'edit' ? '编辑' : '预览'}
        <Divider orientation="vertical" />
        <Space>
          < Button type="primary" onClick={async () => {
            apis.clearTemplateCache(snap.template_id).then((result) => {
              if (result.code === 0) {
                notification.success({ title: `缓存清理成功` })
              } else {
                notification.error({ title: `请求失败 ${result.message}` })
              }
            }).catch(err => {
              notification.error({ title: `请求失败 ${err.message}` })
            })
          }}>清除缓存</Button>
        </Space>
        <Divider orientation="vertical" />
        {/* 有变更时高亮并且可点；没有变更时禁用。提交走 batchUpdateComponent / batchDestroyComponent */}
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
              // TView 里已经弹过错误提示了
            }
          }}
        >
          保存{dirtyCount > 0 ? ` (${dirtyCount})` : ''}
        </Button>
      </AlignAside>
      <TemplateView
        template_id={snap.template_id}
        mode={snap.mode}
        path=""
        close={() => { }}
        status={status}
      />
    </div>
  );
}
