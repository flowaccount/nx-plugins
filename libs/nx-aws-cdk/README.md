## Prerequisites

- Have an existing nx workspace. For creating this, see [nrwl's documentation](https://nx.dev/latest/angular/getting-started/nx-setup).
- Add  `"aws-cdk": "1.114.0",` to your `package.json` and run `yarn`
## Installation

### NPM

```shell
npm i --save-dev @flowaccount/nx-aws-cdk
// npx nx g @flowaccount/nx-aws-cdk:init -- coming soon
```

### PNPM

```shell
pnpm i --save-dev @flowaccount/nx-aws-cdk
// pnpx nx g @flowaccount/nx-aws-cdk:init -- coming soon
```

### Yarn

```shell
yarn add --dev @flowaccount/nx-aws-cdk
// npx nx g @flowaccount/nx-aws-cdk:init -- coming soon
```

## Generate and run your first AWS infrastructure! (Coming Soon)

Generate my-api, and my-api-test with C# and nunit tests.

```shell
yarn nx g @flowaccount/nx-aws-cdk:app my-cdk
```

Run my-cdk Synthesizer locally

```shell
yarn nx run my-cdk:synth [--configuration=<stack-suffix>]
```

Deploy your infrastructure

```shell
yarn nx run my-cdk:deploy [--configuration=<stack-suffix>]
```
