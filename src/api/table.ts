import shttp from "../utils/shttp";
import { ITable, ITableDetail, ITableView, ITableWidget, IWidget } from '../types'

const apis = {
  getTables: async () => {
    const result = await shttp.get<ITableDetail>(`/api/v1/tables/views`)
    return result
  },
  getTableFields: async (table: string) => {
    const result = await shttp.get<{ field: string, type: string }[]>(`/api/v1/tables/${table}/fields`);
    return result;
  },
  getList: async (table: string, query?: { [key: string]: any }) => {
    const result = await shttp.get<ITable>(`/api/v1/tables/${table}/list`)
    return result
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