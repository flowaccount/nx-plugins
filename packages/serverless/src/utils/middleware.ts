import { BuildBuilderOptions } from "./types";
import { ServerlessWrapper } from "./serverless";

export async function wrapMiddlewareBuildOptions<T extends BuildBuilderOptions>(
    options: T
  ): Promise<void> {

    ServerlessWrapper.serverless.cli.log("getting all functions")
    const functionNames: [] = await ServerlessWrapper.serverless.service.getAllFunctions()
    console.log(functionNames)
    functionNames.forEach(name => {
        if(ServerlessWrapper.serverless.service.functions[name]){
            var fn = ServerlessWrapper.serverless.service.getFunction(name);
            if (!fn.events) {
                fn.events = [];
            }
            if(options.logGroupName) {
                fn.events.cloudwatchLog = '/aws/lambda/subscription';
            }
            ServerlessWrapper.serverless.service.functions[name] = fn;
            console.log(ServerlessWrapper.serverless.service.functions[name]);
        }
    });
  }