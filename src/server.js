import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import { admin } from "./firebase";

import { authRouter } from "./routes/authRouter";
import { unitRouter } from "./routes/unitRouter";
import session from "express-session";
import sessionFileStore from "session-file-store";

export const app = express();

console.log(admin.credential.applicationDefault());

app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

const FileStore = sessionFileStore(session);

app.use(
  session({
    secret: "123456",
    resave: false,
    saveUninitialized: false,
    store: new FileStore(),
  })
);

app.use("/api/auth", authRouter);
app.use("/api/unit", unitRouter);
