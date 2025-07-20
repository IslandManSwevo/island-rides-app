# Variables for Island Rides Infrastructure

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "island-rides"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 2
}

variable "instance_type" {
  description = "EC2 instance type for ECS tasks"
  type        = string
  default     = "t3.medium"
}

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 7
}

variable "enable_monitoring" {
  description = "Enable detailed monitoring"
  type        = bool
  default     = true
}

variable "min_capacity" {
  description = "Minimum capacity for auto scaling"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum capacity for auto scaling"
  type        = number
  default     = 10
}

variable "desired_capacity" {
  description = "Desired capacity for auto scaling"
  type        = number
  default     = 2
}

variable "cpu_utilization_threshold" {
  description = "CPU utilization threshold for scaling"
  type        = number
  default     = 70
}

variable "memory_utilization_threshold" {
  description = "Memory utilization threshold for scaling"
  type        = number
  default     = 80
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_max_allocated_storage" {
  description = "RDS maximum allocated storage in GB"
  type        = number
  default     = 100
}

variable "rds_backup_retention_period" {
  description = "RDS backup retention period in days"
  type        = number
  default     = 7
}

variable "rds_preferred_backup_window" {
  description = "RDS preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "rds_preferred_maintenance_window" {
  description = "RDS preferred maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "enable_rds_multi_az" {
  description = "Enable RDS Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "enable_rds_deletion_protection" {
  description = "Enable RDS deletion protection"
  type        = bool
  default     = false
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of Redis cache nodes"
  type        = number
  default     = 1
}

variable "redis_port" {
  description = "Redis port"
  type        = number
  default     = 6379
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
  default     = ""
}

variable "allowed_cidr_blocks" {
  description = "List of allowed CIDR blocks for security groups"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Environment-specific variables
variable "backend_image_uri" {
  description = "Backend Docker image URI"
  type        = string
  default     = ""
}

variable "frontend_image_uri" {
  description = "Frontend Docker image URI"
  type        = string
  default     = ""
}

variable "firebase_project_id" {
  description = "Firebase project ID"
  type        = string
  default     = ""
}

variable "paypal_client_id" {
  description = "PayPal client ID"
  type        = string
  default     = ""
  sensitive   = true
}

variable "paypal_client_secret" {
  description = "PayPal client secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret for authentication"
  type        = string
  default     = ""
  sensitive   = true
}

variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "redis_password" {
  description = "Redis password"
  type        = string
  sensitive   = true
}