import api from "../axios";
 
export async function saveShop(formData: FormData) {
  // If we are updating, Laravel often requires _method: PUT for multipart/form-data
  if (!formData.has("_method")) {
    formData.append("_method", "POST");
  }
  const response = await api.post("/shop/save", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function subscriptionCheckout(priceId: string) {
  const response = await api.post("/vendor/subscription/checkout", {
    price_id: priceId,
  });
  return response.data;
}

export const verifySubscriptionCheckout = async (sessionId: string) => {
  const response = await api.get(
    `/vendor/subscription/checkout/verify?session_id=${sessionId}`
  );
  return response.data;
};

export async function verifyOnboardingStatus(){
  const response = await api.get(
    `/vendor/subscription/onboarding/verify`
  );
  return response.data;
};
export async function retryOnboardingStatus(){
  const response = await api.get(`/vendor/subscription/onboarding/retry`);
  return response.data;
};

export async function updateShopLogo(file: File) {
  const formData = new FormData();
  // Laravel "Method Spoofing" for file uploads via PUT
  formData.append("_method", "PUT");
  formData.append("logo", file);

  const response = await api.post("/vendor/shop/logo/update", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

export async function updateShopBanner(file: File) {
  const formData = new FormData();
  formData.append("_method", "PUT");
  formData.append("banner", file);

  const response = await api.post("/vendor/shop/banner/update", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

export async function getMyShop() {
  const response = await api.get("/vendor/shop");
  return response.data;
}
