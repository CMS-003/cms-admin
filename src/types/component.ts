import { string } from "mobx-state-tree/dist/internal";

export type Component = {
  id?: string;
  parent_id?: string;
  tree_id?: string;
  title?: string;
  name?: string;
  cover?: string;
  desc?: string;
  available?: string;
  createdAt?: Date;
  updatedAt?: Date;
  accepts?: string[];
}