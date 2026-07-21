terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "stayos-terraform-state"
    key            = "terraform.tfstate"
    region         = "me-south-1"
    encrypt        = true
    dynamodb_table = "stayos-terraform-locks"
  }
}

provider "aws" {
  region = var.region
}

data "aws_caller_identity" "current" {}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = {
    Project var.project_name
    Environment var.environment
    ManagedBy = "Terraform"
  }
}
