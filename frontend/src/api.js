import axios from "axios";

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

const API = axios.create({ baseURL: BASE });

export const createAuction = (data) => API.post("/auction", data);
export const getAuction    = (id)   => API.get(`/auction/${id}`);
export const getAllAuctions = ()     => API.get("/auction");
export const placeBid      = (id, data) => API.post(`/auction/${id}/bid`, data);
export const endAuction    = (id)   => API.patch(`/auction/${id}/end`);
