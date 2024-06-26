import shttp from "../utils/shttp";
import { IConfig } from '../types'

const config = {
  getConfig: async () => {
    const result = await shttp.get<IConfig>('/api/v1/configs');
    return result
  },
  createConfig: async ({ body }: { body: IConfig }) => {
    const result = await shttp.post<IConfig>('/api/v1/configs', body);
    return result
  },
  updateConfig: async ({ body }: { body: IConfig }) => {
    const result = await shttp.put<IConfig>(`/api/v1/configs/${body._id}`, body);
    return result
  },
  deleteConfig: async ({ body }: { body: Partial<IConfig> }) => {
    const result = await shttp.delete<IConfig>(`/api/v1/configs/${body._id}`);
    return result
  }
}
export default config;