import { AuthenticationDetails, CognitoUser } from "amazon-cognito-identity-js";
import { contractorUserPool, homeOwnerUserPool } from "../lib/awsCognito";
import { tpAxios, tpCustomerAxios } from "../lib/axios";
import {
  TP_IFLOWHVAC_GUEST_HOMEOWNER_MANAGER_CUSTOMER_ID,
  TP_IFLOWHVAC_MANAGER_CUSTOMTER_ID,
} from "../config";
// import {
//   AdminDeleteUserCommand,
//   CognitoIdentityProviderClient,
// } from "@aws-sdk/client-cognito-identity-provider";

export const signUpAsContractor = async (request, response) => {
  const { company, unit, street, state, zip, name, email, password, phone } =
    request.body;

  console.log(company, unit, street, state, zip, name, email, password, phone);

  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: contractorUserPool,
  });
  const authenticationDetail = new AuthenticationDetails({
    Username: email,
    Password: password,
  });

  try {
    const userSearchResult = await tpAxios.get(
      `/api/users?pageSize=1&page=0&textSearh=${email}`
    );
    if (userSearchResult.data.data.length) {
      const tpUser = userSearchResult.data.data[0].email;
      if (tpUser === email) {
        return response.status(500).send({ message: "User already exists" });
      }
    }
  } catch (error) {
    console.error("SIGNUP ERROR1", error.response.data.message);
  }

  try {
    cognitoUser.authenticateUser(authenticationDetail, {
      onSuccess: (res) => {
        console.log(res);
        cognitoUser.deleteUser((err, res) => {
          if (err) console.log(err);
          else console.log(res);
        });
      },
      onFailure: (err) => console.error("SIGNUP ERROR2", err),
    });
  } catch (error) {
    console.error("SIGNUP ERROR3", error.response.data.message);
  }

  // const client = new CognitoIdentityProviderClient({
  //   apiVersion: "2016-04-18",
  //   region: "us-east-1",
  // });

  // const userPoolId = userPool.getUserPoolId();

  // console.log(client, userPoolId);

  // const input = {
  //   UserPoolId: userPoolId,
  //   Username: email,
  // };

  // const command = new AdminDeleteUserCommand(input);
  // const result = await client.send(command);
  // console.log(result);

  contractorUserPool.signUp(
    email,
    password,
    [
      { Name: "email", Value: email },
      { Name: "phone_number", Value: phone },
      { Name: "name", Value: name },
      { Name: "custom:company", Value: company },
      { Name: "custom:unit", Value: unit },
      { Name: "custom:street", Value: street },
      { Name: "custom:state", Value: state },
      { Name: "custom:zip", Value: zip },
    ],
    null,
    (error, res) => {
      if (error) {
        console.error("SIGNUP ERROR4", error);
        return response.status(500).send({ message: error });
      }
      return response.status(200).send("success");
    }
  );
};

export const signUpAsHomeOwner = async (request, response) => {
  const {
    name,
    unit,
    street,
    city,
    state,
    zip,
    phone,
    email,
    country,
    password,
    lon,
    lat,
  } = request.body;

  console.log(
    name,
    unit,
    street,
    city,
    state,
    zip,
    phone,
    email,
    country,
    password,
    lon,
    lat
  );

  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: homeOwnerUserPool,
  });
  const authenticationDetail = new AuthenticationDetails({
    Username: email,
    Password: password,
  });

  try {
    const userSearchResult = await tpAxios.get(
      `/api/users?pageSize=1&page=0&textSearh=${email}`
    );
    if (userSearchResult.data.data.length) {
      const tpUser = userSearchResult.data.data[0].email;
      if (tpUser === email) {
        return response.status(500).send({ message: "User already exists" });
      }
    }
  } catch (error) {
    console.error("SIGNUP ERROR1", error.response.data.message);
  }

  try {
    cognitoUser.authenticateUser(authenticationDetail, {
      onSuccess: (res) => {
        console.log(res);
        cognitoUser.deleteUser((err, res) => {
          if (err) console.log(err);
          else console.log(res);
        });
      },
      onFailure: (err) => console.error("SIGNUP ERROR2", err),
    });
  } catch (error) {
    console.error("SIGNUP ERROR3", error.response.data.message);
  }

  // const client = new CognitoIdentityProviderClient({
  //   apiVersion: "2016-04-18",
  //   region: "us-east-1",
  // });

  // const userPoolId = homeOwnerUserPool.getUserPoolId();

  // console.log(client, userPoolId);

  // const input = {
  //   UserPoolId: userPoolId,
  //   Username: email,
  // };

  // const command = new AdminDeleteUserCommand(input);
  // const result = await client.send(command);
  // console.log(result);

  homeOwnerUserPool.signUp(
    email,
    password,
    [
      { Name: "email", Value: email },
      { Name: "phone_number", Value: phone },
      { Name: "name", Value: name },
      { Name: "custom:unit", Value: unit },
      { Name: "custom:street", Value: street },
      { Name: "custom:city", Value: city },
      { Name: "custom:state", Value: state },
      { Name: "custom:zip", Value: zip },
      { Name: "custom:country", Value: country },
      { Name: "custom:lat", Value: lat },
      { Name: "custom:lon", Value: lon },
    ],
    null,
    (error, res) => {
      if (error) {
        console.error("SIGNUP ERROR4", error);
        return response.status(500).send({ message: error });
      }
      return response.status(200).send("success");
    }
  );
};

export const verifyWithCodeAsContractor = (request, response) => {
  const { email, password, code } = request.body;

  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: contractorUserPool,
  });

  const authenticationDetail = new AuthenticationDetails({
    Username: email,
    Password: password,
  });

  cognitoUser.confirmRegistration(code, true, (error, res) => {
    if (error) return response.status(500).send({ message: error });
  });

  cognitoUser.authenticateUser(authenticationDetail, {
    onSuccess: (res) => {
      cognitoUser.getUserData(async (error, result) => {
        if (error) return console.error(error);

        const userAttributes = result["UserAttributes"];
        const userInfoFromCognito = {};

        for (let attributePair of userAttributes) {
          userInfoFromCognito[attributePair.Name] = attributePair.Value;
        }

        console.log(userInfoFromCognito);

        const customerInfo = {
          title: userInfoFromCognito["custom:company"],
          address: `${userInfoFromCognito["custom:street"]} ${userInfoFromCognito["custom:unit"]}`,
          state: `${userInfoFromCognito["custom:state"]}`,
          zip: `${userInfoFromCognito["custom:zip"]}`,
          phone: userInfoFromCognito.phone_number,
          email: userInfoFromCognito.email,
          additionalInfo: {
            parentCustomerId: TP_IFLOWHVAC_MANAGER_CUSTOMTER_ID,
          },
        };

        let currentCustomerInfo;

        try {
          const result = await tpAxios.post("/api/customer", customerInfo);
          currentCustomerInfo = result.data;
        } catch (error) {
          console.error(
            "ERROR=========================",
            error.response.data.message
          );
        }

        console.log(currentCustomerInfo);

        const relationInfo = {
          from: {
            id: currentCustomerInfo.id.id,
            entityType: "CUSTOMER",
          },
          to: {
            id: TP_IFLOWHVAC_MANAGER_CUSTOMTER_ID,
            entityType: "CUSTOMER",
          },
          type: "Contains",
          typeGroup: "COMMON",
        };

        try {
          const result = await tpAxios.post("/api/relation", relationInfo);
          console.log("RELATION RESULT: ", result);
        } catch (error) {
          console.error(error.response.data.message);
        }

        const [emailLocal, emailDomain] = userInfoFromCognito.email.split("@");

        const userInfo = {
          customerId: { id: currentCustomerInfo.id.id, entityType: "CUSTOMER" },
          email: `${emailLocal}_con@${emailDomain}`,
          firstName: userInfoFromCognito.name,
          authority: "CUSTOMER_USER",
          additionalInfo: {
            userAuthority: "admin",
            description: `{phone:${userInfoFromCognito.phone_number}}`,
          },
        };

        let currentUserInfo;

        try {
          const result = await tpAxios.post(
            "/api/user?sendActivationMail=false",
            userInfo
          );
          currentUserInfo = result.data;
          console.log(result.data);
        } catch (error) {
          console.error(error.response.data.message);
        }

        let currentUserActivationToken;

        try {
          const result = await tpAxios.get(
            `/api/user/${currentUserInfo.id.id}/activationLink`
          );
          currentUserActivationToken = result.data.split("=")[1];
        } catch (error) {
          console.error(error.response.data.message);
        }

        let currentUserAuth;

        try {
          const result = await tpAxios.post("/api/noauth/activate", {
            activateToken: currentUserActivationToken,
            password,
          });

          currentUserAuth = result.data;
        } catch (error) {
          console.error(error.response.data.message);
        }

        return response.status(200).send(currentUserAuth);
      });
    },
    onFailure: (err) => console.error(err),
  });
};

export const verifyWithCodeAsHomeOwner = (request, response) => {
  const { email, password, code } = request.body;
  console.log(email, password, code);

  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: homeOwnerUserPool,
  });

  const authenticationDetail = new AuthenticationDetails({
    Username: email,
    Password: password,
  });

  cognitoUser.confirmRegistration(code, true, (error, res) => {
    if (error) return response.status(500).send({ message: error });
  });

  cognitoUser.authenticateUser(authenticationDetail, {
    onSuccess: (res) => {
      cognitoUser.getUserData(async (error, result) => {
        if (error) return console.error(error);
        const userAttributes = result["UserAttributes"];
        const userInfoFromCognito = {};
        for (let attributePair of userAttributes) {
          userInfoFromCognito[attributePair.Name] = attributePair.Value;
        }
        console.log(userInfoFromCognito);

        const [emailLocal, emailDomain] = userInfoFromCognito.email.split("@");

        const userInfo = {
          customerId: {
            id: TP_IFLOWHVAC_GUEST_HOMEOWNER_MANAGER_CUSTOMER_ID,
            entityType: "CUSTOMER",
          },
          email: `${emailLocal}_ho@${emailDomain}`,
          firstName: userInfoFromCognito.name,
          authority: "CUSTOMER_USER",
          additionalInfo: {
            userAuthority: "admin",
            description: `{phone:${userInfoFromCognito.phone_number},address:{unit:${userInfoFromCognito["custom:unit"]},street:${userInfoFromCognito["custom:street"]},city:${userInfoFromCognito["custom:city"]},state:${userInfoFromCognito["custom:state"]},zip:${userInfoFromCognito["custom:zip"]},country:${userInfoFromCognito["custom:country"]}}}`,
          },
        };

        let currentUserInfo;
        try {
          const result = await tpAxios.post(
            "/api/user?sendActivationMail=false",
            userInfo
          );
          currentUserInfo = result.data;
          console.log(result.data);
        } catch (error) {
          console.error(
            "ERROR POST /api/user?sendActivationMail=false",
            error.response.data.message
          );
        }
        let currentUserActivationToken;
        try {
          const result = await tpAxios.get(
            `/api/user/${currentUserInfo.id.id}/activationLink`
          );
          currentUserActivationToken = result.data.split("=")[1];
        } catch (error) {
          console.error(
            "ERROR GET /api/user/${currentUserInfo.id.id}/activationLink",
            error.response.data.message
          );
        }
        let currentUserAuth;
        try {
          const result = await tpAxios.post("/api/noauth/activate", {
            activateToken: currentUserActivationToken,
            password,
          });

          console.log(result);
          currentUserAuth = result.data;
        } catch (error) {
          console.error(
            "ERROR POST /api/noauth/activate",
            error.response.data.message
          );
        }
        return response.status(200).send(currentUserAuth);
      });
    },
    onFailure: (err) => console.error(err),
  });
};

export const resetHomeOwner = async (request, response) => {
  const accessToken = request.headers["x-authorization"].split(" ")[1];

  let currentHomeOwnerInfo;
  try {
    const result = await tpCustomerAxios.get("/api/auth/user", {
      headers: {
        "X-Authorization": `Bearer ${accessToken}`,
      },
    });
    currentHomeOwnerInfo = result.data;
  } catch (error) {
    console.error(error.message);
    return "fail";
  }

  currentHomeOwnerInfo.customerId.id =
    TP_IFLOWHVAC_GUEST_HOMEOWNER_MANAGER_CUSTOMER_ID;

  try {
    const result = await tpAxios.post(
      `/api/user?sendActivationMail=false`,
      currentHomeOwnerInfo
    );
  } catch (error) {
    console.error(error.response.data.message);
    return "fail";
  }

  return "success";
};

// export const resetContractor = async (request, response) => {
//   const accessToken = request.headers["x-authorization"].split(" ")[1];

//   let currentHomeOwnerInfo;
//   try {
//     const result = await tpCustomerAxios.get("/api/auth/user");
//     currentHomeOwnerInfo = result.data;
//   } catch (error) {
//     console.error(error.message);
//     return "fail";
//   }

//   currentHomeOwnerInfo.customerId.id = TP_IFLOWHVAC_CONTRACTOR_A_CUSTOMER_ID;

//   try {
//     const result = await tpAxios.post(
//       `/api/user?sendActivationMail=false`,
//       currentHomeOwnerInfo
//     );
//   } catch (error) {
//     console.error(error.response.data.message);
//     return "fail";
//   }

//   return "success";
// };
