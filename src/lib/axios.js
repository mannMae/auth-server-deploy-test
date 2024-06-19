import Axios from "axios";
import {
  TP_SERVER_ADDRESS,
  TP_TENANT_ADMIN_ID,
  TP_TENANT_ADMIN_PASSWORD,
} from "../config";
import session from "express-session";

export const tpAxios = Axios.create({
  baseURL: TP_SERVER_ADDRESS,
});

export const tpCustomerAxios = Axios.create({
  baseURL: TP_SERVER_ADDRESS,
});

export const axiosToFirebase = Axios.create({
  baseURL: "https://fcm.googleapis.com/",
});

const axiosRequestInterceptor = async (config) => {
  const now = Date.now();
  const sessionTs = session.ts;
  if (now >= sessionTs + 24 * 60 * 60 * 1000) {
    try {
      const { token, refreshToken } = await getTenantToken();
      session.token = token;
      session.refreshToken = refreshToken;
      session.ts = now;
    } catch (error) {
      console.error(error);
    }
    console.log(session.ts);
  }

  if (session.token) {
    config.headers["X-Authorization"] = `Bearer ${session.token}`;
  }
  return config;
};

tpAxios.interceptors.request.use(axiosRequestInterceptor);

export const getTenantToken = async () => {
  const tenantInfo = {
    username: TP_TENANT_ADMIN_ID,
    password: TP_TENANT_ADMIN_PASSWORD,
  };

  try {
    const result = await tpCustomerAxios.post("/api/auth/login", tenantInfo);
    return result.data;
  } catch (error) {
    console.error(error);
    return error;
  }
};
