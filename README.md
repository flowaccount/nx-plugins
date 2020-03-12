<p float="left">
<img src="https://raw.githubusercontent.com/nrwl/nx/master/nx-logo.png" height="100">
<img src="https://angular.io/assets/images/logos/angular/angular.svg" height="145">
<!-- <img src="https://angular.io/generated/images/marketing/concept-icons/universal.png" height="120"> -->
<img src="https://upload.wikimedia.org/wikipedia/commons/d/d9/Node.js_logo.svg" height="145">
</p>

<div align="left">

[![License](https://img.shields.io/npm/l/@flowaccount/nx-serverless.svg?style=flat-square)]()

</div>

<div align="left">

[![@flowaccount/nx-serverless](https://img.shields.io/badge/%40flowaccount-nx--serverless-blue)](https://github.com/flowaccount/flowaccount-nx/tree/master/packages/serverless)
[![NPM Version](https://badge.fury.io/js/%40flowaccount%2Fnx-serverless.svg)](https://www.npmjs.com/@flowaccount/nx-serverless)

</div>

<hr>

# What is Nx

🔎 **Extensible Dev Tools for Monorepos.**

# What is @flowaccount/nx-plugins

🔎 **Extensible Continous Delivery/Depolyment Tools on top of Nx workspace for seamless deployments with frameworks like Serverless, Lambda, Azure Functions, Google Functions and AWS Cdk (Infrastructure as a code)**

## Our Mission

Nx is great and simplifying the tool-chains for *continous integrations* inside a mono-repository. As a developer who has to do operations as well, we would like to see the delivery/deployment side of things to be super awsome as well!

**So we decided to build plugins on top of the nx workspace to add the ability of seamless delivery/deployment of our projects to the designated cloud providers. :metal:**

## Feature sets to support

### Node-Typescript

Framework Name | AWS | Azure | GCP
---------|----------|---------|---------
 Serverless Framework | :white_check_mark: | :calendar: | :calendar:
 AWS-CDK | :calendar: | :x: | :x:

### Angular Universal

Application | AWS | Azure | GCP
---------|----------|---------|---------
 Other Natives (e.g. Pulumi) | :x: | :calendar: | :calendar:
 AWS-CDK | :calendar: | :x: | :x:

### Serverless Framework

Infrastructure Elements | AWS | Azure | GCP
---------|----------|---------|---------
 Custom Domain | :calendar: | :calendar: | :calendar:
 Deploy | :white_check_mark: | :calendar: | :calendar:
 Destroy | :white_check_mark: | :calendar: | :calendar:

### Infrastructure as a code

Infrastructure Elements | AWS | Azure | GCP
---------|----------|---------|---------
 Custom Domain | :calendar: | :calendar: | :calendar:
 Deploy | :calendar: | :calendar: | :calendar:
 Destroy | :calendar: | :calendar: | :calendar:

## Getting Started

### To Deploy an Existing Angular Application adding Ng-Universal in the process

First you need to create an nx workspace to get started!

**Using npx to create workspace, then use yarn/npm to continue**
```
npx create-nx-workspace # Then you got to use yarn/npm
```
**Using npm**
```
npm init nx-workspace
npm nx add @flowaccount/nx-serverless # or with these options --project=myangularapp --provider=aws --addUniversal=yes
npm nx run myangularapp:offline # to run the universal app offline checking serverless works locally
npm nx deploy myangularapp # to deploy the app
npm nx run myangularapp:destroy # to destroy the app
npm nx run myangularapp:compileServerless # to compile only the serverless part of the app
```
**Using yarn**
```
yarn create nx-workspace
yarn nx add @flowaccount/nx-serverless # or with these options --project=myangularapp --provider=aws --addUniversal=yes
yarn nx run myangularapp:offline # to run the universal app offline checking serverless works locally
yarn nx deploy myangularapp # to deploy the app
yarn nx run myangularapp:destroy # to destroy the app
yarn nx run myangularapp:compileServerless # to compile only the serverless part of the app
```

### To Create and Deploy Node-Typescript Serverless Application

**Using npm**
```
npm nx generate @flowaccount/nx-serverless:api-serverless --name=myapi --provider=aws
npm nx serve myapi --port=7777 # to serve the api locally on port 7777
npm nx deploy myapi # to deploy the api
npm nx build myapi # to build the api
```

**Using yarn**
```
yarn nx generate @flowaccount/nx-serverless:api-serverless --name=myapi--provider=aws
yarn nx serve myapi --port=7777 # to serve the api locally on port 7777
yarn nx deploy myapi # to deploy the api
yarn nx build myapi # to build the api
```

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
compileServerless: {
  builder: '@flowaccount/nx-serverless:compile',
    configurations: {
    dev: {
      budgets: [
        {
          maximumWarning: '2mb',
          maximumError: '5mb',
          type: 'initial'
        }
      ],
        optimization: false,
          sourceMap: false
    },
    production: {
      budgets: [
        {
          maximumWarning: '2mb',
          maximumError: '5mb',
          type: 'initial'
        }
      ],
        extractCss: true,
          extractLicenses: true,
            fileReplacements: [
              {
                replace: 'apps/myangularapp/environment.ts',
                with: 'apps/myangularapp/environment.prod.ts'
              }
            ],
              namedChunks: false,
                optimization: true,
                  sourceMap: false,
                    vendorChunk: false,
    }
  },
  options: {
    outputPath: 'dist',
      package: 'apps/myangularapp',
        processEnvironmentFile: 'env.json',
          serverlessConfig: 'apps/myangularapp/serverless.yml',
            servicePath: 'apps/myangularapp',
              tsConfig: 'apps/myangularapp/tsconfig.serverless.json',
                skipClean: true
  }
},
deploy: {
  builder: '@flowaccount/nx-serverless:deploy',
    options: {
    waitUntilTargets: [
      'myangularapp:build:production',
      'myangularapp:server:production',
    ],
      buildTarget: 'myangularapp:compileServerless:production',
        config: 'apps/myangularapp/serverless.yml',
          location: 'dist/apps/myangularapp',
            package: 'dist/apps/myangularapp'
  }
},
destroy: {
  builder: '@flowaccount/nx-serverless:destroy',
    options: {
    buildTarget: 'myangularapp:compileServerless:production',
      config: 'apps/myangularapp/serverless.yml',
        location: 'dist/apps/myangularapp',
          package: 'dist/apps/myangularapp'
  }
},
offline: {
  builder: '@flowaccount/nx-serverless:offline',
    configurations: {
    dev: {
      buildTarget: 'myangularapp:compileServerless:dev'
    },
    production: {
      buildTarget: 'myangularapp:compileServerless:production'
    }
  },
  options: {
    waitUntilTargets: [
      'myangularapp:build',
      'myangularapp:server',
    ],
      buildTarget: 'myangularapp:compileServerless',
        config: 'apps/myangularapp/serverless.yml',
          location: 'dist/apps/myangularapp'
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
    dev: {
      budgets: [
        {
          maximumWarning: '2mb',
          maximumError: '5mb',
          type: 'initial'
        }
      ],
        optimization: false,
          sourceMap: false
    },
    production: {
      budgets: [
        {
          maximumWarning: '2mb',
          maximumError: '5mb',
          type: 'initial'
        }
      ],
        extractCss: true,
          extractLicenses: true,
            fileReplacements: [
              {
                replace: 'apps/myapi/environment.ts',
                with: 'apps/myapi/environment.prod.ts'
              }
            ],
              namedChunks: false,
                optimization: true,
                  sourceMap: false,
                    vendorChunk: false,
    }
  },
  options: {
    outputPath: 'dist/apps/myapi',
      package: 'apps/myapi',
        processEnvironmentFile: 'env.json',
          serverlessConfig: 'apps/myapi/serverless.yml',
            servicePath: 'apps/myapi',
              tsConfig: 'apps/myapi/tsconfig.app.json'
  }
},
deploy: {
  builder: '@flowaccount/nx-serverless:deploy',
    options: {
    buildTarget: 'myapi:build:production',
      config: 'apps/myapi/serverless.yml',
        location: 'dist/apps/myapi',
          package: 'dist/apps/myapi'
  }
},
destroy: {
  builder: '@flowaccount/nx-serverless:destroy',
    options: {
    buildTarget: 'myapi:build:production',
      config: 'apps/myapi/serverless.yml',
        location: 'dist/apps/myapi',
          package: 'dist/apps/myapi'
  }
},
lint: {
  builder: '@angular-devkit/build-angular:tslint',
    options: {
    exclude: [
      '**/node_modules/**',
      '!apps/myapi/**'
    ],
      tsConfig: [
        'apps/myapi/tsconfig.app.json',
        'apps/myapi/tsconfig.spec.json'
      ]
  }
},
serve: {
  builder: '@flowaccount/nx-serverless:offline',
    configurations: {
    dev: {
      buildTarget: 'myapi:build:dev'
    },
    production: {
      buildTarget: 'myapi:build:production'
    }
  },
  options: {
    buildTarget: 'myapi:build',
      config: 'apps/myapi/serverless.yml',
        location: 'dist/apps/myapi'
  }
},
test: {
  builder: '@nrwl/jest:jest',
    options: {
    jestConfig: 'apps/myapi/jest.config.js',
      passWithNoTests: true,
        tsConfig: 'apps/myapi/tsconfig.spec.json'
  }
}
}
```