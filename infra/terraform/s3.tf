resource "aws_s3_bucket" "listings" {
  bucket = "${local.name_prefix}-listings"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-listings-bucket"
  })
}

resource "aws_s3_bucket_versioning" "listings" {
  bucket = aws_s3_bucket.listings.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "listings" {
  bucket = aws_s3_bucket.listings.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "listings" {
  bucket = aws_s3_bucket.listings.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "kyc" {
  bucket = "${local.name_prefix}-kyc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kyc-bucket"
  })
}

resource "aws_s3_bucket_versioning" "kyc" {
  bucket = aws_s3_bucket.kyc.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "kyc" {
  bucket = aws_s3_bucket.kyc.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "kyc" {
  bucket = aws_s3_bucket.kyc.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
