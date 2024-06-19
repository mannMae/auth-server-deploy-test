import { CognitoUserPool } from "amazon-cognito-identity-js";
import { CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";

const contractorUserPoolData = {
  UserPoolId: "us-east-1_IeKEXpEkX",
  ClientId: "5vgmo54o4vesbto73bvria82ab",
};

export const contractorUserPool = new CognitoUserPool(contractorUserPoolData);

const homeOwnerUserPoolData = {
  UserPoolId: "us-east-1_IuDIcuzbs",
  ClientId: "3kpe0tlfnnfhkhgahl384qh8be",
};

export const homeOwnerUserPool = new CognitoUserPool(homeOwnerUserPoolData);

// export const cognitoIdentityServiceProvider = new CognitoIdentityProvider({
//   apiVersion: "2016-04-18",
//   region: "us-east-1",
// });
