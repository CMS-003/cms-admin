import shttp from "../utils/shttp";
import { Project } from '../types'

const apis = {
  getProjects: async <T>() => {
    const result = await shttp.get<T>('/api/v1/projects').then();
    return result
  },
  createProject: async ({ body }: { body: Project }) => {
    const result: any = await shttp.post('/api/v1/projects', body);
    return result;
  },
  updateProject: async ({ body }: { body: Project }) => {
    const result: any = await shttp.put('/api/v1/projects/' + body._id, body);
    return result;
  },
  destroyProject: async ({ body }: { body: Partial<Project> }) => {
    await shttp.delete(`/api/v1/projects/${body._id}`);
  }
}

export default apis