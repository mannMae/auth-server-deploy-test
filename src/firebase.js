import { JWT } from "google-auth-library";
import { axiosToFirebase } from "./lib/axios";

export const admin = require("firebase-admin");

var serviceAccount = require("../test-24159-firebase-adminsdk-en6cj-c6920cc9cb.json");

admin.initializeApp({
  //   credential: admin.credential.cert(serviceAccount),
  credential: admin.credential.applicationDefault(),
});

// axiosToFirebase
//   .post("/v1/projects/test-24159/messages:send")
//   .then((res) => console.log(res))
//   .catch((error) => console.error(error));

// function getAccessToken() {
//   return new Promise((resolve, reject) => {
//     const key = require("../test-24159-firebase-adminsdk-en6cj-c6920cc9cb.json");

//     console.log(key);
//     const jwtClient = new JWT(
//       key.client_email,
//       null,
//       key.private_key,
//       ["https://www.googleapis.com/auth/firebase.messaging"],
//       null
//     );

//     jwtClient.authorize((error, tokens) => {
//       if (error) return reject(err);

//       resolve(tokens.access_token);
//     });
//   });
// }

// getAccessToken().then((accessToken) => {
// });
