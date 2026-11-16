const apiConfig = {
  customerKey: "00000000-0000-0000-0000-000000000001",
};

export function hasCustomerKey() {
  return typeof apiConfig.customerKey === "string" && apiConfig.customerKey.trim().length > 0;
}

export default apiConfig;
