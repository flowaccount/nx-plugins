import 'reflect-metadata'
import { IRole, ManagedPolicy } from '@aws-cdk/aws-iam';
import { App, Construct, Duration, Stack } from '@aws-cdk/core';
import { logger } from '@nrwl/devkit';
import { inject, injectable, registry } from 'tsyringe';
import { ECSAutoScalingGroup } from './ecs-autoscaling-group';
import { ECSCluster } from './ecs-cluster';
import { ECSService } from './ecs-service';
import { ManagedPolicyStack } from './managed-policy-stack';
import { RoleStack } from './role-stack';
import { VpcStack } from './vpc';
import { IECSStackEnvironmentConfig } from '../types'
import { ApplicationListenerRule, ApplicationLoadBalancer, ApplicationTargetGroup, IApplicationLoadBalancer, IApplicationTargetGroup, INetworkTargetGroup, ITargetGroup, ListenerAction, ListenerCondition, NetworkTargetGroup } from '@aws-cdk/aws-elasticloadbalancingv2';
// import { Subnet, Vpc } from '@aws-cdk/aws-ec2';
// import { Certificate } from '@aws-cdk/aws-certificatemanager';
import { CnameRecord, HostedZone, IHostedZone } from '@aws-cdk/aws-route53';
import { ApplicationLoadBalancerStack } from './application-load-balancer';
import { Subnet } from '@aws-cdk/aws-ec2';
import { ApplicationTargetGroupStack } from './application-target-group';
import { Certificate, ICertificate } from '@aws-cdk/aws-certificatemanager';

/**
 * This class is used to create an ECS cluster stack by specifying the VPC and Subnets
 * In this class it creates the Roles and policy provided in the configurations.
 * The configuration must be provided in the registry of the interface IECSStackEnvironmentConfig
 * Please register it like this
 * import { AwsECSCluster } from '@flowaccount/aws-cdk-stack'
 * import { environment } from './environments/environment'
 * import { App } from '@aws-cdk/core'
 * const app = new App()
 * const awsEcsCluster = new AwsECSCluster(app, `${environment.app}-ecs-cluster`, { ...environment, env: environment.awsCredentials } )
 *
 * P.S. please mind that within the stacks, `env: configuration.awsCredentials` has to be passed into the sub-stacks properties
 * this is to make sure they can use each other and also not fail.
 */
@injectable()
export class AwsECSCluster extends Stack {
  // public readonly _app: App;
  protected readonly _applicationLoadbalancer: ApplicationLoadBalancer;
  protected readonly _targetGroup: ApplicationTargetGroup;
  public readonly _ecs : ECSCluster;

  protected readonly _instancePolicy: ManagedPolicy;
  protected readonly _taskPolicy : ManagedPolicy;
  protected readonly _taskExecutionRole: IRole;
  protected readonly _instanceRole: IRole;
  protected readonly _taskRole: IRole;
  protected readonly _zone: IHostedZone;
  protected readonly _taskExecutionPolicy: ManagedPolicy;
  protected readonly _vpc: VpcStack;
  protected readonly _alb: IApplicationLoadBalancer;
  protected readonly _tg: ApplicationTargetGroup;
  protected readonly _applicationListenerRule: ApplicationListenerRule;
  protected readonly _autoScalingGroup: ECSAutoScalingGroup;
  protected readonly _services: ECSService[] = [];

  constructor(scope: Construct, id: string, configuration: IECSStackEnvironmentConfig) {
    super(scope,id ,configuration)
    logger.info(`Initiating AwsECSCluster for ${configuration.app}`)
    if(!configuration.applicationLoadBalancer && !configuration.applicationLoadBalancerArn)
    {
      throw Error("you must specify at least a loadbalancer config or an existing ARN");
    }

    // Loadbalancer vpc and route53
    this._zone = HostedZone.fromLookup(this, `zone-${configuration.stage}`, { domainName: configuration.route53Domain });
    this._vpc = new VpcStack(this, `vpc-${configuration.stage}`, configuration.vpc)
    if(configuration.applicationLoadBalancer) {
      const publicSubnet1 = Subnet.fromSubnetId(this, 'stagingPublicSubnetVpc1' , configuration.applicationLoadBalancer.applicationLoadbalancerProperties.publicSubnet1)
      const publicSubnet2 = Subnet.fromSubnetId(this, 'stagingPblicSubnetVpc2' , configuration.applicationLoadBalancer.applicationLoadbalancerProperties.publicSubnet2)
      this._alb = new ApplicationLoadBalancerStack(this, `alb-${configuration.stage}`
      , { applicationLoadbalancerProps: {
        ...configuration.applicationLoadBalancer.applicationLoadbalancerProperties,
        vpc: this._vpc.vpc,
        vpcSubnets: {subnets:[publicSubnet1, publicSubnet2]}
      }
      ,redirectConfigs: configuration.applicationLoadBalancer.redirectConfigs
      ,certificateArns: configuration.applicationLoadBalancer.certificateArns, env: configuration.awsCredentials }).lb
    }
    else {
      this._alb = ApplicationLoadBalancer.fromLookup(this, `alb-${configuration.stage}`, {
        loadBalancerArn: configuration.applicationLoadBalancerArn
      });
    }
    // Loadbalancer vpc and route53

    // instance role and policy
    logger.info(`Initiating instance role instance-role-${configuration.stage}`)
    this._instanceRole = new RoleStack(this, `instance-role-${configuration.stage}`, {
      name: configuration.ecs.instanceRole.name,
      assumedBy: configuration.ecs.instanceRole.assumedBy,
      env: configuration.awsCredentials
    }).output.role
    this._instancePolicy = (new ManagedPolicyStack(this, `${configuration.ecs.instancePolicy.name}`, {
      ...configuration.ecs.instancePolicy,
      roles: [ this._instanceRole ],
      env: configuration.awsCredentials  })).output.policy
    // instance role and policy

    // task execution role and policy
    this._taskExecutionRole = new RoleStack(this, `task-execution-role-${configuration.stage}`, {
      name: configuration.ecs.taskExecutionRole.name,
      assumedBy: configuration.ecs.taskExecutionRole.assumedBy,
      env: configuration.awsCredentials
    }).output.role
    this._taskExecutionPolicy = (new ManagedPolicyStack(this, `${configuration.ecs.taskExecutionRolePolicy.name}`, {
      ...configuration.ecs.taskExecutionRolePolicy,
      roles: [ this._taskExecutionRole ],
      env: configuration.awsCredentials  })).output.policy
    // task execution role and policy

    // task role and policy
    this._taskRole = new RoleStack(this, `task-role-${configuration.stage}`, {
      name: configuration.ecs.taskRole.name,
      assumedBy: configuration.ecs.taskRole.assumedBy,
      env: configuration.awsCredentials
    }).output.role
    this._taskPolicy = (new ManagedPolicyStack(this, `${configuration.ecs.taskRolePolicy.name}`, {
      ...configuration.ecs.taskRolePolicy,
      roles: [ this._taskRole ],
      env: configuration.awsCredentials  })).output.policy
    // task role and policy

    // ECS Cluster and Auto Scaling Group
    this._ecs = new ECSCluster(this, `cluster-${configuration.stage}`, {
      ecs: configuration.ecs,
      vpc: this._vpc.vpc,
      taglist: configuration.tag,
      env: configuration.awsCredentials })

      this._autoScalingGroup = new ECSAutoScalingGroup(this, `asg-${configuration.stage}`, {
          ecs: configuration.ecs,
          instanceRole: this._instanceRole,
          vpc: this._vpc.vpc,
          cluster: this._ecs.cluster,
          taglist: configuration.tag,
          env: configuration.awsCredentials,
          s3MountConfig: configuration.s3MountConfig })
    // ECS Cluster and Auto Scaling Group

    // https://docs.aws.amazon.com/cdk/api/v1/docs/aws-servicediscovery-readme.html
    // const namespace = new servicediscovery.HttpNamespace(stack, 'MyNamespace', {
    //   name: 'covfefe',
    // });

    // const service1 = namespace.createService('NonIpService', {
    //   description: 'service registering non-ip instances',
    // });

    // service1.registerNonIpInstance('NonIpInstance', {
    //   customAttributes: { arn: 'arn:aws:s3:::mybucket' },
    // });

    // const service2 = namespace.createService('IpService', {
    //   description: 'service registering ip instances',
    //   healthCheck: {
    //     type: servicediscovery.HealthCheckType.HTTP,
    //     resourcePath: '/check',
    //   },
    // });

    // service2.registerIpInstance('IpInstance', {
    //   ipv4: '54.239.25.192',
    // });


    // Creating the ecs services itself
    configuration.service.forEach((apiService, index) => {
      const service = new ECSService(this, `${apiService.name}`, {
        ecsServiceList: [ apiService ],
        ecs: configuration.ecs,
        taskRole: this._taskRole,
        executionRole: this._taskExecutionRole,
        vpc: this._vpc.vpc,
        cluster: this._ecs.cluster,
        taglist: configuration.tag,env: configuration.awsCredentials }) //

        // Tying up services, Target group + cname record to the ecs service. should do capacity provider here.
        if(apiService.apiDomain
          && !apiService.targetGroupArn
          && !apiService.targetGroupNetworkArn
          && !apiService.applicationtargetGroup)
          throw new Error("At least targetGroupArn or targetGroupNetworkArn or applicationtargetGroup must be set")
        let tg: ITargetGroup = null;
        if(apiService.targetGroupArn || apiService.targetGroupNetworkArn || apiService.applicationtargetGroup) {
            if (apiService.targetGroupArn) {
              tg = ApplicationTargetGroup.fromTargetGroupAttributes(
                this,
                `${apiService.name}-tg`,
                {
                  targetGroupArn: apiService.targetGroupArn,
                }
              );

            logger.info('attaching the target group');
            service.service.attachToApplicationTargetGroup(<IApplicationTargetGroup>tg);
          }
          else if (apiService.targetGroupNetworkArn) {
            tg = NetworkTargetGroup.fromTargetGroupAttributes(
              this,
              `${apiService.name}-network-tg`,
              {
                targetGroupArn: apiService.targetGroupNetworkArn,
              }
            );
            logger.info('attaching the target group');
            service.service.attachToNetworkTargetGroup(<INetworkTargetGroup>tg);
          }
          else {
            tg = new ApplicationTargetGroupStack(
              this
              , `${apiService.name}-tg-${configuration.stage}`
              , { applicationtargetGroupProps : { ...apiService.applicationtargetGroup, vpc: this._vpc.vpc  }
              , env: configuration.awsCredentials }).tg;
            service.service.attachToApplicationTargetGroup(<IApplicationTargetGroup>tg);
          }
      }
      if(tg) {

        // httpsListener.addCertificates('cert', [cert, certDev]);
        if(apiService.targetGroupNetworkArn)
        {
          throw new Error("Not Implemented");
        }
        else {
          const certs: ICertificate[] = [];
          configuration.applicationLoadBalancer.certificateArns.forEach((certificateArn, index) => {
            certs.push(Certificate.fromCertificateArn(this,`domainCert-${index}`, certificateArn));
          })
          const listenerName = `${apiService.name}-listener`;
          const httpsListener = this._alb.addListener(listenerName, { port: 443 });
          httpsListener.addCertificates('cert', certs);
          httpsListener.addAction('defaultAction', {action: ListenerAction.fixedResponse(404)})
          const applicationListenerRule = new ApplicationListenerRule(this, `${apiService.name}-listener-rule`, {
              listener: httpsListener,
              priority: index + 1,
              conditions: [ListenerCondition.hostHeaders([apiService.apiDomain])],
              targetGroups: [<IApplicationTargetGroup>tg],
          });
        }
        new CnameRecord(this, `${apiService.name}-record`, {
            zone: this._zone,
            recordName: `${configuration.apiprefix}-${apiService.name}`,
            domainName: this._alb.loadBalancerDnsName,
            ttl: Duration.seconds(300)
        });
        // Tying up services, Target group + cname record to the ecs service. should do capacity provider here.
      }
      this._services.push(service);
    });
    // Creating the ecs services itself
  }

}


