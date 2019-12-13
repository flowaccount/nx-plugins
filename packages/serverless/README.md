# @flowaccount/nx-serverless

[Angular CLI](https://cli.angular.io) Builders for [Serverless Framework](https://serverless.com/cli/) projects,
designed for use alongside [nx](https://nx.dev)

<div align="left">

[![License](https://img.shields.io/npm/l/@flowaccount/nx-serverless.svg?style=flat-square)]()
[![NPM Version](https://badge.fury.io/js/%40flowaccount%2Fnx.svg)](https://www.npmjs.com/@flowaccount/nx-serverless)

</div>

## Why

nx superpowers the angular CLI, to add support for a range of backend project types.

However, what if your backend uses Serverless?

This project includes builders for that!

-   @flowaccount/nx-Serverless:build - builds your functions and layers
-   @flowaccount/nx-Serverless:offline - runs your serverless application offline for debugging and development
-   @flowaccount/nx-Serverless:deploy - deploys your CloudFormation template

```
ng g @flowaccount/nx-serverless:api
```
This will Add the following to your `angular.json`

```json
{
    "api": "root": "api",
      "sourceRoot": "api/src",
      "projectType": "application",
      "prefix": "frontend-flowaccount-landing-ssr",
      "schematics": {},
      "architect": {
        "build": {
          "builder": "@flowaccount/nx-serverless:build",
          "options": {
            "outputPath": "dist/ap",
            "serverlessConfig": "api/serverless.yml",
            "servicePath": "api",
            "tsConfig": "api/tsconfig.app.json",
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
                  "replace": "api/environment.ts",
                  "with": "api/environment.prod.ts"
                }
              ]
            }
          }
        },
        "serve": {
          "builder": "@flowaccount/nx-serverless:offline",
          "options": {
            "waitUntilTargets": [  "frontend-flowaccount-landing:build", "frontend-flowaccount-landing:server"],
            "buildTarget": "frontend-flowaccount-landing-ssr:build",
            "config": "api/serverless.yml",
            "location": "dist/ap"
          },
          "configurations": {
            "dev": {
              "buildTarget": "frontend-flowaccount-landing-ssr:build:dev"
            },
            "production": {
              "buildTarget": "frontend-flowaccount-landing-ssr:build:production"
            }
          }
        },
        "deploy": {
          "builder": "@flowaccount/nx-serverless:deploy",
          "options": {
            "buildTarget": "frontend-flowaccount-landing-ssr:build:production",
            "config": "api/serverless.yml",
            "location": "dist/ap",
            "package": "dist/ap"
          }
        },
        "lint": {
          "builder": "@angular-devkit/build-angular:tslint",
          "options": {
            "tsConfig": [
              "api/tsconfig.app.json",
              "api/tsconfig.spec.json"
            ],
            "exclude": [
              "**/node_modules/**",
              "!api/**"
            ]
          }
        },
        "test": {
          "builder": "@nrwl/jest:jest",
          "options": {
            "jestConfig": "api/jest.config.js",
            "tsConfig": "api/tsconfig.spec.json"
          }
        }
      }
    }
}
```
