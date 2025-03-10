import shttp from "../utils/shttp";
import { ISchema, IJsonSchema, IResource } from '../types'
import qs from 'qs'

const apis = {
  getSchemaAll: async () => {
    const result = await shttp.get<ISchema>(`/api/v1/schemas`)
    return result
  },
  getSchemaInfo: async (name: string) => {
    const result = await shttp.get<IJsonSchema>(`/api/v1/schemas/${name}`);
    return result;
  },
  createSchema: async (name: string, data: any) => {
    const result = await shttp.post(`/api/v1/schemas/${name}`, data);
    return result;
  },
  updateSchema: async (name: string, data: any) => {
    const result = await shttp.put(`/api/v1/schemas/${name}`, data);
    return result;
  },
  getSchemaFields: async (name: string) => {
    const result = await shttp.get<{ field: string, type: string }[]>(`/api/v1/schemas/${name}/fields`);
    return result;
  },
  getDataList: async (url: string, query: { [key: string]: any } = {}) => {
    if (url.includes('?')) {
      const [path, params] = url.split('?');
      url = path;
      query = Object.assign({}, qs.parse(params), query);
    }
    const result = await shttp.get<IResource>(`${url}?${qs.stringify(query)}`)
    return result
  },
  getDataInfo: async (url: string, id: string) => {
    url = url.replace(':id', id);
    const result = await shttp.get<IResource>(url)
    return result
  },
  putData: async (url: string, data: Partial<IResource> & { _id: string }) => {
    url = url.replace(':id', data._id);
    const result = await shttp.put<IResource>(url, data);
    return result;
  },
  createData: async (url: string, data: any) => {
    const result = await shttp.post<IResource>(url.replace(':id', ''), data)
    return result
  },
  destroyData: async (url: string, id: string) => {
    url = url.replace(':id', id);
    const result = await shttp.delete<IResource>(url)
    return result
  },
}

export default apis