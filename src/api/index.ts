import shttp, { BaseResultWrapper, BaseResultsWrapper } from "../utils/shttp";
import constant from '../constant'
import store from '../store'
import { Component, ComponentType, Config, Project } from '../types'
import user from './user'

const apis = {
  getMenu: async () => {
    const result: any = await shttp.get('/api/v1/user/menu');
    return result
  },
  getConfig: async () => {
    const result: any = await shttp.get('/api/v1/config').header({ 'x-project_id': store.app.project_id || '' });
    return result
  },
  createConfig: async ({ body }: { body: Config }) => {
    const result: any = await shttp.post('/api/v1/component-templates', body);
    return result

  },
  updateConfig: async ({ body }: { body: Config }) => {
    const result: any = await shttp.put('/api/v1/component-templates', body);
    return result

  },
  getProjects: async <T>() => {
    const result = await shttp.get<BaseResultsWrapper<T>>('/api/v1/user/projects');
    return result
  },
  createProject: async ({ body }: { body: Project }) => {
    const result: any = await shttp.post('/api/v1/projects', body);
    return result;
  },
  updateProject: async ({ body }: { body: Project }) => {
    const result: any = await shttp.put('/api/v1/projects/' + body.id, body);
    return result;
  },
  getComponentTemplates: async () => {
    const result: any = await shttp.get('/api/v1/component-templates').header({ 'x-project_id': store.app.project_id || '' });
    return result
  },
  getComponents: async () => {
    const result: any = await shttp.get('/api/v1/components').header({ 'x-project_id': store.app.project_id || '' });
    return result
  },
  createComponent: async ({ body }: { body: Component }) => {
    const result: any = await shttp.post('/api/v1/components', body);
    return result
  },
  updateComponent: async ({ body }: { body: Component }) => {
    const result: any = await shttp.put(`/api/v1/components/${body.id}`, body)
    return result
  },
  destroyComponent: async ({ params }: { params: any }) => {
    const result: any = await shttp.delete(`/api/v1/components/${params.id}`)
    return result
  },
  getComponentTypes: async () => {
    const result: any = await shttp.get(`/api/v1/component-types`)
    return result
  },
  addComponentTypes: async ({ body }: { body: ComponentType }) => {
    const result: any = await shttp.post(`/api/v1/component-types`, body)
    return result
  },
  updateComponentTypes: async ({ body }: { body: ComponentType }) => {
    const result: any = await shttp.put(`/api/v1/component-types/${body.id}`, body)
    return result
  },
  destroyComponentTypes: async ({ params }: { params: any }) => {
    const result: any = await shttp.delete(`/api/v1/component-types/${params.id}`)
    return result
  },
  ...user,
}

export default apis;