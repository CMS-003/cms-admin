export * from "./user"
export * from "./menu"
export * from "./component"
export * from "./project"

export type Template = {
  _id: string;
  project_id: string;
  title: string;
  name: string;
  desc: string;
  cover: string;
  type: string;
  path: string;
  attrs: object;
  available: boolean;
  order: number;
}