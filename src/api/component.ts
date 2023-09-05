import shttp, { BaseResultWrapper, BaseResultsWrapper } from "../utils/shttp";
import store from '../store'
import { Component } from '../types'

const apis = {
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
}

export default apis;