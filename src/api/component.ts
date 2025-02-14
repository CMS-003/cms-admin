import shttp from "../utils/shttp";
import { IComponent } from '../types'
import QueryString from "qs";

const apis = {
  getComponents: async ({ query }: { query?: { [key: string]: any } }) => {
    let qs = [];
    for (let key in query) {
      qs.push(`${key}=${query[key]}`)
    }
    const result: any = await shttp.get('/api/v1/components?' + qs.join('&'));
    return result
  },
  createComponent: async ({ body }: { body: IComponent }) => {
    const result: any = await shttp.post('/api/v1/components', body);
    return result
  },
  updateComponent: async ({ body }: { body: IComponent }) => {
    const result: any = await shttp.put(`/api/v1/components/${body._id}`, body)
    return result
  },
  destroyComponent: async ({ params }: { params: any }) => {
    const result: any = await shttp.delete(`/api/v1/components/${params._id}`)
    return result
  },
  batchUpdateComponent: async ({ body }: { body: any }) => {
    return await shttp.post(`/api/v1/components/batch`, body)
  },
  batchDestroyComponent: async (query: any) => {
    return await shttp.delete(`/api/v1/components/batch?${QueryString.stringify(query)}`)
  }
}

export default apis;