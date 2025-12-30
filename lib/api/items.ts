import api from "./axios";

interface ListItemsParams {
  limit: number;
  offset: number;
  search?: string;
  type?: string;
  status?: string;
  category?: string;
  direction?: "asc" | "desc";
  availability?: string;
}

export async function listItems(params: ListItemsParams) {
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(
      ([_, value]) => value !== undefined && value !== ""
    )
  );

  const response = await api.get("/items", {
    params: filteredParams,
  });

  return response.data;
}

export async function listSellerItems(
  limit?: number,
  offset?: number,
  search?: string
) {
  const response = await api.get("/vendor/items", {
    params: {
      limit,
      offset,
      ...(search ? { search } : {}),
    },
  });
  return response.data;
}

export async function getItemDetail(slug: string) {
  const response = await api.get(`/product/${slug}`);
  return response.data;
}

export async function listRecommendedItems(type?: string) {
  const response = await api.get(`/products/recommended`, {
    params: { type },
  });
  return response.data;
}

// Vendor Specific
export async function getItemStatictics() {
  const { data } = await api.get(`/vendor/items/statistics`);
  return data.data;
}

export async function updateItemStatus(productId: number, status: string) {
  const response = await api.patch(
    `/vendor/product/${productId}/status/${status}`
  );
  return response.data;
}

export async function addItem(formData: FormData) {
  const response = await api.post("/vendor/items/create", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function updateItem(ItemId: number, formData: FormData) {
  formData.append("_method", "PUT");
  const response = await api.post(`/vendor/items/update/${ItemId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function deleteItem(productId: number) {
  const { data } = await api.delete(`/vendor/items/delete/${productId}`);
  return data.data;
}

export async function deleteItemPhoto(
  productId: number | string,
  publicId: string
) {
  const { data } = await api.delete(`/vendor/items/image/delete/${productId}`, {
    data: {
      delete_public_ids: [publicId],
    },
  });

  return data.data;
}

export async function listSizes() {
  const response = await api.get("/vendor/list-sizes");
  return response.data.data;
}

export async function listColors() {
  const response = await api.get("/vendor/list-colors");
  return response.data.data;
}

export const upsertProductVariations = async (
  productId: number,
  variations: any[]
) => {
  const response = await api.post("/vendor/product/variation/upsert", {
    product_id: productId,
    variations: variations.map((v) => ({
      id: v.id || null,
      size_id: v.size_id || null,
      color_id: v.color_id || null,
      price: v.price,
      quantity: v.quantity,
      sku: v.sku || null,
    })),
  });
  return response.data;
};

export async function listSellerVariationItems(
  limit: number,
  offset: number,
  search: string
) {
  const response = await api.get("/vendor/items/variations", {
    params: {
      limit,
      offset,
      search,
    },
  });
  return response.data;
}

export async function deleteProductVariation(variationId: number) {
  const response = await api.delete(
    `/vendor/items/variations/delete/${variationId}`,
    {}
  );
  return response.data;
}
