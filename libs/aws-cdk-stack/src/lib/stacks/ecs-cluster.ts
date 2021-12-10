import { IVpc } from '@aws-cdk/aws-ec2'
import { Cluster } from '@aws-cdk/aws-ecs'
import { Policy, PolicyStatement, Role } from '@aws-cdk/aws-iam'
import { Stack, Construct,  StackProps, Tags } from '@aws-cdk/core'
import { logger } from '@nrwl/devkit'
import { ECSModel, TagModel } from '../types'


interface ECSClusterProps extends StackProps {
  readonly vpc: IVpc
  readonly ecs: ECSModel
  readonly taglist: TagModel[]
}

export class ECSCluster extends Stack {

  readonly cluster: Cluster
  readonly executionRole: Role

  constructor(scope: Construct, id: string, stackProps: ECSClusterProps) {
    super(scope, id, stackProps)

    logger.info("creating the ecs execution policy");

    const _policyStatements: PolicyStatement[] = []
    stackProps.ecs.executionPolicy.statements.forEach(statement => {
        const _policyStatement = new PolicyStatement()
        statement.actions.forEach((_psa: string) => {
        _policyStatement.addActions(_psa)
        })
        statement.resources.forEach((_psr: string) => {
          _policyStatement.addResources(_psr)
        })
        _policyStatements.push(_policyStatement)
    })

    const _policy = new Policy(this, stackProps.ecs.executionPolicy.name, {
      policyName: stackProps.ecs.executionPolicy.name,
      statements: _policyStatements
    })
    
    logger.info("creating the ecs execution role");

    this.executionRole = new Role(this, stackProps.ecs.executionRole.name, {
      roleName: stackProps.ecs.executionRole.name,
      assumedBy: stackProps.ecs.executionRole.assumedBy
    })

    this.executionRole.attachInlinePolicy(_policy)
    
    logger.info("creating the ecs cluster");
    
    this.cluster = new Cluster(this, stackProps.ecs.clusterName, {
      vpc: stackProps.vpc,
      clusterName: stackProps.ecs.clusterName,
      containerInsights: false
    })
    
    stackProps.taglist.forEach(tag => {
      Tags.of(this).add(tag.key, tag.value)
    })
  }
}
