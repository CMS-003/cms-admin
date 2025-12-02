import shttp from "../utils/shttp";
import { IConfig } from '../types'

const config = {
  getConfig: async (params: any) => {
    const result = await shttp.get<IConfig>('/gw/api/v1/configs?' + new URLSearchParams(params).toString());
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