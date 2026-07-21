resource "aws_secretsmanager_secret" "database_url" {
  name = "${local.name_prefix}/database-url"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-url-secret"
  })
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id     = aws_secretsmanager_secret.database_url.id
  secret_string = "postgresql+asyncpg://stayos:${var.db_password}@${aws_db_instance.main.endpoint}:5432/stayos"
}

resource "aws_secretsmanager_secret" "redis_url" {
  name = "${local.name_prefix}/redis-url"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-url-secret"
  })
}

resource "aws_secretsmanager_secret_version" "redis_url" {
  secret_id     = aws_secretsmanager_secret.redis_url.id
  secret_string = "redis://${aws_elasticache_replication_group.main.primary_endpoint_address}:6379/0"
}

resource "aws_secretsmanager_secret" "firebase" {
  name = "${local.name_prefix}/firebase"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-firebase-secret"
  })
}

resource "aws_secretsmanager_secret" "twilio" {
  name = "${local.name_prefix}/twilio"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-twilio-secret"
  })
}

resource "aws_secretsmanager_secret" "paymob" {
  name = "${local.name_prefix}/paymob"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-paymob-secret"
  })
}

resource "aws_secretsmanager_secret" "whatsapp" {
  name = "${local.name_prefix}/whatsapp"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-whatsapp-secret"
  })
}

resource "aws_secretsmanager_secret" "s3" {
  name = "${local.name_prefix}/s3"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-secret"
  })
}

resource "aws_secretsmanager_secret" "sentry" {
  name = "${local.name_prefix}/sentry"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sentry-secret"
  })
}
