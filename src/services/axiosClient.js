import axios from "axios";

const API_BASE = "http://84.247.165.214:3000/api";

const axiosClient = axios.create({
  baseURL: API_BASE
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default axiosClient;