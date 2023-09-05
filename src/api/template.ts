import shttp, { BaseResultWrapper, BaseResultsWrapper } from "../utils/shttp";
import { Template } from '../types'

const apis = {
  getTemplates: async () => {
    const result: any = await shttp.get('/api/v1/templates');
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

