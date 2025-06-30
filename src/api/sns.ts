import shttp from "../utils/shttp";
import { ISNS } from '../types'

const apis = {
  getSNS: async () => {
    const result = await shttp.get<ISNS>('/gw/api/v1/users/sns');
    return result
  },
  createSNS: async ({ body }: { body: ISNS }) => {
    const result: any = await shttp.put('/gw/api/v1/users/sns/' + body.sns_type, body);
    return result;
  },
  destroySNS: async ({ body }: { body: Partial<ISNS> }) => {
    await shttp.post(`/gw/api/v1/users/sns/${body.sns_type}/cancel`);
  }
}

export default apis