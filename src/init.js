import "dotenv/config";
import session from "express-session";
import { getTenantToken } from "./lib/axios";
import { app } from "./server";

const onRunning = async (request, response) => {
  const { token, refreshToken } = await getTenantToken();
  session.token = token;
  session.refreshToken = refreshToken;
  session.ts = Date.now();

  console.log("Running!");
};

app.listen(4000, onRunning);
