/# KeyLo Deployment & Infrastructure Specifications

**Document Status**: Final  
**Last Updated**: 2025-01-20  
**Version**: 1.0  
**Author**: DevOps Engineer  

---

## Executive Summary

This document defines the complete deployment and infrastructure strategy for KeyLo, covering development, staging, and production environments. The infrastructure is designed for the Bahamian market with scalability for Caribbean expansion, emphasizing mobile performance, payment security, and geographic distribution.

### Infrastructure Overview
- **Cloud Provider**: AWS for scalability and reliability
- **Architecture**: Containerized microservices with auto-scaling
- **Database**: PostgreSQL with Redis caching
- **CDN**: CloudFront for global asset delivery
- **Monitoring**: Comprehensive observability stack
- **Security**: PCI DSS compliant infrastructure

---

## Environment Strategy

### Environment Tiers

| Environment | Purpose | Infrastructure | Data | Monitoring |
|-------------|---------|----------------|------|------------|
| **Development** | Local development | Docker Compose | SQLite, Mock services | Basic logging |
| **Staging** | Pre-production testing | Scaled-down AWS | Production-like data | Full monitoring |
| **Production** | Live platform | Full AWS infrastructure | Live data, backups | Complete observability |

### Environment Configuration

```yaml
# Development Environment
development:
  database:
    type: sqlite
    file: ./data/keylo_dev.db
  redis:
    url: redis://localhost:6379
  storage:
    type: local
    path: ./uploads
  external_services:
    firebase:
      use_emulator: true
    transfi:
      use_sandbox: true
    maps:
      api_key: development_key
  monitoring:
    level: basic
    
# Staging Environment  
staging:
  database:
    type: postgresql
    host: keylo-staging-db.cluster-xxx.us-east-1.rds.amazonaws.com
    ssl: true
    connection_pool: 5
  redis:
    url: keylo-staging-cache.xxx.cache.amazonaws.com:6379
    ssl: true
  storage:
    type: s3
    bucket: keylo-staging-assets
  external_services:
    firebase:
      project_id: keylo-staging
    transfi:
      use_sandbox: true
    maps:
      api_key: staging_key
  monitoring:
    level: full
    
# Production Environment
production:
  database:
    type: postgresql
    host: keylo-prod-db.cluster-xxx.us-east-1.rds.amazonaws.com
    ssl: true
    connection_pool: 20
    read_replicas: 2
  redis:
    cluster_url: keylo-prod-cache.xxx.cache.amazonaws.com:6379
    ssl: true
    cluster_mode: enabled
  storage:
    type: s3
    bucket: keylo-production-assets
    cdn: https://cdn.keylo.bs
  external_services:
    firebase:
      project_id: keylo-production
    transfi:
      live_endpoint: true
    maps:
      api_key: production_key
  monitoring:
    level: comprehensive
    alerting: enabled
```

---

## AWS Infrastructure Architecture

### High-Level AWS Architecture

```mermaid
graph TB
    subgraph "Global"
        Route53[Route 53<br/>DNS Management]
        CloudFront[CloudFront CDN<br/>Global Distribution]
    end
    
    subgraph "US-East-1 Region"
        subgraph "Availability Zone A"
            ALB[Application Load Balancer]
            ECS_A[ECS Fargate Tasks<br/>AZ-A]
            RDS_Primary[RDS PostgreSQL<br/>Primary Instance]
        end
        
        subgraph "Availability Zone B"
            ECS_B[ECS Fargate Tasks<br/>AZ-B]
            RDS_Standby[RDS PostgreSQL<br/>Standby Instance]
        end
        
        subgraph "Availability Zone C"
            ECS_C[ECS Fargate Tasks<br/>AZ-C]
            ElastiCache[ElastiCache Redis<br/>Cluster]
        end
        
        subgraph "Storage & Monitoring"
            S3[S3 Buckets<br/>Assets & Backups]
            CloudWatch[CloudWatch<br/>Monitoring & Logs]
            Secrets[Secrets Manager<br/>Configuration]
        end
    end
    
    Route53 --> CloudFront
    CloudFront --> ALB
    ALB --> ECS_A
    ALB --> ECS_B
    ALB --> ECS_C
    ECS_A --> RDS_Primary
    ECS_B --> RDS_Primary
    ECS_C --> RDS_Primary
    RDS_Primary --> RDS_Standby
    ECS_A --> ElastiCache
    ECS_B --> ElastiCache
    ECS_C --> ElastiCache
    ECS_A --> S3
    ECS_B --> S3
    ECS_C --> S3
    ECS_A --> CloudWatch
    ECS_B --> CloudWatch
    ECS_C --> CloudWatch
```

### AWS Resource Specifications

#### Compute Resources

```yaml
# ECS Fargate Configuration
ecs_cluster:
  name: keylo-production
  capacity_providers: [FARGATE, FARGATE_SPOT]
  
api_service:
  family: keylo-api
  cpu: 1024  # 1 vCPU
  memory: 2048  # 2 GB
  platform_version: 1.4.0
  desired_count: 3
  min_count: 2
  max_count: 10
  auto_scaling:
    target_cpu: 70%
    target_memory: 80%
    scale_out_cooldown: 300s
    scale_in_cooldown: 600s
    
websocket_service:
  family: keylo-websocket
  cpu: 512  # 0.5 vCPU  
  memory: 1024  # 1 GB
  desired_count: 2
  min_count: 1
  max_count: 5
  auto_scaling:
    target_cpu: 60%
    target_memory: 70%
```

#### Database Configuration

```yaml
# RDS PostgreSQL
rds_instance:
  identifier: keylo-production-db
  engine: postgres
  engine_version: 15.4
  instance_class: db.t3.medium
  allocated_storage: 100  # GB
  max_allocated_storage: 1000  # GB auto-scaling
  storage_type: gp3
  storage_encrypted: true
  multi_az: true
  backup_retention_period: 7  # days
  backup_window: "03:00-04:00"  # UTC
  maintenance_window: "sun:04:00-sun:05:00"  # UTC
  deletion_protection: true
  
  # Read replicas for scaling
  read_replicas:
    - identifier: keylo-production-db-read-1
      instance_class: db.t3.medium
      availability_zone: us-east-1b
    - identifier: keylo-production-db-read-2  
      instance_class: db.t3.medium
      availability_zone: us-east-1c
      
  # Connection pooling
  rds_proxy:
    target_group: keylo-db-pool
    max_connections_percent: 100
    max_idle_connections_percent: 50
    require_tls: true
```

#### Caching Layer

```yaml
# ElastiCache Redis
redis_cluster:
  cluster_id: keylo-production-cache
  engine: redis
  engine_version: 7.0
  node_type: cache.t3.medium
  num_cache_nodes: 3
  replication_group_id: keylo-cache-group
  multi_az: true
  automatic_failover: true
  backup_retention_period: 5
  backup_window: "03:00-05:00"  # UTC
  maintenance_window: "sun:05:00-sun:07:00"  # UTC
  at_rest_encryption: true
  in_transit_encryption: true
  
  # Redis configuration
  configuration:
    maxmemory_policy: allkeys-lru
    timeout: 300
    databases: 16
```

#### Storage & CDN

```yaml
# S3 Buckets
s3_buckets:
  assets:
    name: keylo-production-assets
    versioning: enabled
    lifecycle_rules:
      - id: delete_old_versions
        status: enabled
        noncurrent_version_expiration: 90  # days
    cors_configuration:
      allowed_origins: ["https://keylo.bs", "https://app.keylo.bs"]
      allowed_methods: [GET, POST, PUT, DELETE]
      allowed_headers: ["*"]
      max_age_seconds: 3600
      
  backups:
    name: keylo-production-backups  
    versioning: enabled
    lifecycle_rules:
      - id: archive_old_backups
        status: enabled
        transition_to_ia: 30  # days
        transition_to_glacier: 90  # days
        expiration: 2555  # 7 years
        
  logs:
    name: keylo-production-logs
    lifecycle_rules:
      - id: delete_old_logs
        status: enabled
        expiration: 90  # days

# CloudFront Distribution
cloudfront:
  origins:
    - domain: keylo-production-assets.s3.amazonaws.com
      origin_id: S3-keylo-assets
      origin_access_control: enabled
    - domain: keylo-api-alb-xxx.us-east-1.elb.amazonaws.com
      origin_id: ALB-keylo-api
      custom_origin_config:
        http_port: 80
        https_port: 443
        origin_protocol_policy: https-only
        
  cache_behaviors:
    - path_pattern: "/api/*"
      target_origin: ALB-keylo-api
      viewer_protocol_policy: redirect-to-https
      cache_policy: CachingDisabled
      origin_request_policy: CORS-S3Origin
      
    - path_pattern: "/assets/*"
      target_origin: S3-keylo-assets
      viewer_protocol_policy: redirect-to-https
      cache_policy: CachingOptimized
      compress: true
      
  price_class: PriceClass_100  # US, Canada, Europe
  geo_restriction:
    restriction_type: none
```

---

## Container Configuration

### Docker Configuration

#### API Service Dockerfile

```dockerfile
# Multi-stage build for Node.js API
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build application
RUN npm run build --workspace=apps/api

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S keylo -u 1001

# Copy built application and dependencies
COPY --from=builder --chown=keylo:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=keylo:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=keylo:nodejs /app/packages/shared ./packages/shared

# Switch to non-root user
USER keylo

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

# Expose port
EXPOSE 3000

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

#### ECS Task Definition

```json
{
  "family": "keylo-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/keyloTaskRole",
  "containerDefinitions": [
    {
      "name": "keylo-api",
      "image": "ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/keylo-api:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:keylo/database-url"
        },
        {
          "name": "REDIS_URL", 
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:keylo/redis-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:keylo/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/keylo-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:3000/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: KeyLo CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: keylo-api
  ECS_SERVICE: keylo-api-service
  ECS_CLUSTER: keylo-production

jobs:
  test:
    name: Test & Quality Assurance
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: keylo_test
          POSTGRES_USER: keylo
          POSTGRES_PASSWORD: test123
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linting
        run: npm run lint
        
      - name: Run type checking
        run: npm run type-check
        
      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://keylo:test123@localhost:5432/keylo_test
          REDIS_URL: redis://localhost:6379
          
      - name: Run integration tests  
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://keylo:test123@localhost:5432/keylo_test
          REDIS_URL: redis://localhost:6379
          
      - name: Security audit
        run: npm audit --audit-level moderate
        
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  build:
    name: Build & Push Images
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
          
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
        
      - name: Build API image
        run: |
          docker build -f apps/api/Dockerfile -t $ECR_REGISTRY/$ECR_REPOSITORY:$GITHUB_SHA .
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$GITHUB_SHA $ECR_REGISTRY/$ECR_REPOSITORY:latest
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          
      - name: Push API image to ECR
        run: |
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$GITHUB_SHA
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          
      - name: Build mobile app
        run: |
          npm run build --workspace=apps/mobile
          
      - name: Upload mobile build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: mobile-build
          path: apps/mobile/dist/

  deploy-staging:
    name: Deploy to Staging
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
          
      - name: Deploy to staging ECS
        run: |
          aws ecs update-service \
            --cluster keylo-staging \
            --service keylo-api-service \
            --force-new-deployment
            
      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster keylo-staging \
            --services keylo-api-service
            
      - name: Run smoke tests
        run: |
          curl -f https://staging-api.keylo.bs/health
          
      - name: Deploy mobile app to staging
        run: |
          npx expo publish --release-channel staging

  deploy-production:
    name: Deploy to Production
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
          
      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service $ECS_SERVICE \
            --force-new-deployment
            
      - name: Wait for deployment to complete
        run: |
          aws ecs wait services-stable \
            --cluster $ECS_CLUSTER \
            --services $ECS_SERVICE
            
      - name: Run production smoke tests
        run: |
          curl -f https://api.keylo.bs/health
          curl -f https://api.keylo.bs/api/health
          
      - name: Deploy mobile app to production
        run: |
          npx expo publish --release-channel production
          
      - name: Notify deployment success
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: 'KeyLo production deployment successful! 🚀'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        if: success()
        
      - name: Notify deployment failure  
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          text: 'KeyLo production deployment failed! 🚨'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        if: failure()
```

---

## Monitoring & Observability

### CloudWatch Configuration

```yaml
# CloudWatch Log Groups
log_groups:
  - name: /ecs/keylo-api
    retention_days: 30
    
  - name: /ecs/keylo-websocket
    retention_days: 30
    
  - name: /aws/rds/instance/keylo-production-db/postgresql
    retention_days: 7
    
  - name: /aws/elasticache/keylo-production-cache
    retention_days: 7

# CloudWatch Alarms
alarms:
  - name: keylo-api-high-cpu
    metric_name: CPUUtilization
    namespace: AWS/ECS
    dimensions:
      ServiceName: keylo-api-service
      ClusterName: keylo-production
    statistic: Average
    period: 300
    evaluation_periods: 2
    threshold: 80
    comparison_operator: GreaterThanThreshold
    alarm_actions:
      - arn:aws:sns:us-east-1:ACCOUNT:keylo-alerts
      
  - name: keylo-api-high-memory
    metric_name: MemoryUtilization
    namespace: AWS/ECS
    dimensions:
      ServiceName: keylo-api-service
      ClusterName: keylo-production
    statistic: Average
    period: 300
    evaluation_periods: 2
    threshold: 85
    comparison_operator: GreaterThanThreshold
    alarm_actions:
      - arn:aws:sns:us-east-1:ACCOUNT:keylo-alerts
      
  - name: keylo-db-high-cpu
    metric_name: CPUUtilization
    namespace: AWS/RDS
    dimensions:
      DBInstanceIdentifier: keylo-production-db
    statistic: Average
    period: 300
    evaluation_periods: 3
    threshold: 75
    comparison_operator: GreaterThanThreshold
    alarm_actions:
      - arn:aws:sns:us-east-1:ACCOUNT:keylo-alerts
      
  - name: keylo-api-error-rate
    metric_name: keylo_api_errors_total
    namespace: KeyLo/API
    statistic: Sum
    period: 300
    evaluation_periods: 2
    threshold: 10
    comparison_operator: GreaterThanThreshold
    alarm_actions:
      - arn:aws:sns:us-east-1:ACCOUNT:keylo-alerts
```

### Application Monitoring

```typescript
// Custom CloudWatch Metrics
class MetricsService {
  private cloudWatch = new AWS.CloudWatch();
  
  async recordApiRequest(endpoint: string, method: string, statusCode: number, responseTime: number) {
    const params = {
      Namespace: 'KeyLo/API',
      MetricData: [
        {
          MetricName: 'RequestCount',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'Endpoint', Value: endpoint },
            { Name: 'Method', Value: method },
            { Name: 'StatusCode', Value: statusCode.toString() }
          ]
        },
        {
          MetricName: 'ResponseTime',
          Value: responseTime,
          Unit: 'Milliseconds',
          Dimensions: [
            { Name: 'Endpoint', Value: endpoint },
            { Name: 'Method', Value: method }
          ]
        }
      ]
    };
    
    await this.cloudWatch.putMetricData(params).promise();
  }
  
  async recordBusinessMetric(metricName: string, value: number, unit: string = 'Count') {
    const params = {
      Namespace: 'KeyLo/Business',
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Timestamp: new Date()
        }
      ]
    };
    
    await this.cloudWatch.putMetricData(params).promise();
  }
}

// Sentry Error Tracking
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ]
});

// Express middleware for request tracking
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
```

### Health Checks

```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  const healthChecks = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    status: 'healthy',
    version: process.env.APP_VERSION,
    checks: {}
  };
  
  try {
    // Database connectivity
    await db.raw('SELECT 1');
    healthChecks.checks.database = 'healthy';
  } catch (error) {
    healthChecks.checks.database = 'unhealthy';
    healthChecks.status = 'degraded';
  }
  
  try {
    // Redis connectivity
    await redis.ping();
    healthChecks.checks.redis = 'healthy';
  } catch (error) {
    healthChecks.checks.redis = 'unhealthy';
    healthChecks.status = 'degraded';
  }
  
  try {
    // External API connectivity
    await axios.get('https://api.transfi.com/health', { timeout: 5000 });
    healthChecks.checks.payment_gateway = 'healthy';
  } catch (error) {
    healthChecks.checks.payment_gateway = 'unhealthy';
    healthChecks.status = 'degraded';
  }
  
  const statusCode = healthChecks.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthChecks);
});
```

---

## Security Configuration

### Network Security

```yaml
# VPC Configuration
vpc:
  cidr_block: 10.0.0.0/16
  enable_dns_hostnames: true
  enable_dns_support: true
  
subnets:
  public:
    - cidr: 10.0.1.0/24
      availability_zone: us-east-1a
    - cidr: 10.0.2.0/24
      availability_zone: us-east-1b
    - cidr: 10.0.3.0/24
      availability_zone: us-east-1c
      
  private:
    - cidr: 10.0.11.0/24
      availability_zone: us-east-1a
    - cidr: 10.0.12.0/24
      availability_zone: us-east-1b
    - cidr: 10.0.13.0/24
      availability_zone: us-east-1c
      
# Security Groups
security_groups:
  alb:
    name: keylo-alb-sg
    ingress:
      - protocol: tcp
        port: 80
        source: 0.0.0.0/0
      - protocol: tcp
        port: 443
        source: 0.0.0.0/0
        
  ecs:
    name: keylo-ecs-sg
    ingress:
      - protocol: tcp
        port: 3000
        source: keylo-alb-sg
      - protocol: tcp
        port: 3001
        source: keylo-alb-sg
        
  rds:
    name: keylo-rds-sg
    ingress:
      - protocol: tcp
        port: 5432
        source: keylo-ecs-sg
        
  redis:
    name: keylo-redis-sg
    ingress:
      - protocol: tcp
        port: 6379
        source: keylo-ecs-sg
```

### IAM Roles & Policies

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "KeyLoTaskRole",
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}

{
  "Version": "2012-10-17", 
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::keylo-production-assets/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:*:secret:keylo/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "cloudwatch:namespace": ["KeyLo/API", "KeyLo/Business"]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": [
        "arn:aws:logs:us-east-1:*:log-group:/ecs/keylo-*"
      ]
    }
  ]
}
```

### SSL/TLS Configuration

```yaml
# ACM Certificate
ssl_certificate:
  domain_name: keylo.bs
  subject_alternative_names:
    - "*.keylo.bs"
    - api.keylo.bs
    - app.keylo.bs
  validation_method: DNS
  
# ALB HTTPS Configuration  
alb_listeners:
  - port: 443
    protocol: HTTPS
    ssl_policy: ELBSecurityPolicy-TLS-1-2-2017-01
    certificate_arn: arn:aws:acm:us-east-1:ACCOUNT:certificate/xxx
    default_actions:
      - type: forward
        target_group_arn: arn:aws:elasticloadbalancing:us-east-1:ACCOUNT:targetgroup/keylo-api
        
  - port: 80
    protocol: HTTP
    default_actions:
      - type: redirect
        redirect:
          protocol: HTTPS
          port: 443
          status_code: HTTP_301
```

---

## Backup & Disaster Recovery

### Database Backup Strategy

```yaml
# RDS Automated Backups
rds_backup:
  backup_retention_period: 7  # days
  backup_window: "03:00-04:00"  # UTC
  copy_tags_to_snapshot: true
  delete_automated_backups: false
  
# Manual Snapshots for Major Updates
manual_snapshots:
  before_deployment: true
  before_schema_migration: true
  retention_period: 30  # days
  
# Cross-Region Backup
cross_region_backup:
  destination_region: us-west-2
  kms_key_id: alias/keylo-backup-key
  retention_period: 30  # days
```

### Disaster Recovery Plan

```yaml
# Recovery Time Objectives (RTO)
rto_targets:
  database_failure: 15  # minutes
  application_failure: 5  # minutes
  region_failure: 2  # hours
  complete_disaster: 4  # hours
  
# Recovery Point Objectives (RPO)
rpo_targets:
  database_data_loss: 5  # minutes
  file_data_loss: 1  # hour
  configuration_loss: 0  # minutes (version controlled)
  
# Disaster Recovery Procedures
dr_procedures:
  - name: Database Failover
    trigger: Primary RDS instance failure
    steps:
      - Monitor RDS Multi-AZ automatic failover
      - Verify application connectivity to new primary
      - Check data integrity and replication lag
      - Update monitoring dashboards
      
  - name: Region Failover
    trigger: Complete regional outage
    steps:
      - Activate secondary region infrastructure
      - Restore database from cross-region backup
      - Update DNS records to point to secondary region
      - Deploy latest application version
      - Verify all services operational
      - Communicate status to stakeholders
```

### Data Retention Policies

```yaml
# Data Retention Schedule
data_retention:
  user_data:
    active_users: indefinite
    inactive_users: 3  # years after last login
    deleted_accounts: 30  # days (compliance hold)
    
  transaction_data:
    payment_records: 7  # years (financial compliance)
    booking_history: 5  # years
    audit_logs: 2  # years
    
  application_logs:
    error_logs: 90  # days
    access_logs: 30  # days
    debug_logs: 7  # days
    
  backup_data:
    database_backups: 7  # days automated, 30 days manual
    file_backups: 30  # days
    configuration_backups: 90  # days
```

---

## Cost Optimization

### Resource Sizing Strategy

```yaml
# Production Resource Allocation
cost_optimization:
  compute:
    strategy: right_sizing
    instance_types:
      - t3.medium  # General purpose, burstable
      - c5.large   # Compute optimized for API services
      - r5.large   # Memory optimized for caching
    reserved_instances: 50%  # 1-year term for predictable workloads
    spot_instances: 20%     # For non-critical batch processing
    
  storage:
    s3_storage_classes:
      - standard: frequent_access_files
      - ia: backup_files
      - glacier: long_term_archives
    ebs_volume_types:
      - gp3: general_purpose_ssd
      - io2: high_performance_database
      
  database:
    instance_sizing: t3.medium  # Start small, scale as needed
    storage_autoscaling: enabled
    read_replicas: 2  # For read traffic distribution
    
# Cost Monitoring
cost_alerts:
  - threshold: $500  # Monthly spend
    frequency: daily
    recipients: [devops@keylo.bs]
    
  - threshold: $1000  # Monthly spend  
    frequency: immediate
    recipients: [cto@keylo.bs, finance@keylo.bs]
```

### Estimated Monthly Costs

```yaml
# Production Environment Cost Estimate
estimated_monthly_costs:
  compute:
    ecs_fargate: $150  # 3 tasks x 1vCPU x 2GB x 24/7
    alb: $20          # Application Load Balancer
    
  storage:
    s3_standard: $25   # 1TB assets
    s3_backups: $10    # 500GB backups
    
  database:
    rds_primary: $120  # db.t3.medium Multi-AZ
    rds_replicas: $120 # 2 read replicas
    
  cache:
    elasticache: $60   # cache.t3.medium cluster
    
  networking:
    cloudfront: $30    # CDN data transfer
    data_transfer: $20 # Inter-AZ transfer
    
  monitoring:
    cloudwatch: $15    # Logs and metrics
    
  total_estimated: $570  # Monthly
  
# Cost by Environment
environment_costs:
  development: $50    # Local/minimal cloud resources
  staging: $200       # Scaled-down production
  production: $570    # Full production stack
  
  total_monthly: $820
```

---

## Deployment Checklist

### Pre-Deployment Checklist

```yaml
infrastructure_setup:
  - [ ] AWS account configured with appropriate IAM roles
  - [ ] VPC and networking configured
  - [ ] RDS PostgreSQL instance provisioned
  - [ ] ElastiCache Redis cluster provisioned
  - [ ] S3 buckets created with proper permissions
  - [ ] CloudFront distribution configured
  - [ ] ECS cluster and services defined
  - [ ] Load balancer configured with SSL certificate
  - [ ] Security groups and NACLs configured
  - [ ] Secrets Manager configured with application secrets
  
application_setup:
  - [ ] Docker images built and pushed to ECR
  - [ ] Database migrations tested
  - [ ] Environment variables configured
  - [ ] Health check endpoints implemented
  - [ ] Logging and monitoring configured
  - [ ] Backup procedures tested
  - [ ] Disaster recovery plan documented
  
security_setup:
  - [ ] SSL certificates installed and validated
  - [ ] Security group rules minimized
  - [ ] IAM roles follow least privilege principle
  - [ ] Secrets properly stored in Secrets Manager
  - [ ] Security scanning completed
  - [ ] Penetration testing performed
  
testing_validation:
  - [ ] All automated tests passing
  - [ ] Load testing completed
  - [ ] Security testing completed
  - [ ] User acceptance testing passed
  - [ ] Performance benchmarks met
  - [ ] Monitoring alerts tested
```

### Post-Deployment Verification

```yaml
functional_verification:
  - [ ] Application health checks passing
  - [ ] Database connectivity verified
  - [ ] External API integrations working
  - [ ] File uploads working correctly
  - [ ] Payment processing functional
  - [ ] Real-time messaging operational
  - [ ] Mobile app connecting to production API
  
performance_verification:
  - [ ] Response times within acceptable limits
  - [ ] Database query performance optimized
  - [ ] CDN cache hit rates acceptable
  - [ ] Auto-scaling working correctly
  - [ ] Resource utilization within targets
  
security_verification:
  - [ ] HTTPS redirects working
  - [ ] Authentication flows secure
  - [ ] Authorization rules enforced
  - [ ] Data encryption verified
  - [ ] Security headers configured
  
monitoring_verification:
  - [ ] Application metrics flowing to CloudWatch
  - [ ] Error tracking working in Sentry
  - [ ] Log aggregation functional
  - [ ] Alerting rules firing correctly
  - [ ] Dashboards displaying accurate data
```

---

## Conclusion

This deployment and infrastructure specification provides a comprehensive, production-ready foundation for KeyLo's launch and scaling. The architecture emphasizes:

### Key Strengths

1. **Scalability**: Auto-scaling compute resources and database read replicas
2. **Reliability**: Multi-AZ deployment with automated failover
3. **Security**: Defense-in-depth with network, application, and data security
4. **Performance**: CDN, caching, and optimized resource allocation
5. **Observability**: Comprehensive monitoring and alerting
6. **Cost Efficiency**: Right-sized resources with cost optimization strategies

### Implementation Priority

1. **Phase 1**: Core infrastructure setup (VPC, RDS, ECS)
2. **Phase 2**: Application deployment and basic monitoring
3. **Phase 3**: Advanced monitoring, alerting, and optimization
4. **Phase 4**: Disaster recovery and cost optimization refinements

The infrastructure is designed to support KeyLo's growth from MVP to scaled Caribbean marketplace while maintaining operational excellence and cost effectiveness.