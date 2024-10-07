'use strict'

// https://github.com/serverless/serverless/blob/main/docs/guides/plugins/custom-configuration.md
module.exports = {
  definitions: {
    awsAccountId: {
      type: 'string',
      pattern: '^\\d{12}$',
    },
    awsLambdaArchitecture: { enum: ['arm64', 'x86_64'] },
    awsLambdaEnvironment: {
      type: 'object',
      patternProperties: {
        '^[A-Za-z_][a-zA-Z0-9_]*$': { type: 'string' },
      },
      additionalProperties: false,
    },
    awsLambdaMemorySize: {
      type: 'integer',
      minimum: 128,
      maximum: 10240,
    },
    awsLambdaRuntime: {
      enum: [
        'dotnet6',
        'dotnet8',
        'go1.x',
        'java21',
        'java17',
        'java11',
        'java8',
        'java8.al2',
        'nodejs14.x',
        'nodejs16.x',
        'nodejs18.x',
        'nodejs20.x',
        'provided',
        'provided.al2',
        'provided.al2023',
        'python3.7',
        'python3.8',
        'python3.9',
        'python3.10',
        'python3.11',
        'python3.12',
        'ruby2.7',
        'ruby3.2',
      ],
    },
    awsRegion: {
      enum: [
        'us-east-1',
        'us-east-2',
        'us-gov-east-1',
        'us-gov-west-1',
        'us-iso-east-1',
        'us-iso-west-1',
        'us-isob-east-1',
        'us-west-1',
        'us-west-2',
        'af-south-1',
        'ap-east-1',
        'ap-northeast-1',
        'ap-northeast-2',
        'ap-northeast-3',
        'ap-south-1',
        'ap-south-2',
        'ap-southeast-1',
        'ap-southeast-2',
        'ap-southeast-3',
        'ap-southeast-4',
        'ca-central-1',
        'cn-north-1',
        'cn-northwest-1',
        'eu-central-1',
        'eu-central-2',
        'eu-north-1',
        'eu-south-1',
        'eu-south-2',
        'eu-west-1',
        'eu-west-2',
        'eu-west-3',
        'il-central-1',
        'me-central-1',
        'me-south-1',
        'sa-east-1',
      ],
    },
    awsProfile: { type: 'string' },
    awsStage: { type: 'string' },
    awsLambdaTimeout: { type: 'integer', minimum: 1, maximum: 900 },
    awsResourceTags: {
      type: 'object',
      patternProperties: {
        '^(?!aws:)[\\w./=+:\\-_\\x20]{1,128}$': {
          type: 'string',
          maxLength: 256,
        },
      },
      additionalProperties: false,
    },
  },
  provider: {
    properties: {
      architecture: {
        anyOf: [{ $ref: '#/definitions/awsLambdaArchitecture' }],
      },
      environment: { anyOf: [{ $ref: '#/definitions/awsLambdaEnvironment' }] },
      memorySize: { anyOf: [{ $ref: '#/definitions/awsLambdaMemorySize' }] },
      runtime: { anyOf: [{ $ref: '#/definitions/awsLambdaRuntime' }] },
      profile: { anyOf: [{ $ref: '#/definitions/awsProfile' }] },
      region: { anyOf: [{ $ref: '#/definitions/awsRegion' }] },
      stage: { anyOf: [{ $ref: '#/definitions/awsStage' }] },
      timeout: { anyOf: [{ $ref: '#/definitions/awsLambdaTimeout' }] },
    },
  },
  function: {
    properties: {
      architecture: { $ref: '#/definitions/awsLambdaArchitecture' },
      description: { type: 'string', maxLength: 256 },
      disableLogs: { type: 'boolean' },
      environment: { $ref: '#/definitions/awsLambdaEnvironment' },
      handler: { type: 'string' },
      memorySize: { $ref: '#/definitions/awsLambdaMemorySize' },
      package: {
        type: 'object',
        properties: {
          artifact: { type: 'string' },
          exclude: { type: 'array', items: { type: 'string' } },
          include: { type: 'array', items: { type: 'string' } },
          individually: { type: 'boolean' },
          patterns: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      runtime: { $ref: '#/definitions/awsLambdaRuntime' },
      tags: { $ref: '#/definitions/awsResourceTags' },
      timeout: { $ref: '#/definitions/awsLambdaTimeout' },
    },
  },
  functionEvents: {
    http: { type: 'object' },
    httpApi: { type: 'object' },
  },
  resources: {
    type: 'object',
    properties: {
      Description: {
        type: 'string',
      },
      Resources: {
        type: 'object',
        properties: {
          'Fn::Transform': {
            type: 'object',
            properties: {
              Name: { type: 'string' },
              Parameters: { type: 'object' },
            },
            required: ['Name'],
            additionalProperties: false,
          },
        },
        patternProperties: {
          '^[a-zA-Z0-9]{1,255}$': {
            type: 'object',
            properties: {
              Type: { type: 'string' },
              Properties: { type: 'object' },
              DeletionPolicy: { type: 'string' },
              Metadata: { type: 'object' },
            },
            required: ['Type'],
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
      Transform: {
        type: 'array',
        items: { type: 'string' },
      },
      extensions: {
        type: 'object',
        patternProperties: {
          // names have the same restrictions as CloudFormation Resources section
          '^[a-zA-Z0-9]{1,255}$': {
            type: 'object',
            properties: {
              Properties: { type: 'object' },
              Metadata: { type: 'object' },
              DeletionPolicy: { type: 'string' },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  },
}
