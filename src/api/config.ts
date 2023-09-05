import shttp from "../utils/shttp";
import store from '../store'
import { Config } from '../types'

const config = {
  getConfig: async () => {
    const result: any = await shttp.get('/api/v1/configs').header({ 'x-project_id': store.app.project_id || '' });
    return result
  },
  createConfig: async ({ body }: { body: Config }) => {
    const result: any = await shttp.post('/api/v1/configs', body);
    return result

  },
  updateConfig: async ({ body }: { body: Config }) => {
    const result: any = await shttp.put(`/api/v1/configs/${body._id}`, body);
    return result

  },
}
export default config;