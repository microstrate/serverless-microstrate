# Serverless Microstrate Plugin

A Serverless Framework plugin that enables deployment of serverless applications to the Microstrate platform.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Setting Up Credentials](#setting-up-credentials)
- [Configuration](#configuration)
- [Resources](#resources)
- [Commands](#commands)
- [Examples](#examples)
- [Migration from AWS](#migration-from-aws)

## Features

- **Native Microstrate Support**: Deploy functions, KV stores, object storage, streams, and gateways to Microstrate
- **AWS Migration**: Easily migrate existing AWS projects to Microstrate
- **Multiple Resource Types**: Support for various Microstrate resources including:
  - Functions (compute)
  - KV Buckets (key-value storage)
  - Object Store Buckets
  - Streams (event streaming)
  - Gateways (API management)
- **Gateway Mappings**: Configure HTTP endpoints with rate limiting and traffic distribution

## Installation

```bash
npm install --save-dev serverless-microstrate
```

Or if you're using Yarn:

```bash
yarn add --dev serverless-microstrate
```

## Setting Up Credentials

### 1. Obtain Microstrate API Key

First, you'll need to obtain an API key from Microstrate. Visit the [Microstrate Console](https://console.microstrate.io) to generate your API key.

### 2. Configure Credentials

#### Export Environment Variable (Recommended)

Set the `MICROSTRATE_API_KEY` environment variable:

```bash
export MICROSTRATE_API_KEY=your-api-key-here
```

#### serverless.yml Configuration

Add credentials directly to your `serverless.yml`:

```yaml
provider:
  name: microstrate
  credentials: ${env:MICROSTRATE_API_KEY}
```

### 3. Custom API URL (Optional)

If you're using a custom Microstrate deployment, you can specify the API URL:

```bash
export MICROSTRATE_URL=https://api.your-deployment.com
```

## Configuration

Create a `serverless.yml` file in your project root:

```yaml
service: my-microstrate-service

plugins:
  - serverless-microstrate

package:
  individually: true

provider:
  name: microstrate
  region: eu-west-2
  runtime: nodejs20.x
  architecture: arm64
  stage: ${opt:stage, 'dev'}
  memorySize: 1024
  timeout: 60
  credentials: ${env:MICROSTRATE_API_KEY}
  environment:
    SERVICE: ${self:service}
    STAGE: ${self:provider.stage}

functions:
  hello:
    handler: handler.hello
    description: Hello World function
    memorySize: 128
    timeout: 3
    environment:
      FUNCTION_NAME: hello
    gateway:
      - path: /api/hello
        method: post
        is_public: true
        limit:
          request: 100
          time: 1000

resources:
  Description: ${self:service} service infrastructure
  Resources:
    # KV Storage
    UserStore:
      type: microstrate::kv::bucket
      deletion_policy: retain
      properties:
        bucket: UserStore
        description: Store for user data
        indexing:
          mappings:
            - field: userId
              field_type: text
            - field: email
              field_type: text
            - field: createdAt
              field_type: number

    # Object Storage
    FileStorage:
      type: microstrate::objectstore::bucket
      deletion_policy: retain
      properties:
        bucket: FileStorage
        description: Storage for user files
        metadata:
          purpose: user-uploads

    # Event Stream
    EventStream:
      type: microstrate::stream
      deletion_policy: retain
      properties:
        name: EventStream
        description: Application event stream
        subjects:
          - user.>
          - order.>
        max_consumers: 10
        max_msgs: 10000
        storage: file
        num_replicas: 2

    # API Gateway
    PublicAPI:
      type: microstrate::gateway
      deletion_policy: retain
      properties:
        name: PublicAPI
        description: Public API Gateway
        active: true
        limit:
          request: 1000
          time: 60
```

## Resources

### Functions

Functions are the compute units in Microstrate:

```yaml
functions:
  processOrder:
    handler: orders.process
    memorySize: 512
    timeout: 30
    environment:
      QUEUE_URL: ${env:QUEUE_URL}
    gateway:
      - path: /orders/process
        method: post
        timeout: 120
```

### KV Buckets

Key-value storage with indexing capabilities:

```yaml
resources:
  Resources:
    OrdersDB:
      type: microstrate::kv::bucket
      properties:
        bucket: orders-db
        ttl: 86400 # 24 hours
        indexing:
          mappings:
            - field: orderId
              field_type: text
            - field: customerId
              field_type: text
            - field: status
              field_type: text
            - field: total
              field_type: number
```

### Object Store Buckets

Object storage for files and large data:

```yaml
resources:
  Resources:
    MediaBucket:
      type: microstrate::objectstore::bucket
      properties:
        bucket: media-files
        compression: true
        max_bytes: 10485760 # 10MB
        metadata:
          content-type: media
```

### Streams

Event streaming for real-time data:

```yaml
resources:
  Resources:
    ActivityStream:
      type: microstrate::stream
      properties:
        name: activity-stream
        subjects:
          - user.login
          - user.logout
          - user.action.*
        max_msgs_per_subject: 1000
        retention: limits
        storage: file
```

### Gateways

API gateway for managing HTTP endpoints:

```yaml
resources:
  Resources:
    APIGateway:
      type: microstrate::gateway
      properties:
        name: api-gateway
        active: true
        limit:
          request: 5000
          time: 60
        timeout: 30
```

## Commands

### Deploy

Deploy your service to Microstrate:

```bash
serverless deploy
```

Deploy to a specific stage:

```bash
serverless deploy --stage production
```

### Remove

Remove your service from Microstrate:

```bash
serverless remove
```

Remove from a specific stage:

```bash
serverless remove --stage production
```

### Migrate

Migrate an existing AWS Serverless configuration to Microstrate:

```bash
serverless migrate
```

This command will:

1. Create a backup of your current `serverless.yml`
2. Convert AWS resources to Microstrate equivalents
3. Update function configurations
4. Migrate DynamoDB tables to KV buckets
5. Convert S3 buckets to Object Store buckets

### Local Development

For local development and testing:

```bash
# Set debug mode for verbose output
export DEBUG=TRUE

# Deploy with debug information
serverless deploy
```

## Examples

### Basic HTTP API

```yaml
service: my-api

plugins:
  - serverless-microstrate

provider:
  name: microstrate
  runtime: nodejs20.x
  stage: ${opt:stage, 'dev'}
  credentials: ${env:MICROSTRATE_API_KEY}

functions:
  getUser:
    handler: users.get
    gateway:
      - path: /users/{id}
        method: get
        is_public: true

  createUser:
    handler: users.create
    gateway:
      - path: /users
        method: post
        is_public: false
        limit:
          request: 10
          time: 60
```

### Event-Driven Architecture

```yaml
service: event-processor

plugins:
  - serverless-microstrate

provider:
  name: microstrate
  runtime: nodejs20.x
  credentials: ${env:MICROSTRATE_API_KEY}

functions:
  orderProcessor:
    handler: processors.orders
    environment:
      STREAM_NAME: OrderStream

  notificationSender:
    handler: processors.notifications
    environment:
      STREAM_NAME: OrderStream

resources:
  Resources:
    OrderStream:
      type: microstrate::stream
      properties:
        name: OrderStream
        subjects:
          - order.created
          - order.updated
          - order.completed
        max_msgs: 100000
        storage: file
```

### Microservice with Storage

```yaml
service: user-service

plugins:
  - serverless-microstrate

provider:
  name: microstrate
  runtime: nodejs20.x
  credentials: ${env:MICROSTRATE_API_KEY}

functions:
  userAPI:
    handler: api.handler
    gateway:
      - path: /users/{proxy+}
        method: any
        is_public: true

resources:
  Resources:
    UserData:
      type: microstrate::kv::bucket
      properties:
        bucket: user-data
        indexing:
          mappings:
            - field: email
              field_type: text
            - field: username
              field_type: text

    UserProfiles:
      type: microstrate::objectstore::bucket
      properties:
        bucket: user-profiles
        max_bytes: 5242880 # 5MB
```

## Migration from AWS

If you have an existing AWS Serverless project, the migration process is straightforward:

1. **Install the plugin**:

   ```bash
   npm install --save-dev serverless-microstrate
   ```

2. **Run the migration command**:

   ```bash
   serverless migrate
   ```

3. **Review the migrated configuration**:

   - Check the generated `serverless.yml`
   - Your original file is backed up as `serverless.yml-backup.<timestamp>`

4. **Update environment variables**:

   - Replace AWS credentials with Microstrate API key
   - Update any AWS-specific environment variables

5. **Deploy to Microstrate**:
   ```bash
   serverless deploy
   ```

### Migration Mappings

| AWS Resource            | Microstrate Resource             |
| ----------------------- | -------------------------------- |
| AWS::Lambda::Function   | microstrate::function            |
| AWS::DynamoDB::Table    | microstrate::kv::bucket          |
| AWS::S3::Bucket         | microstrate::objectstore::bucket |
| HTTP/API Gateway Events | microstrate::gateway + mappings  |

### Post-Migration Checklist

- [ ] Update IAM roles/policies to Microstrate equivalents
- [ ] Modify AWS SDK calls to Microstrate APIs
- [ ] Update CloudWatch logging to Microstrate logging
- [ ] Adjust timeout and memory settings if needed
- [ ] Test all endpoints and functions
- [ ] Update CI/CD pipelines

## Troubleshooting

### Debug Mode

Enable debug mode for detailed logging:

```bash
export DEBUG=TRUE
serverless deploy
```

### Common Issues

1. **Authentication Error**

   - Ensure `MICROSTRATE_API_KEY` is set correctly

2. **Deployment Failures**

   - Check resource names for conflicts
   - Verify memory and timeout limits
   - Ensure handler paths are correct

3. **Migration Issues**
   - Some AWS-specific features may not have direct equivalents
   - Review migration warnings in the output
   - Manually adjust configurations as needed

## Support

- Documentation: [https://docs.microstrate.io](https://docs.microstrate.io)
- Issues: [GitHub Issues](https://github.com/microstrate/serverless-microstrate/issues)
