<p float="left">
<img src="https://raw.githubusercontent.com/nrwl/nx/master/nx-logo.png" height="100">
<img src="https://angular.io/assets/images/logos/angular/angular.svg" height="145">
<img src="https://res.cloudinary.com/practicaldev/image/fetch/s--ipV6F4tM--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_auto%2Cw_880/https://raw.githubusercontent.com/serverless/assets/master/Icon/Framework/PNG/Serverless_Framework-icon01.png" height="120">
<img src="https://upload.wikimedia.org/wikipedia/commons/d/d9/Node.js_logo.svg" height="145">
</p>

<div align="left">

[![License](https://img.shields.io/npm/l/@flowaccount/nx-serverless.svg?style=flat-square)]()

</div>

<div align="left">

[![serverless](http://public.serverless.com/badges/v3.svg)](https://www.serverless.com)
[![@flowaccount/nx-serverless](https://img.shields.io/badge/%40flowaccount-nx--serverless-blue)](https://github.com/flowaccount/nx-plugins)
[![NPM Version](https://badge.fury.io/js/%40flowaccount%2Fnx-serverless.svg)](https://www.npmjs.com/@flowaccount/nx-serverless)
[![Typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)](https://www.typescriptlang.org/)
[![CircleCI](https://circleci.com/gh/flowaccount/nx-plugins.svg?style=svg)](https://circleci.com/gh/flowaccount/nx-plugins)

</div>

<hr>

# What is Nx

🔎 **Extensible Dev Tools for Monorepos.**

# What is @flowaccount/nx-plugins

🔎 **Extensible Continous Delivery/Depolyment Tools on top of Nx workspace for seamless deployments with frameworks like Serverless, Lambda, Azure Functions, Google Functions and AWS Cdk (Infrastructure as a code)**

## Our Mission

Nx is great and simplifying the tool-chains for _continous integrations_ inside a mono-repository. As a developer who has to do operations as well, we would like to see the delivery/deployment side of things to be super awsome as well!

**So we decided to build plugins on top of the nx workspace to add the ability of seamless delivery/deployment of our projects to the designated cloud providers. :metal:**

## Feature sets to support

### Node-Typescript

| Framework Name       | AWS                | Azure      | GCP        |
| -------------------- | ------------------ | ---------- | ---------- |
| Serverless Framework | :white_check_mark: | :calendar: | :calendar: |
| AWS-CDK              | :calendar:         | :x:        | :x:        |

### Angular Universal

| Application                 | AWS        | Azure      | GCP        |
| --------------------------- | ---------- | ---------- | ---------- |
| Other Natives (e.g. Pulumi) | :x:        | :calendar: | :calendar: |
| AWS-CDK                     | :calendar: | :x:        | :x:        |

### Serverless Framework

| Infrastructure Elements | AWS                | Azure      | GCP        |
| ----------------------- | ------------------ | ---------- | ---------- |
| Custom Domain           | :calendar:         | :calendar: | :calendar: |
| Deploy                  | :white_check_mark: | :calendar: | :calendar: |
| Destroy                 | :white_check_mark: | :calendar: | :calendar: |

### Infrastructure as a code

| Infrastructure Elements | AWS        | Azure      | GCP        |
| ----------------------- | ---------- | ---------- | ---------- |
| Custom Domain           | :calendar: | :calendar: | :calendar: |
| Deploy                  | :calendar: | :calendar: | :calendar: |
| Destroy                 | :calendar: | :calendar: | :calendar: |

## Getting Started

### To Deploy an Existing Angular Application adding Ng-Universal in the process

First you need to create an nx workspace to get started!

**Using npx**

```
npx create-nx-workspace # Then you got to use yarn/npm
nx add @flowaccount/nx-serverless # or with these options --project=myangularapp --provider=aws --addUniversal=yes
```

**Using npm**

```
npm init nx-workspace
nx add @flowaccount/nx-serverless # or with these options --project=myangularapp --provider=aws --addUniversal=yes
```

**Using yarn**

```
yarn create nx-workspace
nx add @flowaccount/nx-serverless # or with these options --project=myangularapp --provider=aws --addUniversal=yes
```

**Deploying/Compiling application (Assuming you have nx added globally, otherwise use npx/npm/yarn!)**

```
nx run myangularapp:offline # to run the universal app offline checking serverless works locally
nx deploy myangularapp # to deploy the app
nx run myangularapp:destroy # to destroy the app
nx run myangularapp:compile # to compile only the serverless part of the app
```

### To Create and Deploy Node-Typescript Serverless Application

**Using npx**

```
npx create-nx-workspace # Then you got to use yarn/npm
nx g @flowaccount/nx-serverless:api-serverless --name=myapi --provider=aws
```

**Using npm**

```
npm init nx-workspace
nx g @flowaccount/nx-serverless:api-serverless --name=myapi --provider=aws
```

**Using yarn**

```
yarn create nx-workspace
nx g @flowaccount/nx-serverless:api-serverless --name=myapi--provider=aws
```

**Deploying/Compiling application (Assuming you have nx added globally, otherwise use npx/npm/yarn!)**

```
nx serve myapi --port=7777 # to serve the api locally on port 7777
nx deploy myapi --stage=dev# to deploy the api
nx build myapi # to build the api
```

**To Debug your deployments**
Edit the `env.json` files generated by the schematics. change `SLS_DEBUG` to `true`

## For Angular Universal Application

the resulting file tree will look like this:

```
<workspace name>/
├── apps/
│   ├── myangularapp/
|   ├───────────────handler.ts
|   ├───────────────serverless.yml
|   ├───────────────tsconfig.serverless.json
├── libs/
├── tools/
├── nx.json
├── package.json
├── tsconfig.json
└── tslint.json
```

The existing angular project in workspace.json/angular.json will be updated with these sections

```
compile: {
  builder: '@flowaccount/nx-serverless:compile',
  configurations: {
   ...
  },
  options: {
   ...
  }
},
deploy: {
  builder: '@flowaccount/nx-serverless:deploy',
  options: {
    ...
  }
},
destroy: {
  builder: '@flowaccount/nx-serverless:destroy',
  options: {
  ...
  }
},
offline: {
  builder: '@flowaccount/nx-serverless:offline',
  configurations: {
   ...
  },
  options: {
   ...
  }
 }
}
```

## For Node-Typescript Api Application

the resulting file tree will look like this:

```
<workspace name>/
├── apps/
│   ├── myapi/
|   ├────────src/handler.ts
|   ├────────jest.config.js
|   ├────────tsconfig.json
|   ├────────serverless.yml
|   ├────────tsconfig.app.json
|   ├────────tsconfig.spec.json
|   ├────────tslint.json
├── libs/
├── tools/
├── nx.json
├── package.json
├── tsconfig.json
└── tslint.json
```

you workspace.json will be added with these

```
build: {
  builder: '@flowaccount/nx-serverless:build',
  configurations: {
   ...
  },
  options: {
    ...
  }
},
deploy: {
  builder: '@flowaccount/nx-serverless:deploy',
  options: {
   ...
  }
},
destroy: {
  builder: '@flowaccount/nx-serverless:destroy',
  options: {
   ...
  }
},
lint: {
  builder: '@angular-devkit/build-angular:tslint',
  options: {
   ...
  }
},
serve: {
  builder: '@flowaccount/nx-serverless:offline',
  configurations: {
    ...
  },
  options: {
    ...
  }
},
test: {
  builder: '@nrwl/jest:jest',
  options: {
    ...
  }
 }
}
```

## Want to help?

You are most welcome to help! Please file a bug or submit a PR, read the [guidelines for contributing](https://github.com/flowaccount/nx-plugins/blob/master/CONTRIBUTING.md) and start right on!
