import shttp from "../utils/shttp";
import { ISNS } from '../types'

const apis = {
  getSNS: async () => {
    const result = await shttp.get<ISNS>('/api/v1/users/sns');
    return result
  },
  createSNS: async ({ body }: { body: ISNS }) => {
    const result: any = await shttp.put('/api/v1/users/sns/' + body.sns_type, body);
    return result;
  },
  destroySNS: async ({ body }: { body: Partial<ISNS> }) => {
    await shttp.post(`/api/v1/users/sns/${body.sns_type}/cancel`);
  }
}

export default apis