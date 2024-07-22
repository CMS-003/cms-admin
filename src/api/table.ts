import shttp from "../utils/shttp";
import { ITable, ITableDetail, ITableView } from '../types'

const apis = {
  getTables: async () => {
    const result = await shttp.get<ITableDetail>(`/api/v1/tables/views`)
    return result
  },
  getTable: async (table: string) => {
    const result = await shttp.get<ITable>(`/api/tables/${table}`);
    return result;
  },
  getTableViews: async (table: string) => {
    const result = await shttp.get<ITable>(`/api/v1/tables/${table}/views`)
    return result
  },
  getTableViewDetail: async (params: { table: string, id: string }) => {
    const result = await shttp.get<ITable>(`/api/v1/tables/${params.table}/views/${params.id}`)
    return result
  },
  addTableView: async (body: { table: string, type: string }) => {
    const result: any = await shttp.post(`/api/v1/tables/${body.table}/views`, body)
    return result
  },
  updateTableView: async (body: ITableView) => {
    const { _id, table, ...data } = body;
    const result: any = await shttp.put(`/api/v1/tables/${table}/views/${_id}`, data);
    return result;
  },
  destroyTableView: async ({ _id, table }: { _id: string, table: string }) => {
    const result: any = await shttp.delete(`/api/v1/tables/${table}/views/${_id}`)
    return result
  },
}

export default apis