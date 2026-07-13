variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  default     = "staging"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "me-south-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "stayos"
}

variable "db_password" {
  description = "Database master password (sensitive)"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "ecs_api_task_cpu" {
  description = "CPU units for API task"
  type        = number
  default     = 256
}

variable "ecs_api_task_memory" {
  description = "Memory for API task"
  type        = number
  default     = 512
}

variable "ecs_worker_task_cpu" {
  description = "CPU units for worker task"
  type        = number
  default     = 256
}

variable "ecs_worker_task_memory" {
  description = "Memory for worker task"
  type        = number
  default     = 512
}
