import shttp, { BaseResultWrapper, BaseResultsWrapper } from "../utils/shttp";
import { ComponentType } from '../types'

const apis = {
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
}

export default apis