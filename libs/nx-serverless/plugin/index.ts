// import { generateFunctions } from '../functions/generate-functions';
// import { prepareInvoke } from '../integrations/serverless-invoke-local';
import { prepareOffline, prepareStepOffline, prepareInvoke } from '../src/integrations/serverless-offline';
import { NxFacade } from '../src/nrwl/nx-facade';
//import { PackagingManager } from './packaging/packaging-manager';

class NxServerlessPlugin {
  readonly hooks: { [key: string]: () => void };

  constructor(
    private serverless: Serverless.Instance,
    private options: Serverless.Options,
    private logging: Serverless.Logging,
  ) {
    this.hooks = {
      'before:package:createDeploymentArtifacts': async () => {
        const { nx} = this.prepare();
        this.serverless.serviceDir = nx.outputAbsolutePath;
        //await packaging.pack(functions, nx.outputAbsolutePath);
      },

      'before:deploy:function:packageFunction': async () => {
        const { nx} = this.prepare();
        this.serverless.serviceDir = nx.outputAbsolutePath.replace('/src', '');
        //await packaging.pack(functions, nx.outputAbsolutePath);
      },
      
      'after:package:createDeploymentArtifacts': async () => {
       
        this.serverless.serviceDir = process.cwd();
      },

      'after:deploy:function:packageFunction': async () => {
        this.serverless.serviceDir = process.cwd();
      },

      'before:invoke:local:invoke': async () => {
        const { nx } = this.prepare();

        prepareInvoke(this.serverless, nx);
      },

      'before:offline:start': async () => {
        const { nx } = this.prepare();

        // await nx.watch();
        prepareOffline(this.serverless, nx);
      },
      'before:offline:start:init': async () => {
        const { nx } = this.prepare();

        //await nx.watch();
        prepareOffline(this.serverless, nx);
      },

      'before:step-functions-offline:start': async () => {
        const { nx } = this.prepare();

        // await nx.watch();
        prepareStepOffline(this.serverless, nx);
      },
    };
  }

  private prepare() {
    // this.printExperimentalWarning();
    if (this.serverless.service.provider.name !== 'aws') {
      throw new Error('The only supported provider is "aws"');
    }

    const nx = new NxFacade(this.logging);
    //const packaging = new PackagingManager(this.serverless);
    // const functions = generateFunctions(this.serverless, this.options);

    return { nx };
  }

  private printExperimentalWarning() {
    this.logging.log.warning(
      '"@flowaccount/nx-serverless/plugin" is experimental and can change without a major release.',
    );
  }
}

module.exports = NxServerlessPlugin;