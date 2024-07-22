import shttp from "../utils/shttp";
import { IWidget } from '../types'

const apis = {
  getWidgets: async () => {
    const result = await shttp.get<IWidget>(`/api/v1/widgets`)
    return result
  },
  addWidget: async ({ body }: { body: IWidget }) => {
    const result: any = await shttp.post(`/api/v1/widgets`, body)
    return result
  },
  updateWidget: async ({ body }: { body: IWidget }) => {
    const result: any = await shttp.put(`/api/v1/widgets/${body._id}`, body)
    return result
  },
  destroyWidget: async ({ params }: { params: any }) => {
    const result: any = await shttp.delete(`/api/v1/widgets/${params._id}`)
    return result
  },
}

export default apis