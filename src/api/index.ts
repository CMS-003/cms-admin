import shttp from "../utils/shttp";
import user from './user'
import config from './config'
import component from './component'
import project from './project'
import template from './template'
import componentType from './component-type'
import { IComponent, ITemplate } from "@/types";

const apis = {
  getTemplateComponents: async (template_id: string, page: number = 1, size: number = 10) => {
    return await shttp.get<ITemplate & { children: IComponent[] }>(`/api/v2/templates/${template_id}/components?page=${page}&size=${size}`);
  },
  getBoot: async () => {
    // component-type,projects,admin template
    const templateResult = await apis.getTemplateComponents('admin');
    const typesResult = await componentType.getComponentTypes();
    const projectsResult = await project.getProjects();
    return {
      tree: templateResult.data,
      types: typesResult.data,
      projects: projectsResult.data,
    }
  },
  ...config,
  ...component,
  ...project,
  ...template,
  ...componentType,
  ...user,
}

export default apis;