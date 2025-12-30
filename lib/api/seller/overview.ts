import api from "../axios";

export async function getOverview(range?: string) {
  const { data } = await api.get(`/vendor/order/statistics?range=${range}`);
  return data;
}
export async function getVendorOrderStatistics(range: string) {
  const { data } = await api.get(`/vendor/order/statistics?range=${range}`);
  return data.data;
}

export async function getSalesGraph(range: string) {
  const { data } = await api.get(`/vendor/graphy?month=${range}`);
  return data;
}

export async function listReviews(offset:number, limit:number) {
  const { data } = await api.get(`/reviews?offset=${offset}&limit=${limit}`)
  return data;
}
