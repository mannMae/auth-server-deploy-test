import {
  TP_IFLOHVAC_UNREGISTERED_DEVICES_CUSTOMER_ID,
  TP_IFLOWHVAC_UNKNOWN_CONTRACTOR_CUSTOMER_ID,
} from "../config";
import { tpAxios, tpCustomerAxios } from "../lib/axios";

export const checkUnitStatusWithSerialNumber = async (request, response) => {
  const { sid } = request.query;

  const { unitStatus } = await getUnitInfoWithSerialNumber({
    serialNumber: sid,
  });

  return response.status(200).send(unitStatus);
};

const getUnitInfoWithSerialNumber = async ({ serialNumber }) => {
  const unitInfo = {
    unitStatus: {
      hasHomeOwner: "N",
      hasContractor: "N",
      validSID: "N",
    },
    deviceId: null,
    unitOwner: {},
    parentCustomer: {
      customerId: null,
      email: null,
    },
  };

  try {
    const result = await tpAxios.get(
      `/api/tenant/devices?deviceName=${serialNumber}`
    );
    unitInfo.deviceId = result.data.id.id;
    unitInfo.unitOwner.id = result.data.customerId;
    unitInfo.unitStatus.validSID = "Y";
    console.log(result);
  } catch (error) {
    console.error(
      "checkUnitStatusWithSerialNumber ERROR1",
      error.response.data.message
    );
    return unitInfo;
  }

  if (
    unitInfo.unitOwner.id.id !== TP_IFLOHVAC_UNREGISTERED_DEVICES_CUSTOMER_ID
  ) {
    try {
      const result = await tpAxios.get(
        `/api/customer/${unitInfo.unitOwner.id.id}`
      );
      unitInfo.unitOwner = result.data;

      if (unitInfo.unitOwner.email) {
        unitInfo.unitStatus.hasHomeOwner = "Y";
      }

      unitInfo.parentCustomer.customerId =
        result.data.additionalInfo.parentCustomerId;
    } catch (error) {
      console.error(
        "checkUnitStatusWithSerialNumber ERROR2",
        error.response.data.message
      );
      return unitInfo;
    }

    try {
      const result = await tpAxios.get(
        `/api/customer/${unitInfo.parentCustomer.customerId}`
      );
      unitInfo.parentCustomer.email = result.data.email;

      if (unitInfo.parentCustomer.email) {
        unitInfo.unitStatus.hasContractor = "Y";
      }
    } catch (error) {
      console.error(
        "checkUnitStatusWithSerialNumber ERROR3",
        error.response.data.message
      );
      return unitInfo;
    }
  }

  return unitInfo;
};

export const registUnitContractor = async (request, response) => {
  let message = {
    result: "success",
  };
  const accessToken = request.headers["x-authorization"].split(" ")[1];
  const { serialNumber, username, address } = request.body;

  let contractorId;
  try {
    const result = await tpCustomerAxios.get("/api/auth/user", {
      headers: {
        "X-Authorization": `Bearer ${accessToken}`,
      },
    });
    contractorId = result.data.customerId.id;
  } catch (error) {
    console.error(error.response.data.message);
    return response.status(500).send(error.response.data.message);
  }

  let unitInfo;

  try {
    unitInfo = await getUnitInfoWithSerialNumber({ serialNumber });
  } catch (error) {
    console.error(error.response.data.message);
    return response.status(500).send(error.response.data.message);
  }

  const { unitStatus, unitOwner, deviceId } = unitInfo;

  if (unitStatus.validSID === "N")
    return response.status(500).send("Invalid SID");

  if (unitStatus.hasContractor === "Y")
    return response.status(500).send("Unit Has Contractor Already!");

  console.log(unitOwner);

  if (unitOwner.email) {
    try {
      const result = await assignHomeOwnerToContractor({
        contractorId,
        unitOwner,
        username,
        address,
        deviceId,
        serialNumber,
      });
      message.result = result;
    } catch (error) {
      console.error(error.response.data.message);
      return response.status(500).send(error.response.data.message);
    }
  } else {
    try {
      const result = await createHomeOwnerCustomer({
        contractorId,
        username,
        address,
        deviceId,
        serialNumber,
      });
      message.result = result;
    } catch (error) {
      console.error(error.response.data.message);
      return response.status(500).send(error.response.data.message);
    }
  }

  return response.status(200).send(message);
};

const createHomeOwnerCustomer = async ({
  contractorId,
  username,
  address,
  deviceId,
  serialNumber,
}) => {
  let homeOwnerCustomerId;

  const customerInfo = {
    name: username,
    title: serialNumber,
    address: address,
    additionalInfo: {
      parentCustomerId: contractorId,
    },
  };

  try {
    const result = await tpAxios.post("/api/customer", customerInfo);
    homeOwnerCustomerId = result.data.id.id;
  } catch (error) {
    console.error(error.response.data.message);
    return response.status(500).send(error.response.data.message);
  }

  try {
    const result = await tpAxios.post(
      `/api/customer/${homeOwnerCustomerId}/device/${deviceId}`
    );
  } catch (error) {
    console.error(error.response.data.message);
    return response.status(500).send(error.response.data.message);
  }

  const homeOwnerCustomerRelationInfo = {
    from: {
      id: homeOwnerCustomerId,
      entityType: "CUSTOMER",
    },
    to: {
      id: contractorId,
      entityType: "CUSTOMER",
    },
    type: "Contains",
    typeGroup: "COMMON",
  };

  try {
    const result = await tpAxios.post(
      "/api/relation",
      homeOwnerCustomerRelationInfo
    );
  } catch (error) {
    console.error(error.response.data.message);
    return response.status(500).send(error.response.data.message);
  }

  const unitHomeOwnerCustomerRelationInfo = {
    from: {
      id: deviceId,
      entityType: "DEVICE",
    },
    to: {
      id: homeOwnerCustomerId,
      entityType: "CUSTOMER",
    },
    type: "Contains",
    typeGroup: "COMMON",
  };

  try {
    const result = await tpAxios.post(
      "/api/relation",
      unitHomeOwnerCustomerRelationInfo
    );
  } catch (error) {
    console.error(error.response.data.message);
    return response.status(500).send(error.response.data.message);
  }

  return "success";
};

const assignHomeOwnerToContractor = async ({
  contractorId,
  unitOwner,
  username,
  address,
}) => {
  let homeOwnerCustomerInfo = { ...unitOwner };
  homeOwnerCustomerInfo.additionalInfo.parentCustomerId = contractorId;
  homeOwnerCustomerInfo.name = username;
  homeOwnerCustomerInfo.address = address;

  try {
    const result = await tpAxios.post("/api/customer", homeOwnerCustomerInfo);
    homeOwnerCustomerInfo = result.data;
  } catch (error) {
    console.error(error.response.data.message);
    return response.status(500).send(error.response.data.message);
  }

  let homeOwnerCustomerOutboundRelations = [];

  try {
    const result = await tpAxios.get(
      `/api/relations?fromId=${homeOwnerCustomerInfo.id.id}&fromType=CUSTOMER&relationTypeGroup=COMMON`
    );
    homeOwnerCustomerOutboundRelations = result.data;
  } catch (error) {
    console.error(error.response.data.message);
    return response.status(500).send(error.response.data.message);
  }

  for (let homeOwnerCustomerOutboundRelation of homeOwnerCustomerOutboundRelations) {
    try {
      const result = await tpAxios.delete(
        `/api/relation?fromId=${homeOwnerCustomerOutboundRelation.from.id}&fromType=CUSTOMER&relationType=Contains&toId=${homeOwnerCustomerOutboundRelation.to.id}&toType=CUSTOMER`
      );
      console.log(result.data);
    } catch (error) {
      console.error(error.response.data.message);
      return response.status(500).send(error.response.data.message);
    }
  }

  const homeOwnerToContractorRelationInfo = {
    from: {
      id: homeOwnerCustomerInfo.id.id,
      entityType: "CUSTOMER",
    },
    to: {
      id: contractorId,
      entityType: "CUSTOMER",
    },
    type: "Contains",
    typeGroup: "COMMON",
  };

  try {
    const result = await tpAxios.post(
      "/api/relation",
      homeOwnerToContractorRelationInfo
    );
  } catch (error) {
    console.error(error.response.data.message);
    return response.status(500).send(error.response.data.message);
  }

  return "success";
};

export const registUnitHomeOwner = async (request, response) => {
  const accessToken = request.headers["x-authorization"].split(" ")[1];
  const { serialNumber, username, address } = request.body;

  let homeOwnerId;
  try {
    const result = await tpCustomerAxios.get("/api/auth/user", {
      headers: {
        "X-Authorization": `Bearer ${accessToken}`,
      },
    });
    homeOwnerId = result.data.id.id;
  } catch (error) {
    console.error(error.response.data.message);
    return response.status(500).send(error.response.data.message);
  }

  let unitInfo;

  try {
    unitInfo = await getUnitInfoWithSerialNumber({ serialNumber });
  } catch (error) {
    console.error(error.response.data.message);
    return response.status(500).send(error.response.data.message);
  }

  let { unitStatus, unitOwner, deviceId, parentCustomer } = unitInfo;

  if (unitStatus.validSID === "N")
    return response.status(500).send("Invalid SID");

  if (unitStatus.hasHomeOwner === "Y")
    return response.status(500).send("Unit Has Home Owner Already!");

  if (unitOwner.id.id === TP_IFLOHVAC_UNREGISTERED_DEVICES_CUSTOMER_ID) {
    unitOwner = await createHomeOwnerCustomerAndAssignToUnknownContractor({
      unitOwner,
      serialNumber,
      username,
      address,
      accessToken,
      parentCustomerId: TP_IFLOWHVAC_UNKNOWN_CONTRACTOR_CUSTOMER_ID,
    });
  } else {
    unitOwner = await createHomeOwnerCustomerAndAssignToUnknownContractor({
      unitOwner,
      serialNumber,
      username,
      address,
      accessToken,
      parentCustomerId: parentCustomer.customerId,
    });
  }
  assingUserToHomeOwnerCustomer({
    accessToken,
    unitOwner,
    homeOwnerId,
    username,
    address,
    deviceId,
  });

  return response.status(200).send("success");
};

const createHomeOwnerCustomerAndAssignToUnknownContractor = async ({
  unitOwner,
  serialNumber,
  username,
  // address,
  accessToken,
  parentCustomerId,
}) => {
  let currentUserInfo;

  try {
    const result = await tpCustomerAxios.get("/api/auth/user", {
      headers: {
        "X-Authorization": `Bearer ${accessToken}`,
      },
    });
    currentUserInfo = result.data;
  } catch (error) {
    console.error(error.response.data.message);
  }

  let customerInfo;

  if (unitOwner.additionalInfo && parentCustomerId) {
    customerInfo = unitOwner;
    unitOwner.title = serialNumber;
    unitOwner.name = username;
    unitOwner.address = currentUserInfo.address;
    unitOwner.phone = currentUserInfo.phone;
    unitOwner.email = currentUserInfo.email;
    unitOwner.additionalInfo.parentCustomerId = parentCustomerId;
  } else {
    customerInfo = {
      title: serialNumber,
      name: username,
      address: currentUserInfo.address,
      phone: currentUserInfo.phone,
      email: currentUserInfo.email,
      additionalInfo: {
        parentCustomerId: parentCustomerId,
      },
    };
  }

  let newHomeOwnerCustomerInfo;

  try {
    const result = await tpAxios.post("/api/customer", customerInfo);
    newHomeOwnerCustomerInfo = result.data;
  } catch (error) {
    console.error(error.message);
  }

  const homeOwnerCustomerRelationInfo = {
    from: {
      id: newHomeOwnerCustomerInfo.id.id,
      entityType: "CUSTOMER",
    },
    to: {
      id: parentCustomerId,
      entityType: "CUSTOMER",
    },
    type: "Contains",
    typeGroup: "COMMON",
  };

  try {
    const result = await tpAxios.post(
      "/api/relation",
      homeOwnerCustomerRelationInfo
    );
  } catch (error) {
    console.error(error.response.data.message);
  }

  return newHomeOwnerCustomerInfo;
};

const assingUserToHomeOwnerCustomer = async ({
  accessToken,
  unitOwner,
  username,
  address,
  deviceId,
}) => {
  console.log("assingUserToHomeOwnerCustomer");
  let currentHomeOwnerInfo;

  try {
    const result = await tpCustomerAxios.get("/api/auth/user", {
      headers: {
        "X-Authorization": `Bearer ${accessToken}`,
      },
    });
    currentHomeOwnerInfo = result.data;
  } catch (error) {
    console.error(error.response.data.message);
    return "fail";
  }

  currentHomeOwnerInfo.customerId = unitOwner.id;
  currentHomeOwnerInfo.name = username;
  currentHomeOwnerInfo.address = address;
  console.log(currentHomeOwnerInfo);

  try {
    const result = await tpAxios.post(
      `/api/user?sendActivationMail=false`,
      currentHomeOwnerInfo
    );
  } catch (error) {
    console.error(error.response.data.message);
    return "fail";
  }

  try {
    const result = await tpAxios.post(
      `/api/customer/${unitOwner.id.id}/device/${deviceId}`
    );
  } catch (error) {
    console.error(error.response.data.message);
    return "fail";
  }

  let unitOutboundRelations = [];

  try {
    const result = await tpAxios.get(
      `/api/relations?fromId=${deviceId}&fromType=DEVICE&relationTypeGroup=COMMON`
    );
    unitOutboundRelations = result.data;
  } catch (error) {
    console.error(error.response.data.message);
    return "fail";
  }

  for (let unitOutboundRelation of unitOutboundRelations) {
    try {
      const result = await tpAxios.delete(
        `/api/relation?fromId=${unitOutboundRelation.from.id}&fromType=DEVICE&relationType=Contains&toId=${unitOutboundRelation.to.id}&toType=CUSTOMER`
      );
      console.log(result.data);
    } catch (error) {
      console.error(error.response.data.message);
      return "fail";
    }
  }

  const homeOwnerDeviceRelationInfo = {
    from: {
      id: deviceId,
      entityType: "DEVICE",
    },
    to: {
      id: unitOwner.id.id,
      entityType: "CUSTOMER",
    },
    type: "Contains",
    typeGroup: "COMMON",
  };

  try {
    const result = await tpAxios.post(
      "/api/relation",
      homeOwnerDeviceRelationInfo
    );
  } catch (error) {
    console.error(error.response.data.message);
    return "fail";
  }

  return "success";
};
