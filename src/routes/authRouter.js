import express from "express";
import {
  resetContractor,
  resetHomeOwner,
  signUpAsContractor,
  signUpAsHomeOwner,
  verifyWithCodeAsContractor,
  verifyWithCodeAsHomeOwner,
} from "../controllers/authController";

export const authRouter = express.Router();

authRouter.post("/signup/contractor", signUpAsContractor);
authRouter.post("/signup/home-owner", signUpAsHomeOwner);
authRouter.post("/verify/contractor", verifyWithCodeAsContractor);
authRouter.post("/verify/home-owner", verifyWithCodeAsHomeOwner);

// authRouter.post("/reset/home-owner", resetHomeOwner);
// authRouter.post("/reset/contractor", resetContractor);
