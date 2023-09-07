import React, { Fragment, useCallback, useEffect } from 'react';
import { Button, Space, Select, Image } from 'antd';
import { Observer, useLocalObservable } from 'mobx-react';
import { IComponent, ITemplate } from '@/types'
import apis from '@/api'
import { useEffectOnce } from 'react-use';
import store from '@/store';
import { AlignAside, FullWidth, FullWidthFix, FullWidthAuto } from '@/components/style'
import { Wrap, Card } from './style';
import Auto from '../../groups/auto'

const ComponentTemplatePage = ({ t }: { t?: number }) => {
  const local = useLocalObservable<{
    temp: IComponent,
    edit_template_id: string,
    templates: ITemplate[],
    types: { name: string, value: string }[],
    selectedProjectId: string,
    TemplatePage: null | ITemplate
  }>(() => ({
    templates: [],
    temp: {},
    selectedProjectId: '',
    edit_template_id: '',
    types: [],
    TemplatePage: null,
  }))
  const refresh = useCallback(async () => {
    const result = await apis.getTemplates({ query: { project_id: store.app.project_id } })
    if (result.code === 0) {
      local.templates = result.data.items
      if (local.templates.length) {
        if (!local.edit_template_id) {
          local.edit_template_id = local.templates[0]._id;
        }
        const components = await apis.getTemplateComponents(local.templates[0]._id)
        local.TemplatePage = components.data;
      }
    }
  }, [])
  useEffect(() => {
    store.component.types.map(item => ({ name: item.title, value: item.name }))
  }, [t])
  useEffectOnce(() => {
    refresh()
  })
  return (<Observer>{() => <Fragment>
    <AlignAside style={{ padding: 10, width: '100%', justifyContent: 'end' }}>
      <Space>
        <Select value={local.edit_template_id} onChange={v => {
          local.edit_template_id = v;
        }}>
          {local.templates.map(it => <Select.Option key={it._id} value={it._id}>{it.title}</Select.Option>)}
        </Select>
      </Space>
      <Space>
        < Button type="primary" onClick={e => {
          refresh()
        }}>刷新</Button>
      </Space>
    </AlignAside>
    <FullWidth style={{ flex: 1, overflowY: 'auto' }}>
      <FullWidthAuto style={{ flex: '80px 0 0' }}>
        <Wrap>
          {store.component.types.filter(item => item.level === 1).map(item => (<Card key={item._id}>
            <Image style={{ width: 24, height: 24 }} src={store.app.imageLine + item.cover} preview={false} />
            <div>{item.title}</div>
          </Card>))}
        </Wrap>
      </FullWidthAuto>
      <FullWidthAuto style={{ height: '100%' }}>
        <Auto template={local.TemplatePage} />
      </FullWidthAuto>
    </FullWidth>
  </Fragment>}</Observer>);
};

export default ComponentTemplatePage;