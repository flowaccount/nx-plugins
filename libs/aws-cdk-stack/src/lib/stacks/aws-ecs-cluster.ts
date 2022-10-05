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
import { AsgCapacityProvider, CfnCapacityProvider } from '@aws-cdk/aws-ecs';
import { CfnAutoScalingGroup } from '@aws-cdk/aws-autoscaling';

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
// @injectable()
// export class AwsECSCluster { //  extends Stack


  export const createStack = (scope: App, configuration: IECSStackEnvironmentConfig) => {
    
    let _app: App = new App();
    let _applicationLoadbalancer: ApplicationLoadBalancer;
    let _ta
    rgetGroup: ApplicationTargetGroup;
    let _ecs : ECSCluster;

    let _instancePolicy: ManagedPolicy;
    let _taskPolicy : ManagedPolicy;
    let _taskExecutionRole: IRole;
    let _instanceRole: IRole;
    let _taskRole: IRole;
    let _zone: IHostedZone;
    let _taskExecutionPolicy: ManagedPolicy;
    let _vpc: VpcStack;
    let _alb: IApplicationLoadBalancer;
    let  _tg: ApplicationTargetGroup;
    let _applicationListenerRule: ApplicationListenerRule;
    let _autoScalingGroupList: ECSAutoScalingGroup[] = [];
    let _services: ECSService[] = [];
    logger.info(`Initiating AwsECSCluster for ${configuration.app}`)
    if(!configuration.applicationLoadBalancer && !configuration.applicationLoadBalancerArn)
    {
      throw Error("you must specify at least a loadbalancer config or an existing ARN");
    }
    // Loadbalancer vpc and route53
    // _zone = HostedZone.fromLookup(this, `zone-${configuration.stage}`, { domainName: configuration.route53Domain });
    _vpc = new VpcStack(_app, `vpc-${configuration.stage}`, configuration.vpc)
    if(configuration.applicationLoadBalancer) {
      _alb = new ApplicationLoadBalancerStack(_app, `alb-${configuration.stage}`, 
      { 
        applicationLoadbalancerProps: configuration.applicationLoadBalancer.applicationLoadbalancerProperties,
        redirectConfigs: configuration.applicationLoadBalancer.redirectConfigs,
        certificateArns: configuration.applicationLoadBalancer.certificateArns,
        vpc: _vpc.vpc
      }).lb
    }
    else {
      _alb = ApplicationLoadBalancer.fromLookup(_app, `alb-${configuration.stage}`, {
        loadBalancerArn: configuration.applicationLoadBalancerArn
      });
    }
    // Loadbalancer vpc and route53

    // instance role and policy
    logger.info(`Initiating instance role instance-role-${configuration.stage}`)
    _instanceRole = new RoleStack(_app, `instance-role-${configuration.stage}`, {
      name: configuration.ecs.instanceRole.name,
      assumedBy: configuration.ecs.instanceRole.assumedBy,
      env: configuration.awsCredentials
    }).output.role
    _instancePolicy = (new ManagedPolicyStack(_app, `${configuration.ecs.instancePolicy.name}`, {
      ...configuration.ecs.instancePolicy,
      roles: [ _instanceRole ],
      env: configuration.awsCredentials  })).output.policy
    // instance role and policy

    // task execution role and policy
    _taskExecutionRole = new RoleStack(_app, `task-execution-role-${configuration.stage}`, {
      name: configuration.ecs.taskExecutionRole.name,
      assumedBy: configuration.ecs.taskExecutionRole.assumedBy,
      env: configuration.awsCredentials
    }).output.role
    _taskExecutionPolicy = (new ManagedPolicyStack(_app, `${configuration.ecs.taskExecutionRolePolicy.name}`, {
      ...configuration.ecs.taskExecutionRolePolicy,
      roles: [ _taskExecutionRole ],
      env: configuration.awsCredentials  })).output.policy
    // task execution role and policy

    // task role and policy
    _taskRole = new RoleStack(_app, `task-role-${configuration.stage}`, {
      name: configuration.ecs.taskRole.name,
      assumedBy: configuration.ecs.taskRole.assumedBy,
      env: configuration.awsCredentials
    }).output.role
    _taskPolicy = (new ManagedPolicyStack(_app, `${configuration.ecs.taskRolePolicy.name}`, {
      ...configuration.ecs.taskRolePolicy,
      roles: [ _taskRole ],
      env: configuration.awsCredentials  })).output.policy
    // task role and policy

    // ECS Cluster and Auto Scaling Group
    _ecs = new ECSCluster(_app, `cluster-${configuration.stage}`, {
      ecs: configuration.ecs,
      vpc: _vpc.vpc,
      taglist: configuration.tag,
      env: configuration.awsCredentials })

    configuration.ecs.asgList.forEach((asg) => {
      _autoScalingGroupList.push(new ECSAutoScalingGroup(_app, `stack-${asg.asg.name}`, {
        ecsModel: configuration.ecs,
        asgModel: asg,
        instanceRole: _instanceRole,
        vpc: _vpc.vpc,
        cluster: _ecs.cluster,
        taglist: configuration.tag,
        env: configuration.awsCredentials,
        s3MountConfig: configuration.s3MountConfig }))
    })

      const capacityProviderList : CfnCapacityProvider[] = [];
    _autoScalingGroupList.forEach( asgModel => {
      // ECS Cluster and Auto Scaling Group
    const cfnCapacityProvider = new CfnCapacityProvider(_app, `${asgModel._autoScalingGroup.autoScalingGroupName}`, {
      autoScalingGroupProvider: {
        autoScalingGroupArn: asgModel._autoScalingGroup.autoScalingGroupName,
        // the properties below are optional
        managedScaling: {
        //   instanceWarmupPeriod: 123,
        //   maximumScalingStepSize: 123,
        //   minimumScalingStepSize: 123,
        //   status: 'status',
          targetCapacity: 90,
        },
        managedTerminationProtection: 'ENABLED',
      },
      // the properties below are optional
      name: `${asgModel._autoScalingGroup.autoScalingGroupName}-cp`,
      // tags: [{
      //   key: 'key',
      //   value: 'value',
      // }],
    });
    capacityProviderList.push(cfnCapacityProvider)
  });
    
    // Creating the ecs services itself
    configuration.service.forEach((apiService, index) => {
      const service = new ECSService(_app, `${apiService.name}`, {
        ecsServiceList: [ apiService ],
        ecs: configuration.ecs,
        taskRole: _taskRole,
        executionRole: _taskExecutionRole,
        vpc: _vpc.vpc,
        cluster: _ecs.cluster,
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
                _app,
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
              _app,
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
              _app
              , `${apiService.name}-tg-${configuration.stage}`
              , { applicationtargetGroupProps : { ...apiService.applicationtargetGroup, vpc: _vpc.vpc  }
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
          
          _alb.listeners[0].addTargetGroups(`${apiService.name}-tgs-${configuration.stage}`, { targetGroups: [<IApplicationTargetGroup>tg] });
          
          // const certs: ICertificate[] = [];
          // configuration.applicationLoadBalancer.certificateArns.forEach((certificateArn, index) => {
          //   certs.push(Certificate.fromCertificateArn(this,`domainCert-${index}`, certificateArn));
          // })
          // const listenerName = `${apiService.name}-listener`;
          // const httpsListener = _alb.addListener(listenerName, { port: 443 });
          // httpsListener.addCertificates('cert', certs);
          // httpsListener.addAction('defaultAction', {action: ListenerAction.fixedResponse(404)})
          logger.info(`apiDomain:${apiService.apiDomain}`)
          const applicationListenerRule = new ApplicationListenerRule(_app, `${apiService.name}-listener-rule`, {
              listener: _alb.listeners[0], //.find( l => l.connections.defaultPort == ),
              priority: index + 1,
              conditions: [ListenerCondition.hostHeaders([apiService.apiDomain])],
              targetGroups: [<IApplicationTargetGroup>tg],
          });
        }
        new CnameRecord(_app, `${apiService.name}-record`, {
            zone: _zone,
            recordName: `${configuration.apiprefix}-${apiService.name}`,
            domainName: _alb.loadBalancerDnsName,
            ttl: Duration.seconds(300)
        });
        // Tying up services, Target group + cname record to the ecs service. should do capacity provider here.
      }
      _services.push(service);
    });
  }

// }


