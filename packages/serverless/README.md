# @nx/serverless

[Angular CLI](https://cli.angular.io) Builders for [Serverless Framework](https://serverless.com/cli/) projects,
designed for use alongside [nx](https://nx.dev)

## Why

nx superpowers the angular CLI, to add support for a range of backend project types.

However, what if your backend uses Serverless?

This project includes builders for that!

-   @nx/Serverless:build - builds your functions and layers
-   @nx/Serverless:package - packages your Serverless template ready for deployment
-   @nx/Serverless:deploy - deploys your CloudFormation template

## @nx/Serverless:build

Add the following to your `angular.json`

```json
{
    "api": {
        "root": "apps/api",
        "sourceRoot": "apps/api/src",
        "projectType": "application",
        "prefix": "api",
        "schematics": {},
        "architect": {
            "build": {
                "builder": "@nx/Serverless:build",
                "options": {
                    "outputPath": "dist/apps/api",
                    "template": "apps/api/template.yaml",
                    "tsConfig": "apps/api/tsconfig.app.json"
                },
            ...
            }
        }
    }
}
```
