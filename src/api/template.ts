import shttp from "../utils/shttp";
import { ITemplate } from '../types'
import qs from 'qs'

const apis = {
  getTemplates: async (prop: { query?: { [key: string]: any } }) => {
    const result: any = await shttp.get('/api/v1/templates?' + qs.stringify(prop.query));
    return result
  },
  addTemplate: async ({ body }: { body: ITemplate }) => {
    const result: any = await shttp.post('/api/v1/templates', body);
    return result;
  },
  delTemplate: async (template_id: String) => {
    const result: any = await shttp.delete(`/api/v1/templates/${template_id}`);
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

