import shttp from "../utils/shttp";
import { IConfig } from '../types'
import qs from 'qs'

const config = {
  getConfig: async (params: object) => {
    const result = await shttp.get<IConfig>('/gw/api/v1/configs?' + qs.stringify(params));
    return result
  },
  createConfig: async ({ body }: { body: IConfig }) => {
    const result = await shttp.post<IConfig>('/gw/api/v1/configs', body);
    return result
  },
  updateConfig: async ({ body }: { body: IConfig }) => {
    const result = await shttp.put<IConfig>(`/gw/api/v1/configs/${body._id}`, body);
    return result
  },
  deleteConfig: async ({ body }: { body: Partial<IConfig> }) => {
    const result = await shttp.delete<IConfig>(`/gw/api/v1/configs/${body._id}`);
    return result
  }
}
export default config;