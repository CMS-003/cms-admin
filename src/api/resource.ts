import shttp from "../utils/shttp";

export type IResource = {
  _id: string;
  title?: string;
  cover?: string;
}

const Resource = {
  getResources: async ({ search, page }: { search?: string, page?: number }) => {
    const result = await shttp.get<IResource>(`/api/v1/resources?search=${search}&page=${page}`);
    return result
  },
}
export default Resource;