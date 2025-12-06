import api from "./axios";

export async function listItems(
  limit: number,
  offset: number,
  search?: string,
  type?: string,
  status?: string,
  category?: string,
  sort?: string,
  max_price?: number,
  availability?: string
) {
  const response = await api.get("/items", {
    params: {
      limit,
      offset,
      ...(search ? { search } : {}),
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      // Only include category if no search
      ...(!search && category ? { category } : {}),
      ...(sort ? { sort } : {}),
      ...(max_price ? { max_price } : {}),
      ...(availability ? { availability } : {}),
    },
  });
  return response.data;
}

export async function listSellerItems(
  limit: number,
  offset: number,
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

export async function getItemStatictics() {
  const { data } = await api.get(`/vendor/items/statistics`);
  return data.data;
}

export async function updateItemStatus(productId: number, status: string) {
  const response = await api.patch(`/vendor/product/${productId}/status/${status}`);
  return response.data;
}

export async function addItem(formData: FormData) {
  const response = await api.post("/vendor/item/create", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function updateItem(ItemId: number, formData: FormData) {
  formData.append("_method", "PUT");  
  const response = await api.post(`/vendor/item/${ItemId}/update`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}


export async function deleteItem(productId: number) {
  const { data } = await api.delete(`/vendor/item/delete/${productId}`);
  return data.data;
}

export async function deleteItemPhoto(productId: number, imageId: string) {
  const { data } = await api.delete(`/vendor/item/image/delete/${productId}`, {
    data: { imageId },
  });

  return data.data;
}
