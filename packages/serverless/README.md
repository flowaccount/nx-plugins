# @flowaccount/nx-serverless

[Angular CLI](https://cli.angular.io) Builders for [Serverless Framework](https://serverless.com/cli/) projects,
designed for use alongside [nx](https://nx.dev)

<div align="left">

[![License](https://img.shields.io/npm/l/@flowaccount/nx-serverless.svg?style=flat-square)]()
[![NPM Version](https://badge.fury.io/js/%40flowaccount%2Fnx-serverless.svg)](https://www.npmjs.com/@flowaccount/nx-serverless)

</div>

<p float="left">
<img src="https://raw.githubusercontent.com/nrwl/nx/master/nx-logo.png" height="100">
<img src="https://miro.medium.com/max/900/1*dSqXPEWnNgUhEmCrjxRI4Q.png" height="145">
<img src="https://user-images.githubusercontent.com/2752551/30405068-a7733b34-989e-11e7-8f66-7badaf1373ed.png" height="120">
</p>


## Why

nx superpowers the angular CLI, to add support for a range of backend project types.

However, what if your backend uses Serverless?

This project includes toolsets for generating building, testing and deploying for that.

-   ```ng build api``` - builds your functions and layers
-   ```ng serve api``` - runs your serverless application offline for debugging and development
-   ```ng deploy api``` - deploys your serverless api

```
ng g @flowaccount/nx-serverless:api
```
This will Add the following to your `angular.json`

```json
{
    "api-hello-world": {
      "root": "apps/api/hello-world",
      "sourceRoot": "apps/api/hello-world/src",
      "projectType": "application",
      "prefix": "api-hello-world",
      "schematics": {},
      "architect": {
        "build": {
          "builder": "@flowaccount/nx-serverless:build",
          "options": {
            "outputPath": "dist/apps/api/hello-world",
            "package": "app/apps/api/hello-world",
            "serverlessConfig": "apps/api/hello-world/serverless.yml",
            "servicePath": "apps/api/hello-world",
            "tsConfig": "apps/api/hello-world/tsconfig.app.json",
            "provider": "aws",
            "watch": true,
            "progress": true
          },
          "configurations": {
            "dev": {
              "optimization": false,
              "sourceMap": false,
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "2mb",
                  "maximumError": "5mb"
                }
              ]
            },
            "production": {
              "optimization": true,
              "sourceMap": false,
              "extractCss": true,
              "namedChunks": false,
              "extractLicenses": true,
              "vendorChunk": false,
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "2mb",
                  "maximumError": "5mb"
                }
              ],
              "fileReplacements": [
                {
                  "replace": "apps/api/hello-world/environment.ts",
                  "with": "apps/api/hello-world/environment.prod.ts"
                }
              ]
            }
          }
        },
        "serve": {
          "builder": "@flowaccount/nx-serverless:offline",
          "options": {
            "buildTarget": "api-hello-world:build",
            "config": "apps/api/hello-world/serverless.yml",
            "location": "dist/apps/api/hello-world"
          },
          "configurations": {
            "dev": {
              "buildTarget": "api-hello-world:build:dev"
            },
            "production": {
              "buildTarget": "api-hello-world:build:production"
            }
          }
        },
        "deploy": {
          "builder": "@flowaccount/nx-serverless:deploy",
          "options": {
            "buildTarget": "api-hello-world:build:production",
            "config": "apps/api/hello-world/serverless.yml",
            "location": "dist/apps/api/hello-world",
            "package": "dist/apps/api/hello-world"
          }
        },
        "lint": {
          "builder": "@angular-devkit/build-angular:tslint",
          "options": {
            "tsConfig": [
              "apps/api/hello-world/tsconfig.app.json",
              "apps/api/hello-world/tsconfig.spec.json"
            ],
            "exclude": [
              "**/node_modules/**",
              "!apps/api/hello-world/**"
            ]
          }
        },
        "test": {
          "builder": "@nrwl/jest:jest",
          "options": {
            "jestConfig": "apps/api/hello-world/jest.config.js",
            "tsConfig": "apps/api/hello-world/tsconfig.spec.json"
          }
        }
      }
}
```
