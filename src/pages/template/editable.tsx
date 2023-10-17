import React, { Fragment, useCallback, useEffect } from 'react';
import { Button, Space, Select, Image, Divider, Switch, Spin, message } from 'antd';
import { Observer, useLocalObservable } from 'mobx-react';
import { IComponent, ITemplate } from '@/types'
import apis from '@/api'
import { useEffectOnce } from 'react-use';
import store from '@/store';
import { AlignAside, FullWidth, FullWidthFix, FullWidthAuto, FullHeight, FullHeightFix } from '@/components/style'
import { Wrap, Card } from './style';
import Auto from '../../groups/auto'
import { ComponentItem } from '@/store/component';
import { LoadingOutlined } from '@ant-design/icons';

function getDiff(t: ITemplate | IComponent | null) {
  if (!t) {
    return [];
  }
  const results: IComponent[] = [];
  if (t.children) {
    t.children.forEach((child) => {
      const diff = child.diff()
      if (diff) {
        results.push((child as IComponent).toJSON())
      }
      const subResults = getDiff(child);
      if (subResults.length) {
        results.push(...subResults)
      }
    })
  }
  return results;
}

const ComponentTemplatePage = ({ t }: { t?: number }) => {
  const local = useLocalObservable<{
    mode: string,
    loading: boolean,
    fetching: boolean,
    temp: IComponent | null,
    edit_template_id: string,
    templates: ITemplate[],
    types: { name: string, value: string }[],
    selectedProjectId: string,
    TemplatePage: null | (ITemplate),
  }>(() => ({
    mode: 'edit',
    loading: true,
    fetching: false,
    templates: [],
    temp: null,
    selectedProjectId: '',
    edit_template_id: '',
    types: [],
    TemplatePage: null,
  }))
  const refresh = useCallback(async () => {
    local.loading = true;
    try {
      const result = await apis.getTemplates({ query: { project_id: store.app.project_id } })
      if (result.code === 0) {
        local.templates = result.data.items
        store.app.setEditComponentId('')
        if (local.templates.length) {
          if (!local.edit_template_id) {
            local.edit_template_id = local.templates[0]._id;
          }
          const resp = await apis.getTemplateComponents(local.edit_template_id)
          const { children, ...template } = resp.data
          const components = children.map(child => ComponentItem.create(child))
          local.TemplatePage = { ...template, children: components }
        }
      }
    } catch (e) {
      console.log(e)
    } finally {
      local.loading = false;
    }
  }, [])
  useEffect(() => {
    store.component.types.map(item => ({ name: item.title, value: item.name }))
  }, [t])
  useEffectOnce(() => {
    refresh()
  })
  return (<Observer>{() => <Fragment>
    <FullWidth style={{ flex: 1, overflowY: 'auto' }}>
      <FullWidthAuto style={{ flex: '120px 0 0' }}>
        <Wrap>
          {store.component.types.map(item => (<Card draggable key={item._id}
            onDragStartCapture={() => {
              store.app.setDragType(item.name);
            }}
            onDragEndCapture={() => {
              store.app.setDragType('')
            }}>
            <Image style={{ width: 24, height: 24 }} draggable={false} src={store.app.imageLine + item.cover} preview={false}
            />
            <div>{item.title}</div>
          </Card>))}
        </Wrap>
      </FullWidthAuto>
      <FullWidthAuto style={{ height: '100%' }}>
        <FullHeight>
          <FullHeightFix>
            <AlignAside style={{ padding: 10, width: '100%', justifyContent: 'center' }}>
              <Space>
                <Select value={local.edit_template_id} onChange={v => {
                  local.edit_template_id = v;
                  refresh()
                }}>
                  {local.templates.map(it => <Select.Option key={it._id} value={it._id}>{it.title}</Select.Option>)}
                </Select>
              </Space>
              <Divider type="vertical" />
              <Space>
                < Button type="primary" onClick={e => {
                  refresh()
                }}>刷新</Button>
              </Space>
              <Divider type="vertical" />
              <Switch checked={local.mode === 'edit'} onChange={v => { local.mode = v ? 'edit' : 'preview' }} />{local.mode === 'edit' ? '编辑' : '预览'}
            </AlignAside>
          </FullHeightFix>
          <FullWidthAuto>
            {local.loading ? <Spin style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center', height: 300, }} indicator={<LoadingOutlined />} tip="加载中..." /> : <Auto template={local.TemplatePage} mode={local.mode} />}
          </FullWidthAuto>
          <FullHeightFix style={{ justifyContent: 'center', paddingBottom: 10 }}>
            <Button type="primary" onClick={async () => {
              const diff = getDiff(local.TemplatePage);
              if (diff.length) {
                try {
                  local.fetching = true
                  await apis.batchUpdateComponent({ body: diff })
                  await refresh()
                } catch (e) {
                  console.log(e)
                } finally {
                  local.fetching = false
                }
              } else {
                message.warn('数据无变化')
              }
            }}>保存</Button>
          </FullHeightFix>
        </FullHeight>
      </FullWidthAuto>
    </FullWidth>
  </Fragment >}</Observer >);
};

export default ComponentTemplatePage;