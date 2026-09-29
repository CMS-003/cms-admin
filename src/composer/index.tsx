import { useCallback } from 'react';

import { Button, Space, Select, Image, Divider, Switch, Spin, message, TreeSelect, notification, } from 'antd';
import { AlignAside, FullWidth, FullWidthAuto, FullHeight, FullHeightFix, FullHeightAuto } from '@/components/style'
import { Observer, useLocalObservable } from 'mobx-react';
import apis from '@/api'

import { TemplateView } from './NodeView';

import './styles.css';
import store from '../store';
import { ITemplate } from '@/types';
import { cast } from 'mobx-state-tree';
import { useEffectOnce } from 'react-use';
import { groupBy, isEmpty } from 'lodash-es';

type PageTreeNode = {
  value: string;
  title: string;
  selectable?: boolean;
  children: PageTreeNode[];
}
export default function Composer(props: any) {
  const local = useLocalObservable(() => ({
    locked: false,
    pageTree: cast([]),
    template_id: '',
    fetching: false,
    setPageTree(tree: PageTreeNode[]) {
      this.pageTree = tree;
    },
    setTemplateId(id: string, locked = false) {
      this.template_id = id;
      this.locked = locked;
    },
    mode: 'edit' as 'edit' | 'preview',
    setMode(mode: 'edit' | 'preview') {
      this.mode = mode
    }
  }))

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
      local.setPageTree(trees)
      if (!local.template_id && templates.length !== 0) {
        local.setTemplateId(templates[0]._id);
      }
    } catch (err) {

    }
  }, []);
  useEffectOnce(() => {
    const template_id = new URLSearchParams(props.path.split('?')[1] || '').get('id') || '';
    if (template_id) {
      local.setTemplateId(template_id, true)
    }
    refreshTemplates()
  })
  return (

    <Observer>{() => (
      <div
        style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        <AlignAside style={{ padding: 10, width: '100%', justifyContent: 'center' }}>
          <Space>
            <Observer>{() => (
              <TreeSelect
                disabled={local.locked}
                treeData={local.pageTree}
                value={local.template_id}
                style={{ width: 300 }}
                onChange={(v: string) => {
                  local.setTemplateId(v)
                }}
                treeDefaultExpandAll
              />
            )}</Observer>
          </Space>
          <Divider orientation="vertical" />
          <Space>
            < Button type="primary" onClick={() => {
              refreshTemplates()
            }}>刷新</Button>
          </Space>
          <Divider orientation="vertical" />
          <Switch checked={local.mode === 'edit'} onChange={v => { local.setMode(v ? 'edit' : 'preview') }} />{local.mode === 'edit' ? '编辑' : '预览'}
          <Space>
            < Button type="primary" onClick={async () => {
              apis.clearTemplateCache(local.template_id).then((result) => {
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
          <Button type="primary" block={false} onClick={async () => {
            local.fetching = true
          }}>保存</Button>
        </AlignAside>
        <TemplateView
          template_id={local.template_id}
          path=""
          mode={local.mode}
          close={() => { }}
        />


      </div>
    )}</Observer>
  );
}