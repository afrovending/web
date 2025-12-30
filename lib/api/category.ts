import Category from "@/interfaces/category";
import api from "./axios";

export async function listCategories(
  limit: number,
  offset: number,
  search?: string,
  type?: string,
  status?: string
) {
  const response = await api.get("/categories", {
    params: {
      limit,
      offset,
      ...(search ? { search } : {}),
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    },
  });

  const { categories, banner } = response.data;
  return { categories, banner };
}

export async function getCategoryWithChildren(
  type: string,
  slug: string
): Promise<{ parent: Category; children: Category[] }>
{
console.log("Fetching category with children:", { type, slug });

  if (!type || !slug) throw new Error("Type and slug are required");

  const response = await api.get("/subcategories", {
    params: { type, slug },
  });

  if (response.data.status !== "success") {
    throw new Error(response.data.message);
  }

  return {
    parent: response.data.parent,
    children: response.data.children || [],
  };
}


export async function getCategoryItems(category_slug: string) {
  const response = await api.get(`/category/products/${category_slug}`);
  return response.data;
}
