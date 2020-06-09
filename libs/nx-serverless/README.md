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
[![@flowaccount/nx-serverless](https://img.shields.io/badge/%40flowaccount-nx--serverless-blue)](https://github.com/flowaccount/nx-plugins/tree/master/libs/nx-serverless)
[![NPM Version](https://badge.fury.io/js/%40flowaccount%2Fnx-serverless.svg)](https://www.npmjs.com/@flowaccount/nx-serverless)
[![Typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label)](https://www.typescriptlang.org/)
[![CircleCI](https://circleci.com/gh/flowaccount/nx-plugins.svg?style=svg)](https://circleci.com/gh/flowaccount/nx-plugins)

</div>

<hr>

# What is Nx

🔎 **Extensible Dev Tools for Monorepos.**

# What is @flowaccount/nx-serverless

🔎 **Extensible Continous Delivery/Depolyment Tools on top of Nx workspace for Serverless Framework. Because on multiple lambda in one repository is an awesome thing!**

## Our Mission

Simplify any workflow that can be abstracted into one command using the same configuration structure as `angular.json`, `workspace.json` or `nx.json`. Make development life-cycle easier, more effective and having less rituals. Communication through configurations and not documentations.

## Feature sets to support for Serverless Framework

### Frameworks Schematics

| Framework Name                          | AWS                | Azure      | GCP        |
| --------------------------------------- | ------------------ | ---------- | ---------- |
| Node-Typescript (Webpack)               | :white_check_mark: | :calendar: | :calendar: |
| Angular Universal (Typescript-compiler) | :white_check_mark: | :calendar: | :calendar: |
| Express-js (Typescript-compiler)        | :white_check_mark: | :calendar: | :calendar: |

### Serverless Framework Commands

| Command Names      | AWS                | Azure      | GCP        |
| ------------------ | ------------------ | ---------- | ---------- |
| Deploy             | :white_check_mark: | :calendar: | :calendar: |
| Destroy            | :white_check_mark: | :calendar: | :calendar: |
| Sls Command        | :white_check_mark: | :calendar: | :calendar: |
| Serverless-offline | :white_check_mark: | :calendar: | :calendar: |

### Builders wrapped before packaging/deployment

| Builder Names       |                    |
| ------------------- | ------------------ |
| Webpack compiler    | :white_check_mark: |
| Typescript compiler | :white_check_mark: |

Whats special about the plugin is that, you **DO NOT** need to use `serverless-wepack` or `serverless-typescript` plugins anymore! The library uses angular builders to _build_ or typescript compilers to _compile_ your code for you into javascript before _packaging_ them into a zip file and _deploy_ them to the serverless cloud.

### Package.json dependency resolvers

| Resolver Names |                    |
| -------------- | ------------------ |
| Webpack stats  | :white_check_mark: |
| Depcheck       | :white_check_mark: |

The other special thing that the library does is, it uses `webpack stats` to build up your `dependencies` and write a `package.json` into your `dist` folder in the attempt to minimize the amount of `dependencies` in your `node_modules` needed to be uploaded to the cloud.

For typescript compilers it uses `dep-checks` to resolve the dependencies and write up a `package.json` file

## Getting Started

### To Deploy an Existing Angular Application adding Ng-Universal in the process

First you need to create an nx workspace to get started!

**Using npx**

```bash
npx create-nx-workspace # Then you got to use yarn/npm
nx add @flowaccount/nx-serverless # or with these options --project=my-app --provider=aws --addUniversal=yes
```

**Using npm**

```bash
npm init nx-workspace
nx add @flowaccount/nx-serverless # or with these options --project=my-app --provider=aws --addUniversal=yes
```

**Using yarn**

```bash
yarn create nx-workspace
nx add @flowaccount/nx-serverless # or with these options --project=my-app --provider=aws --addUniversal=yes
```

**Deploying/Compiling application (Assuming you have nx added globally, otherwise use npx/npm/yarn!)**

```bash
nx run my-app:offline # to run the universal app offline checking serverless works locally
nx deploy my-app # to deploy the app
nx run my-app:destroy # to destroy the app
nx run my-app:compile # to compile only the serverless part of the app
```

**Running custom sls commands application (Assuming you have nx added globally, otherwise use npx/npm/yarn!)**

```bash
nx run my-app:sls # to run the custom sls commands as per what you need!
```

### To Create and Deploy Node-Typescript Serverless Application

**Using npx**

```bash
npx create-nx-workspace # Then you got to use yarn/npm
nx g @flowaccount/nx-serverless:api-serverless --name=myapi --provider=aws
```

**Using npm**

```bash
npm init nx-workspace
nx g @flowaccount/nx-serverless:api-serverless --name=myapi --provider=aws
```

**Using yarn**

```bash
yarn create nx-workspace
nx g @flowaccount/nx-serverless:api-serverless --name=myapi--provider=aws
```

**Deploying/Compiling application (Assuming you have nx added globally, otherwise use npx/npm/yarn!)**

```bash
nx serve myapi --port=7777 # to serve the api locally on port 7777
nx deploy myapi --stage=dev# to deploy the api
nx build myapi # to build the api
```

**To Debug your deployments**
Edit the `env.json` files generated by the schematics. change `SLS_DEBUG` to `true`

## For Expressjs/Angular Universal Application

the resulting file tree will look like this:

```bash
<workspace name>/
├── apps/
│   ├── my-app/
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

```json
"compile": {
  "builder": "@flowaccount/nx-serverless:compile",
  "configurations": {
   ...
  },
  "options": {
   ...
  }
},
"deploy": {
  "builder": "@flowaccount/nx-serverless:deploy",
  "options": {
    ...
  }
},
"destroy": {
  "builder": "@flowaccount/nx-serverless:destroy",
  "options": {
  ...
  }
},
"offline": {
  "builder": "@flowaccount/nx-serverless:offline",
  "configurations": {
   ...
  },
  "options": {
   ...
  }
 }
}
"sls": {
        "builder": "@flowaccount/nx-serverless:sls",
        "options": {
          "waitUntilTargets": [],
          "buildTarget": "my-app:build:production",
          "config": "apps/my-app/serverless.yml",
          "location": "dist/apps/my-app",
          "package": "dist/apps/my-app",
          "command": "package",
         },
        "configurations": {
          "deploy-dev": {
            "buildTarget": "my-app:build:dev",
            "command": "deploy",
            "stage": "dev"
          },
            "deploy-production": {
            "buildTarget": "my-app:build:production",
            "command": "deploy",
            "stage": "prod"
          }
        }
    }
```

## For Node-Typescript Api Application

the resulting file tree will look like this:

```bash
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

```json
"build": {
  "builder": "@flowaccount/nx-serverless:build",
  "configurations": {
   ...
  },
  "options": {
    ...
  }
},
"deploy": {
  "builder": "@flowaccount/nx-serverless:deploy",
  "options": {
    "waitUntilTargets": ["myapi:some-other-builder"],
    "buildTarget": "myapi:build:production",
    "config": "apps/myapi/serverless.yml",
    "location": "dist/static/apps/myapi",
    "package": "dist/static/apps/myapi"
  },
    "configurations": {
    "staging": {
      "buildTarget": "myapi:build:staging",
      "waitUntilTargets": ["myapi:some-other-builder:staging"],
      "stage": "staging"
    },
    "production": {
      "buildTarget": "myapi:build:production",
      "waitUntilTargets": ["myapi:some-other-builder:production"],
      "stage": "production"
    }
  }
},
"destroy": {
  "builder": "@flowaccount/nx-serverless:destroy",
  "options": {
   ...
  }
},
"sls": {
  "builder": "@flowaccount/nx-serverless:sls",
  "options": {
    ...
  }
 }
}
"lint": {
  "builder": "@angular-devkit/build-angular:tslint",
  "options": {
   ...
  }
},
"serve": {
  "builder": "@flowaccount/nx-serverless:offline",
  "configurations": {
    ...
  },
  "options": {
    ...
  }
},
"test": {
  "builder": "@nrwl/jest:jest",
  "options": {
    ...
  }
 }
}
```

## Want to help?

You are most welcome to help! Please file a bug or submit a PR, read the [guidelines for contributing](https://github.com/flowaccount/nx-plugins/blob/master/CONTRIBUTING.md) and start right on!
