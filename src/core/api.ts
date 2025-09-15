import axios from "axios";
import { ENV } from "../config/env";

export const api = axios.create({
  baseURL: ENV.API_URL,
  timeout: 12000
});

// TODO: attach Bearer token from SecureStore; handle 401 refresh here.
