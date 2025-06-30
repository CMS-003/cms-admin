import shttp from "../utils/shttp";
import { IProject } from '../types'

const apis = {
  getProjects: async () => {
    const result = await shttp.get<IProject>('/gw/api/v1/projects');
    return result
  },
  createProject: async ({ body }: { body: IProject }) => {
    const result: any = await shttp.post('/gw/api/v1/projects', body);
    return result;
  },
  updateProject: async ({ body }: { body: IProject }) => {
    const result: any = await shttp.put('/gw/api/v1/projects/' + body._id, body);
    return result;
  },
  destroyProject: async ({ body }: { body: Partial<IProject> }) => {
    await shttp.delete(`/gw/api/v1/projects/${body._id}`);
  }
}

export default apis