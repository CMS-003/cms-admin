import shttp from "../utils/shttp";
import { ITable, ITableDetail, IJsonSchema, ITableView, ITableWidget, IWidget, IResource } from '../types'
import qs from 'qs'
import { update } from "lodash";

const apis = {
  getTables: async () => {
    const result = await shttp.get<ITableDetail>(`/api/v1/tables/views`)
    return result
  },
  getTableSchema: async (name: string) => {
    const result = await shttp.get<IJsonSchema>(`/api/v1/tables/schemas/${name}`);
    return result;
  },
  createTableSchema: async (name: string, data: any) => {
    const result = await shttp.post(`/api/v1/tables/schemas/${name}`, data);
    return result;
  },
  updateTableSchema: async (name: string, data: any) => {
    const result = await shttp.put(`/api/v1/tables/schemas/${name}`, data);
    return result;
  },
  getTableFields: async (table: string) => {
    const result = await shttp.get<{ field: string, type: string }[]>(`/api/v1/tables/${table}/fields`);
    return result;
  },
  getInfo: async (url: string, id: string) => {
    url = url.replace(':id', id);
    const result = await shttp.get<IResource>(url)
    return result
  },
  putInfo: async (url: string, data: IResource) => {
    url = url.replace(':id', data._id);
    const result = await shttp.put<IResource>(url, data);
    return result;
  },
  getList: async (url: string, query: { [key: string]: any } = {}) => {
    if (url.includes('?')) {
      const [path, params] = url.split('?');
      url = path;
      query = Object.assign({}, qs.parse(params), query);
    }
    const result = await shttp.get<IResource>(`${url}?${qs.stringify(query)}`)
    return result
  },
  createData: async (table: string, data: any) => {
    const result = await shttp.post<{ _id: string }>(`/api/v1/tables/${table}/data`, data);
    return result;
  },
  updateData: async (table: string, data: { _id: string } & any) => {
    const result = await shttp.put(`/api/v1/tables/${table}/data`, data);
    return result;
  },
  destroyData: async (table: string, _id: string) => {
    const result = await shttp.delete(`/api/v1/tables/${table}/data/${_id}`);
    return result;
  },
  getTableViews: async (table: string) => {
    const result = await shttp.get<ITable>(`/api/v1/tables/${table}/views`)
    return result
  },
  getTableViewDetail: async (params: { table: string, id: string }) => {
    const result = await shttp.get<ITableView>(`/api/v1/tables/${params.table}/views/${params.id}`)
    return result
  },
  addTableView: async (body: { table: string, name: string, type: string, widgets: ITableWidget[] }) => {
    const result = await shttp.post<ITableView>(`/api/v1/tables/views`, body)
    return result
  },
  updateTableView: async (id: string, body: Partial<ITableView>) => {
    const { table, ...data } = body;
    const result: any = await shttp.put<ITableView>(`/api/v1/tables/${table}/views/${id}`, data);
    return result;
  },
  destroyTableView: async ({ _id, table }: { _id: string, table: string }) => {
    const result: any = await shttp.delete(`/api/v1/tables/${table}/views/${_id}`)
    return result
  },
}

export default apis