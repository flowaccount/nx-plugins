## Prerequisites

- Have an existing nx workspace. For creating this, see [nrwl's documentation](https://nx.dev/latest/angular/getting-started/nx-setup).
- Add `"aws-cdk": "1.114.0",` to your `package.json` and run `yarn`

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


## ECS environment file example

```
import { Peer, Port } from "@aws-cdk/aws-ec2"
import { PlacementConstraint } from "@aws-cdk/aws-ecs"
import { ServicePrincipal } from "@aws-cdk/aws-iam"
import { AppEnvModel } from '@flowaccount/core/cdk'

const _region = `ap-southeast-1`
const _appprefix = `AppName`
const _stage = `fadev`
const _app = `app-name`
const _ecr = `xxxxxxxxxxxx.dkr.ecr.ap-southeast-1.amazonaws.com/<orgname>/`

export const environment: AppEnvModel = {
    appprefix: _appprefix,
    stage: _stage,
    app: _app,
    awsCredentials: { 
        account: "xxxxxxxxxxxx", 
        region: _region
    },
    vpc: {
      vpcAttributes: {
          vpcId:  `vpc-xxxxxxxxxxxxxxxxx`,
          availabilityZones: [ `${_region}a`, `${_region}b` ],
          privateSubnetIds: [ `subnet-xxxxxxxxxxxxxxxxx`, `subnet-xxxxxxxxxxxxxxxxx` ]
      }
    },
    ecs: {
      securityGroup: {
          name: `${_app}-${_stage}-ecs-sg-stack`,
          inboudRule: [
              { peer: Peer.anyIpv4(), connection: Port.allTcp() }
          ]
      },
      policy: {
          statement: {
              actions: [
                  `ec2:*`,
                  `s3:*`,
                  `ecs:CreateCluster`,
                  `ecs:DeregisterContainerInstance`,
                  `ecs:DiscoverPollEndpoint`,
                  `ecs:Poll`,
                  `ecs:RegisterContainerInstance`,
                  `ecs:StartTelemetrySession`,
                  `ecs:UpdateContainerInstancesState`,
                  `ecs:Submit*`,
                  `ecr:GetAuthorizationToken`,
                  `ecr:BatchCheckLayerAvailability`,
                  `ecr:GetDownloadUrlForLayer`,
                  `ecr:BatchGetImage`,
                  `logs:CreateLogGroup`,
                  `logs:CreateLogStream`,
                  `logs:PutLogEvents`,
                  `logs:DescribeLogStreams`,
                  `secretsmanager:GetSecretValue`
              ],
              resources: [
                  `*`
              ]
          },
          name: `${_app}-${_stage}-cluster-policy`
      },
      role: {
          name: `${_app}-${_stage}-cluster-role`,
          assumedBy: new ServicePrincipal(`ec2.amazonaws.com`)
      },
      policyAssume: {
        statement: {
            actions: [
                "secretsmanager:GetSecretValue",
                "ssm:Get*",
            ],
            resources: [
                `*`


            ]
        },
        name: `${_app}-${_stage}-cluster-policy-assume`
      },
      roleAssume: {
        name: `${_app}-${_stage}-cluster-role-assume`,
        assumedBy: [new ServicePrincipal(`ecs-tasks.amazonaws.com`), new ServicePrincipal(`ec2.amazonaws.com`)]
      },
      taskRoleAssume: {
          name: `${_app}-${_stage}-cluster-taskRole-assume`,
          assumedBy: [new ServicePrincipal(`ecs-tasks.amazonaws.com`), new ServicePrincipal(`ec2.amazonaws.com`)]
      },
      instanceProfile: {
          name: `${_app}-${_stage}-cluster-instance-profile`
      },
      asgList: [
          {
              launchTemplate: {
                  name: `${_app}-${_stage}-lt`,
                  instanceType: "t3.micro",
                  keyName: "fadev",
                  version: 1
              },
              asg: {
                  name: `${_app}-${_stage}-asg`,
                  min: "1",
                  max: "3",
                  desired: "3",
                  overrides: [
                        {
                            InstanceType: "t3.micro"
                        },
                        {
                            InstanceType: "t3a.micro"
                        }
                    ],
                  onDemandBaseCapacity: 0,
                  onDemandPercentage: 0,
                  protectionFromScaleIn: false
              }
          }
      ],
      executionRoleName: `ECSTaskExecutionRole`, // arn:aws:iam::697698820969:role/
      clusterName: `${_app}-${_stage}-cluster`
    },
    service: [
        {
            
            taskDefinition: {
                name: `${_app}-${_stage}-taskdef`,
                containerDefinitionOptions: {
                    image: `${_ecr}:latest-${_stage}`,
                    memoryLimitMiB: 235,
                    cpu: 512,
                    hostname: `${_app}-${_stage}`
                },
                portMapping: [
                    { hostPort: 0, containerPort: 8080 }
                ]
            },
            name: `${_app}-${_stage}-service`,
            desired: 1,
            minHealthyPercent: 0,
            placementConstraint: [
                PlacementConstraint.memberOf(`attribute:ecs.os-type == linux and attribute:ecs.instance-type in [t3.micro, t3a.micro]`)
            ],
            targetGroupArn: `arn:aws:elasticloadbalancing:ap-southeast-1:697698820969:targetgroup/crm-fadev-tg/fcf09968fd4c148c`
        },
        {
            taskDefinition: {
                name: `${_app}-storybook-${_stage}-taskdef`,
                containerDefinitionOptions: {
                    image: `${_ecr}:latest-storybook-${_stage}`,
                    memoryLimitMiB: 235,
                    cpu: 512,
                    hostname: `${_app}-storybook-${_stage}`
                },
                portMapping: [
                    { hostPort: 0, containerPort: 8080 }
                ]
            },
            name: `${_app}-storybook-${_stage}-service`,
            desired: 1,
            minHealthyPercent: 0,
            placementConstraint: [
                PlacementConstraint.memberOf(`attribute:ecs.os-type == linux and attribute:ecs.instance-type in [t3.micro, t3a.micro]`)
            ],
            targetGroupArn: `arn:aws:elasticloadbalancing:ap-southeast-1:697698820969:targetgroup/storybook-staging-tg/25a353e4b8fd3123`
        },
        {
            taskDefinition: {
                name: `${_app}-developer-handbook-${_stage}-taskdef`,
                containerDefinitionOptions: {
                    image: `${_ecr}:latest-developer-handbook-${_stage}`,
                    memoryLimitMiB: 235,
                    cpu: 512,
                    hostname: `${_app}-developer-handbook-${_stage}`
                },
                portMapping: [
                    { hostPort: 0, containerPort: 80 }
                ]
            },
            name: `${_app}-developer-handbook-${_stage}-service`,
            desired: 1,
            minHealthyPercent: 0,
            placementConstraint: [
                PlacementConstraint.memberOf(`attribute:ecs.os-type == linux and attribute:ecs.instance-type in [t3.micro, t3a.micro]`)
            ],
            targetGroupArn: `arn:aws:elasticloadbalancing:ap-southeast-1:697698820969:targetgroup/developer-handbook-staging-tg/1239e837cd2fc44d`
        }
    ],
    tag: [
        {key: "AppStack", value: `${_app}-${_stage}-stack`}
    ]
}
```

## argument setup
add to libs\nx-aws-cdk\src\builders\deploy\deploy.executor.ts

nx: yarn publish-local
workspace: yarn upgrade nx-aws-cdk