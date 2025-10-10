/**
 * AWS Cloud Provider Implementation
 * 
 * Provides AWS-specific region management, deployment types, and resource configuration
 * following the same patterns as the Azure implementation for consistency.
 * 
 * @category Multi-Cloud Extension
 */

export interface AWSRegion {
  /** AWS region name (e.g., 'us-east-1') */
  name: string;
  /** Display name for the region */
  displayName: string;
  /** ISO country code */
  countryCode: string;
  /** AWS region classification */
  classification: 'commercial' | 'gov' | 'china';
  /** Availability zones in this region */
  availabilityZones: string[];
}

export type AWSDeploymentType = 'ecs' | 'eks' | 'fargate' | 'ec2' | 'lambda';

export interface AWSConfiguration {
  /** Enable AWS deployment */
  enabled: boolean;
  /** AWS region selection */
  regions: string[];
  /** Regions to exclude */
  excludeRegions?: string[];
  /** Region classification filter */
  regionClass?: 'commercial' | 'gov' | 'china';
  /** Default deployment type */
  deploymentDefault?: AWSDeploymentType;
  /** VPC configuration */
  vpc?: {
    cidr: string;
    enableNatGateway: boolean;
    enableVpnGateway: boolean;
  };
  /** Resource tagging */
  tags?: Record<string, string>;
  /** Auto-scaling configuration */
  autoScaling?: {
    minCapacity: number;
    maxCapacity: number;
    targetCpuUtilization: number;
  };
}

/**
 * AWS region database with comprehensive region information
 */
export const AWS_REGIONS: AWSRegion[] = [
  // US Regions
  {
    name: 'us-east-1',
    displayName: 'US East (N. Virginia)',
    countryCode: 'US',
    classification: 'commercial',
    availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d', 'us-east-1e', 'us-east-1f']
  },
  {
    name: 'us-east-2',
    displayName: 'US East (Ohio)',
    countryCode: 'US',
    classification: 'commercial',
    availabilityZones: ['us-east-2a', 'us-east-2b', 'us-east-2c']
  },
  {
    name: 'us-west-1',
    displayName: 'US West (N. California)',
    countryCode: 'US',
    classification: 'commercial',
    availabilityZones: ['us-west-1a', 'us-west-1b', 'us-west-1c']
  },
  {
    name: 'us-west-2',
    displayName: 'US West (Oregon)',
    countryCode: 'US',
    classification: 'commercial',
    availabilityZones: ['us-west-2a', 'us-west-2b', 'us-west-2c', 'us-west-2d']
  },
  
  // Canada
  {
    name: 'ca-central-1',
    displayName: 'Canada (Central)',
    countryCode: 'CA',
    classification: 'commercial',
    availabilityZones: ['ca-central-1a', 'ca-central-1b', 'ca-central-1d']
  },
  
  // Europe
  {
    name: 'eu-west-1',
    displayName: 'Europe (Ireland)',
    countryCode: 'IE',
    classification: 'commercial',
    availabilityZones: ['eu-west-1a', 'eu-west-1b', 'eu-west-1c']
  },
  {
    name: 'eu-west-2',
    displayName: 'Europe (London)',
    countryCode: 'GB',
    classification: 'commercial',
    availabilityZones: ['eu-west-2a', 'eu-west-2b', 'eu-west-2c']
  },
  {
    name: 'eu-west-3',
    displayName: 'Europe (Paris)',
    countryCode: 'FR',
    classification: 'commercial',
    availabilityZones: ['eu-west-3a', 'eu-west-3b', 'eu-west-3c']
  },
  {
    name: 'eu-central-1',
    displayName: 'Europe (Frankfurt)',
    countryCode: 'DE',
    classification: 'commercial',
    availabilityZones: ['eu-central-1a', 'eu-central-1b', 'eu-central-1c']
  },
  {
    name: 'eu-north-1',
    displayName: 'Europe (Stockholm)',
    countryCode: 'SE',
    classification: 'commercial',
    availabilityZones: ['eu-north-1a', 'eu-north-1b', 'eu-north-1c']
  },
  
  // Asia Pacific
  {
    name: 'ap-northeast-1',
    displayName: 'Asia Pacific (Tokyo)',
    countryCode: 'JP',
    classification: 'commercial',
    availabilityZones: ['ap-northeast-1a', 'ap-northeast-1c', 'ap-northeast-1d']
  },
  {
    name: 'ap-northeast-2',
    displayName: 'Asia Pacific (Seoul)',
    countryCode: 'KR',
    classification: 'commercial',
    availabilityZones: ['ap-northeast-2a', 'ap-northeast-2b', 'ap-northeast-2c']
  },
  {
    name: 'ap-northeast-3',
    displayName: 'Asia Pacific (Osaka)',
    countryCode: 'JP',
    classification: 'commercial',
    availabilityZones: ['ap-northeast-3a', 'ap-northeast-3b', 'ap-northeast-3c']
  },
  {
    name: 'ap-southeast-1',
    displayName: 'Asia Pacific (Singapore)',
    countryCode: 'SG',
    classification: 'commercial',
    availabilityZones: ['ap-southeast-1a', 'ap-southeast-1b', 'ap-southeast-1c']
  },
  {
    name: 'ap-southeast-2',
    displayName: 'Asia Pacific (Sydney)',
    countryCode: 'AU',
    classification: 'commercial',
    availabilityZones: ['ap-southeast-2a', 'ap-southeast-2b', 'ap-southeast-2c']
  },
  {
    name: 'ap-south-1',
    displayName: 'Asia Pacific (Mumbai)',
    countryCode: 'IN',
    classification: 'commercial',
    availabilityZones: ['ap-south-1a', 'ap-south-1b', 'ap-south-1c']
  },
  
  // South America
  {
    name: 'sa-east-1',
    displayName: 'South America (São Paulo)',
    countryCode: 'BR',
    classification: 'commercial',
    availabilityZones: ['sa-east-1a', 'sa-east-1b', 'sa-east-1c']
  },
  
  // AWS GovCloud
  {
    name: 'us-gov-east-1',
    displayName: 'AWS GovCloud (US-East)',
    countryCode: 'US',
    classification: 'gov',
    availabilityZones: ['us-gov-east-1a', 'us-gov-east-1b', 'us-gov-east-1c']
  },
  {
    name: 'us-gov-west-1',
    displayName: 'AWS GovCloud (US-West)',
    countryCode: 'US',
    classification: 'gov',
    availabilityZones: ['us-gov-west-1a', 'us-gov-west-1b', 'us-gov-west-1c']
  },
  
  // China regions
  {
    name: 'cn-north-1',
    displayName: 'China (Beijing)',
    countryCode: 'CN',
    classification: 'china',
    availabilityZones: ['cn-north-1a', 'cn-north-1b']
  },
  {
    name: 'cn-northwest-1',
    displayName: 'China (Ningxia)',
    countryCode: 'CN',
    classification: 'china',
    availabilityZones: ['cn-northwest-1a', 'cn-northwest-1b', 'cn-northwest-1c']
  }
];

/**
 * Gets AWS regions by classification
 */
export function getAWSRegionsByClassification(classification: 'commercial' | 'gov' | 'china' = 'commercial'): string[] {
  return AWS_REGIONS
    .filter(region => region.classification === classification)
    .map(region => region.name);
}

/**
 * Resolves AWS region exclusions including country-based exclusions
 */
export function resolveAWSRegionExclusions(exclusions: string[]): string[] {
  const excludedRegions: string[] = [];
  
  for (const exclusion of exclusions) {
    const trimmed = exclusion.trim();
    
    // Check if it's a country code (2 letters)
    if (trimmed.length === 2) {
      const regionsByCountry = AWS_REGIONS
        .filter(region => region.countryCode === trimmed.toUpperCase())
        .map(region => region.name);
      excludedRegions.push(...regionsByCountry);
    } else {
      // Assume it's a region name
      excludedRegions.push(trimmed);
    }
  }
  
  return excludedRegions;
}

/**
 * Validates AWS region name
 */
export function validateAWSRegion(regionName: string): boolean {
  return AWS_REGIONS.some(region => region.name === regionName);
}

/**
 * Gets AWS region information
 */
export function getAWSRegionInfo(regionName: string): AWSRegion | undefined {
  return AWS_REGIONS.find(region => region.name === regionName);
}

/**
 * AWS deployment type capabilities and configurations
 */
export const AWS_DEPLOYMENT_TYPES = {
  ecs: {
    name: 'Amazon ECS',
    description: 'Container orchestration using ECS with EC2 or Fargate',
    supportsAutoScaling: true,
    supportsLoadBalancer: true,
    costTier: 'medium'
  },
  eks: {
    name: 'Amazon EKS',
    description: 'Managed Kubernetes service',
    supportsAutoScaling: true,
    supportsLoadBalancer: true,
    costTier: 'high'
  },
  fargate: {
    name: 'AWS Fargate',
    description: 'Serverless containers',
    supportsAutoScaling: true,
    supportsLoadBalancer: true,
    costTier: 'medium-high'
  },
  ec2: {
    name: 'Amazon EC2',
    description: 'Virtual machines',
    supportsAutoScaling: true,
    supportsLoadBalancer: true,
    costTier: 'low-medium'
  },
  lambda: {
    name: 'AWS Lambda',
    description: 'Serverless functions (limited blockchain use)',
    supportsAutoScaling: true,
    supportsLoadBalancer: false,
    costTier: 'low'
  }
} as const;

/**
 * AWS instance type recommendations for different node roles
 */
export const AWS_INSTANCE_RECOMMENDATIONS = {
  validators: {
    small: 't3.medium',
    medium: 'm5.large',
    large: 'm5.xlarge'
  },
  rpcNodes: {
    small: 't3.large',
    medium: 'm5.xlarge',
    large: 'm5.2xlarge'
  },
  bootNodes: {
    small: 't3.small',
    medium: 't3.medium',
    large: 't3.large'
  },
  archiveNodes: {
    small: 'm5.xlarge',
    medium: 'm5.2xlarge',
    large: 'm5.4xlarge'
  }
} as const;

/**
 * Generates CloudFormation template for AWS deployment
 */
export function generateCloudFormationTemplate(config: AWSConfiguration): any {
  const template = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Quorum blockchain network infrastructure on AWS',
    Parameters: {
      Environment: {
        Type: 'String',
        Default: 'dev',
        AllowedValues: ['dev', 'staging', 'prod']
      },
      InstanceType: {
        Type: 'String',
        Default: 'm5.large',
        Description: 'EC2 instance type for blockchain nodes'
      }
    },
    Resources: {} as any,
    Outputs: {} as any
  };

  // Add VPC resources if VPC configuration is provided
  if (config.vpc) {
    template.Resources.VPC = {
      Type: 'AWS::EC2::VPC',
      Properties: {
        CidrBlock: config.vpc.cidr,
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: [
          { Key: 'Name', Value: 'Quorum-VPC' },
          ...Object.entries(config.tags || {}).map(([key, value]) => ({ Key: key, Value: value }))
        ]
      }
    };

    // Add subnets for each region/AZ
    config.regions.forEach((region, index) => {
      const regionInfo = getAWSRegionInfo(region);
      if (regionInfo) {
        regionInfo.availabilityZones.slice(0, 2).forEach((az, azIndex) => {
          const subnetName = `Subnet${region}${azIndex}`;
          template.Resources[subnetName] = {
            Type: 'AWS::EC2::Subnet',
            Properties: {
              VpcId: { Ref: 'VPC' },
              CidrBlock: `10.0.${index * 16 + azIndex * 8}.0/24`,
              AvailabilityZone: az,
              Tags: [
                { Key: 'Name', Value: `Quorum-Subnet-${az}` }
              ]
            }
          };
        });
      }
    });
  }

  // Add security group
  template.Resources.SecurityGroup = {
    Type: 'AWS::EC2::SecurityGroup',
    Properties: {
      GroupDescription: 'Security group for Quorum blockchain nodes',
      VpcId: config.vpc ? { Ref: 'VPC' } : { Ref: 'AWS::NoValue' },
      SecurityGroupIngress: [
        {
          IpProtocol: 'tcp',
          FromPort: 8545,
          ToPort: 8545,
          CidrIp: '0.0.0.0/0',
          Description: 'RPC endpoint'
        },
        {
          IpProtocol: 'tcp',
          FromPort: 8546,
          ToPort: 8546,
          CidrIp: '0.0.0.0/0',
          Description: 'WebSocket endpoint'
        },
        {
          IpProtocol: 'tcp',
          FromPort: 30303,
          ToPort: 30303,
          CidrIp: '0.0.0.0/0',
          Description: 'P2P networking'
        }
      ],
      Tags: [
        { Key: 'Name', Value: 'Quorum-SecurityGroup' }
      ]
    }
  };

  return template;
}