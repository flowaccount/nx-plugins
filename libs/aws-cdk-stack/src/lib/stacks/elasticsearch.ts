import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as es from 'aws-cdk-lib/aws-elasticsearch';
import { SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { ElasticsearchStackProperties, EsInstanceType } from '../types';
import { logger } from '@nx/devkit';

export class ElasticsearchStack extends cdk.Stack {
  public readonly output: {
    domainArn?: string;
  };
  constructor(
    scope: Construct,
    id: string,
    _props: ElasticsearchStackProperties
  ) {
    super(scope, id, _props);

    this.templateOptions.description = 'To create elasticsearch instance';

    logger.info(`Initiating ElasticsearchStack ${_props.domainName}`);
    const securityGroups = _props.securityGroupIds.map((secgroupId) =>
      SecurityGroup.fromSecurityGroupId(
        this,
        `${id}-${secgroupId}-sg`,
        secgroupId
      )
    );
    logger.info(`finished fetching security groups`);
    const esDomain = new es.Domain(this, `${id}-es-domain`, {
      domainName: _props.domainName,
      version: es.ElasticsearchVersion.V7_9,
      capacity: {
        dataNodes: 2,
        dataNodeInstanceType: _props.esInstanceType,
      },
      ebs: {
        volumeSize: _props.esInstanceType === EsInstanceType.Small ? 100 : 150,
      },
      accessPolicies: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.AnyPrincipal()],
          actions: ['es:ESHttpGet', 'es:ESHttpPost'],
        }),
      ],
      vpc: _props.vpc,
      vpcSubnets:
        _props.esInstanceType === EsInstanceType.Small
          ? [_props.subnets[0]]
          : _props.subnets,
      securityGroups: securityGroups,
      zoneAwareness:
        _props.subnets.length > 1
          ? { enabled: true, availabilityZoneCount: _props.subnets.length }
          : { enabled: false },
    });
    this.output = { domainArn: esDomain.domainArn };
    logger.info('🚀');
  }
}
