const headers = {
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*",
  "Content-Type": "application/json"
};

const generateProxyIntegrationResponse = (
  statusCode: number,
  body?: string
) => {
  return {
    statusCode,
    body,
    headers,
  };
};

export const generateOkResult = (body: string) => {
  return generateProxyIntegrationResponse(200, body);
};

export const generateErrorResult = () => {
  return generateProxyIntegrationResponse(
    500,
    JSON.stringify({
      message: "An error occurred.",
    })
  );
};
