import shttp from "../utils/shttp";
import { ITemplate } from '../types'

const apis = {
  getTemplates: async (prop: { query?: { [key: string]: any } }) => {
    let qs = [];
    for (let key in prop.query) {
      qs.push(`${key}=${prop.query[key]}`)
    }
    const result: any = await shttp.get('/api/v1/templates?' + qs.join('&'));
    return result
  },
  addTemplate: async ({ body }: { body: ITemplate }) => {
    const result: any = await shttp.post('/api/v1/templates', body);
    return result;
  },
  updateTemplate: async ({ body }: { body: ITemplate }) => {
    const { _id, ...data } = body;
    const result: any = await shttp.put('/api/v1/templates/' + _id, data);
    return result;
  },
  getTemplateFields: async (template_id: String) => {
    const result: any = await shttp.get(`/api/v1/templates/${template_id}/fields`);
    return result;
  },
}

export default apis

