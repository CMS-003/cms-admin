import shttp from "../utils/shttp";
import { Template } from '../types'

const apis = {
  getTemplates: async (prop: { query?: { [key: string]: any } }) => {
    let qs = [];
    for (let key in prop.query) {
      qs.push(`${key}=${prop.query[key]}`)
    }
    const result: any = await shttp.get('/api/v1/templates?' + qs.join('&'));
    return result
  },
  addTemplate: async ({ body }: { body: Template }) => {
    const result: any = await shttp.post('/api/v1/templates', body);
    return result;
  },
  updateTemplate: async ({ body }: { body: Template }) => {
    const { _id, ...data } = body;
    const result: any = await shttp.post('/api/v1/templates/' + _id, data);
    return result;
  },
}

export default apis

