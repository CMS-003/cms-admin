import shttp, { BaseResultWrapper, BaseResultsWrapper } from "../utils/shttp";
import store from '../store'
import { Component, ComponentType, Project } from '../types'
import user from './user'
import config from './config'
import component from './component'
import project from './project'
import template from './template'
import componentType from './component-type'

const apis = {
  getMenu: async () => {
    const result: any = await shttp.get('/api/v1/users/menu');
    return result
  },
  ...config,
  ...component,
  ...project,
  ...template,
  ...componentType,
  ...user,
}

export default apis;