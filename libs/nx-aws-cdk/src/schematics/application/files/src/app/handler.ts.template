import { APIGatewayProxyHandler } from "aws-lambda";

export const helloWorld: APIGatewayProxyHandler = async (event, _context, callback) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!',
      input: event,
    }, null, 2),
  };
};
