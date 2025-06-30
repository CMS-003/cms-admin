import shttp from "../utils/shttp";

export type IResource = {
  _id: string;
  title?: string;
  cover?: string;
}

const Resource = {
  getResources: async ({ search, page }: { search?: string, page?: number }) => {
    const result = await shttp.get<IResource>(`/gw/api/v1/public/manager/resources?search=${search}&page=${page}`);
    return result
  },
}
export default Resource;