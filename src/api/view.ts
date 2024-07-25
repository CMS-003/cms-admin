import shttp from "../utils/shttp";
import { ITableView } from '../types'
import qs from "qs";

const apis = {
  getViewDetail: async (id: string, query: { [key: string]: string | number }) => {
    const result = await shttp.get<ITableView>(`/api/v1/views/${id}?${qs.stringify(query)}`)
    return result
  },
}

export default apis