import shttp from "../utils/shttp";
import user from './user'
import config from './config'
import component from './component'
import project from './project'
import template from './template'
import componentType from './component-type'
import { Component } from "@/types";

const apis = {
  getMenu: async () => {
    const result: any = await shttp.get('/api/v1/users/menu');
    return result
  },
  getBoot: async () => {
    // component-type,projects,admin template
    const templateResult = await shttp.get<Component>('/api/v2/templates/admin/components');
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