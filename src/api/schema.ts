import shttp from "../utils/shttp";
import { ISchema, IJsonSchema, IResource } from '../types'
import qs from 'qs'

const apis = {
  getSchemaAll: async () => {
    const result = await shttp.get<ISchema>(`/gw/api/v1/schemas`)
    return result
  },
  getSchemaInfo: async (name: string) => {
    const result = await shttp.get<IJsonSchema>(`/gw/api/v1/schemas/${name}`);
    return result;
  },
  createSchema: async (name: string, data: any) => {
    const result = await shttp.post(`/gw/api/v1/schemas/${name}`, data);
    return result;
  },
  updateSchema: async (name: string, data: any) => {
    const result = await shttp.put(`/gw/api/v1/schemas/${name}`, data);
    return result;
  },
  getSchemaFields: async (name: string) => {
    const result = await shttp.get<{ field: string, type: string }[]>(`/gw/api/v1/schemas/${name}/fields`);
    return result;
  },
  fetch: async<T>(method: string, url: string, data?: any) => {
    method = method.toLowerCase();
    if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
      throw new Error('NotSupportMethod')
    }
    const result = await shttp[method as 'get' | 'post' | 'put' | 'delete' | 'patch']<T | IResource>(url, data)
    return result;
  },
  getDataList: async <T>(url: string, query: { [key: string]: any } = {}) => {
    if (url.includes('?')) {
      const [path, params] = url.split('?');
      url = path;
      query = Object.assign({}, qs.parse(params), query);
    }
    const result = await shttp.get<T | IResource>(`${url}?${qs.stringify(query)}`)
    return result
  },
  getDataInfo: async (url: string) => {
    const result = await shttp.get<IResource>(url)
    return result
  },
}

export default apis