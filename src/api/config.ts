import shttp from "../utils/shttp";
import { Config } from '../types'

const config = {
  getConfig: async () => {
    const result = await shttp.get<Config>('/api/v1/configs');
    return result
  },
  createConfig: async ({ body }: { body: Config }) => {
    const result = await shttp.post<Config>('/api/v1/configs', body);
    return result
  },
  updateConfig: async ({ body }: { body: Config }) => {
    const result = await shttp.put<Config>(`/api/v1/configs/${body._id}`, body);
    return result
  },
}
export default config;