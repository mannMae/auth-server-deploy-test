import express from "express";
import {
  checkUnitStatusWithSerialNumber,
  registUnitContractor,
  registUnitHomeOwner,
} from "../controllers/unitController";

export const unitRouter = express.Router();

unitRouter.get("/check", checkUnitStatusWithSerialNumber);

unitRouter.post("/regist/contractor", registUnitContractor);
unitRouter.post("/regist/home-owner", registUnitHomeOwner);
