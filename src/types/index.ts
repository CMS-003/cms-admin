import { IComponent } from "./component"

export * from "./user"
export * from "./menu"
export * from "./component"
export * from "./project"
export * from "./resource"

export type ITemplate = {
  _id: string;
  project_id: string;
  title: string;
  name: string;
  desc: string;
  cover: string;
  type: string;
  path: string;
  attrs: object;
  style: object;
  available: boolean;
  order: number;
  children: IComponent[]
}