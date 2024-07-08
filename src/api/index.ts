import shttp, { BaseResultWrapper } from "../utils/shttp";
import user from './user'
import config from './config'
import component from './component'
import project from './project'
import sns from './sns'
import template from './template'
import resource from './resource'
import componentType from './component-type'
import { IComponent, IComponentType, ILog, ITemplate } from "@/types";
import _ from 'lodash'
import qs from 'qs'

function fillAccepts(child: IComponent, map: { [key: string]: IComponentType }) {
  if (map[child.type]) {
    child.accepts = map[child.type].accepts;
  }
  if (child.children) {
    child.children.forEach(sun => fillAccepts(sun, map))
  }
}
const apis = {
  getTemplateComponents: async (template_id: string, page: number = 1, size: number = 10): Promise<BaseResultWrapper<ITemplate & { children: IComponent[] }>> => {
    const results = await shttp.get<ITemplate & { children: IComponent[] }>(`/api/v2/templates/${template_id}/components?page=${page}&size=${size}`);
    return new Promise((resolve, reject) => {
      import('../store').then(store => {
        if (store.default.component.types.length) {
          const map = _.keyBy(store.default.component.types, 'type')
          results.data.children.forEach(child => fillAccepts(child, map))
        }
        resolve(results)
      }).catch(e => {
        reject(e)
      })
    })

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
  getLogs: async (query: object) => {
    return await shttp.get<ILog>(`/api/v1/logs/system?${qs.stringify(query)}`)
  },
  ...config,
  ...component,
  ...project,
  ...template,
  ...componentType,
  ...user,
  ...resource,
  ...sns,
}

export default apis;