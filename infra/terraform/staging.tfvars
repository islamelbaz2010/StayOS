environment        = "staging"
region             = "me-central-1"
project_name       = "stayos"
db_instance_class  = "db.t3.micro"

# db_password is injected from AWS Secrets Manager or CI secret at apply time.
# Never commit a real password here.
# Usage: terraform apply -var-file=staging.tfvars -var="db_password=$DB_PASSWORD"
db_password = "REPLACE_AT_APPLY_TIME"

ecs_api_task_cpu    = 256
ecs_api_task_memory = 512

ecs_worker_task_cpu    = 256
ecs_worker_task_memory = 512
