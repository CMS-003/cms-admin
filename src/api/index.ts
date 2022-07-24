import shttp from "../utils/shttp";
import constant from '../constant'
import store from '../store'
import { Component, ComponentType } from '../types'
import user from './user'

export default {
  getMenu: async () => {
    const result: any = await shttp.get('/api/v1/user/menu');
    return result
  },
  getComponentTemplates: async () => {
    const result: any = await shttp.get('/api/v1/component-templates');
    return result
  },
  getComponents: async () => {
    const result: any = await shttp.get('/api/v1/components');
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