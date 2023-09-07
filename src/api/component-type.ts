import shttp from "../utils/shttp";
import { IComponentType } from '../types'

const apis = {
  getComponentTypes: async () => {
    const result = await shttp.get<IComponentType>(`/api/v1/component-types`)
    return result
  },
  addComponentTypes: async ({ body }: { body: IComponentType }) => {
    const result: any = await shttp.post(`/api/v1/component-types`, body)
    return result
  },
  updateComponentTypes: async ({ body }: { body: IComponentType }) => {
    const result: any = await shttp.put(`/api/v1/component-types/${body._id}`, body)
    return result
  },
  destroyComponentTypes: async ({ params }: { params: any }) => {
    const result: any = await shttp.delete(`/api/v1/component-types/${params._id}`)
    return result
  },
}

export default apis