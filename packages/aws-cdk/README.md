# @nx/aws-cdk

[Angular CLI](https://cli.angular.io) Builders for [aws-cdk Framework](https://aws.amazon.com/cdk/) projects,
designed for use alongside [nx](https://nx.dev)

## Why

nx superpowers the angular CLI, to add support for a range of backend project types.

However, what if your backend uses aws-cdk?

This project includes builders for that!

-   @nx/aws-cdk:build - builds your functions and layers
-   @nx/aws-cdk:package - packages your aws-cdk template ready for deployment
-   @nx/aws-cdk:deploy - deploys your CloudFormation template

## @nx/aws-cdk:build

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
                "builder": "@nx/aws-cdk:build",
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
