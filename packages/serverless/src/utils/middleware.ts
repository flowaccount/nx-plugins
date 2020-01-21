import { BuildBuilderOptions } from "./types";
import { ServerlessWrapper } from "./serverless";

export async function wrapMiddlewareBuildOptions<T extends BuildBuilderOptions>(
    options: T
  ): Promise<void> {

    ServerlessWrapper.serverless.cli.log("getting all functions")
    const functionNames: [] = await ServerlessWrapper.serverless.service.getAllFunctions()
    functionNames.forEach(name => {
        if(ServerlessWrapper.serverless.service.functions[name]){
            var fn = ServerlessWrapper.serverless.service.getFunction(name);
            if (!fn.events) {
                fn.events = [];
            }
            if(options.logGroupName) {
                fn.events.push({ cloudwatchLog: { logGroup: options.logGroupName, filter: '' } });
            }
            ServerlessWrapper.serverless.service.functions[name] = fn;
        }
    });
  }