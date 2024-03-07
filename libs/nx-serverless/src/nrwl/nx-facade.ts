import {
    ExecutorContext,
    parseTargetString,
    ProjectGraph,
    readCachedProjectGraph,
    readNxJson,
    readProjectsConfigurationFromProjectGraph,
    runExecutor,
    Target,
    workspaceRoot,
  } from '@nx/devkit';
  //import * as execa from 'execa';
  import { join } from 'path';
  
  export const NX_SERVERLESS_BUILD_TARGET_KEY = 'NS3_NX_SERVERLESS_BUILD_TARGET';
  
  export class NxFacade {
    private readonly graph: ProjectGraph;
    private readonly buildTarget: string;
    readonly outputAbsolutePath: string;
  
    constructor(private logging: Serverless.Logging) {
      
        this.graph = readCachedProjectGraph();
        this.buildTarget = process.env[NX_SERVERLESS_BUILD_TARGET_KEY] as string;
        this.outputAbsolutePath = getAbsoluteOutputPath(this.graph, this.buildTarget).replace('src\\', '');
    }
  
    // async build(): Promise<void> {
    //   this.logging.log.info(`Building with nx buildTarget: "${this.buildTarget}"`);
    //   const result = await execa.command(`npx nx run ${this.buildTarget}`, {
    //     cwd: workspaceRoot,
    //     all: true,
    //     reject: false,
    //   });
    //   if (result.failed) {
    //     this.logging.writeText(result.all);
    //     throw new Error('Build failed');
    //   } else {
    //     this.printBuildSuccessMessage(result.all);
    //   }
    // }
  
    // private printBuildSuccessMessage(output: string) {
    //   const startIndex = output.indexOf(this.buildTarget);
    //   const endIndex = output.indexOf('\n', startIndex);
    //   const buildTargetOutput = output.substring(startIndex, endIndex).trim();
    //   this.logging.log.success(buildTargetOutput);
    // }
  
    async watch(): Promise<void> {
      this.logging.log.info(`Watching with nx buildTarget: "${this.buildTarget}"`);
      await this.compile(true).next();
    }
  
    private async *compile(watch: boolean) {
      const targetDescription = parseTargetString(this.buildTarget, this.graph);
      const executorContext = createExecutorContext(this.graph, targetDescription);
      for await (const output of await runExecutor(targetDescription, { watch }, executorContext)) {
        yield output;
      }
    }
  }
  
  function getAbsoluteOutputPath(graph: ProjectGraph, buildTarget: string) {
    const targetDescription = parseTargetString(buildTarget, graph);
    const outputPath = getTargetOption<string>(graph, targetDescription, 'outputPath');
  
    return join(workspaceRoot, outputPath);
  }
  
  function getTargetOption<T>(graph: ProjectGraph, targetDescriptor: Target, option: string): T {
    const { project, target, configuration } = targetDescriptor;
    const targetConfiguration = graph.nodes[project].data.targets[target];
    const defaultConfiguration = targetConfiguration.defaultConfiguration;
    const normalizedConfiguration = configuration ?? defaultConfiguration;
  
    return (
      targetConfiguration.options[option] ??
      targetConfiguration.configurations[normalizedConfiguration]?.[option]
    );
  }
  
  /**
   * Based on:
   * @link https://github.com/nrwl/nx/blob/2e6592c533580aba7396fc910f92a7dbbf16163f/packages/cypress/src/utils/ct-helpers.ts#L106-L128
   */
  function createExecutorContext(graph: ProjectGraph, targetDescriptor: Target): ExecutorContext {
    const targets = graph.nodes[targetDescriptor.project]?.data.targets;
    const projectsConfigurations = readProjectsConfigurationFromProjectGraph(graph);
    // https://github.com/nrwl/nx/blob/717a8dd027991308e41cdf9ef3f370a352e65756/packages/nx/src/generators/utils/nx-json.ts#L15-L31
    const nxJsonConfiguration = readNxJson();
    return {
      cwd: workspaceRoot,
      projectGraph: graph,
      target: targets[targetDescriptor.target],
      targetName: targetDescriptor.target,
      configurationName: targetDescriptor.configuration,
      root: workspaceRoot,
      isVerbose: false,
      projectName: targetDescriptor.project,
      projectsConfigurations,
      nxJsonConfiguration,
    };
  }