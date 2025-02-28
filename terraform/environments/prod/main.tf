provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Production Database Instance
resource "google_sql_database_instance" "main" {
  name             = "${var.project_id}-prod-db-instance"
  database_version = "POSTGRES_14"
  region           = var.region
  
  settings {
    tier = "db-f1-micro"  # Production might need a larger tier
    
    backup_configuration {
      enabled            = true
      binary_log_enabled = false
      start_time         = "02:00"  # 2 AM UTC
      point_in_time_recovery_enabled = true
    }
    
    maintenance_window {
      day          = 7  # Sunday
      hour         = 3  # 3 AM UTC
      update_track = "stable"
    }
    
    ip_configuration {
      ipv4_enabled = true
      require_ssl  = true
    }
    
    database_flags {
      name  = "max_connections"
      value = "100"
    }
    
    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }
  }
  
  deletion_protection = true  # Protect production database from accidental deletion
}

# Production Database
resource "google_sql_database" "database" {
  name     = "teach-niche-prod"
  instance = google_sql_database_instance.main.name
}

# Production Database User
resource "google_sql_user" "users" {
  name     = "teach-niche-app-prod"
  instance = google_sql_database_instance.main.name
  password = var.db_password
}

# Production Media Storage Bucket
resource "google_storage_bucket" "media_bucket" {
  name     = "${var.project_id}-prod-media"
  location = var.region
  
  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    condition {
      age = 30  # days
    }
    action {
      type = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  
  cors {
    origin          = ["https://teachniche.com"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# IAM binding for the service account to access the bucket
resource "google_storage_bucket_iam_binding" "binding" {
  bucket = google_storage_bucket.media_bucket.name
  role   = "roles/storage.objectAdmin"
  
  members = [
    "serviceAccount:${var.service_account_email}",
  ]
}

# Cloud Armor security policy for production
resource "google_compute_security_policy" "policy" {
  name = "production-security-policy"
  
  rule {
    action   = "deny(403)"
    priority = "1000"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-stable')"
      }
    }
    description = "XSS protection"
  }
  
  rule {
    action   = "deny(403)"
    priority = "1001"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-stable')"
      }
    }
    description = "SQL injection protection"
  }
  
  rule {
    action   = "allow"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default rule, allow all traffic"
  }
}

# Output the connection information
output "instance_connection_name" {
  value = google_sql_database_instance.main.connection_name
  description = "The connection name of the production database instance"
}

output "database_name" {
  value = google_sql_database.database.name
  description = "The name of the production database"
}

output "media_bucket_url" {
  value = google_storage_bucket.media_bucket.url
  description = "The URL of the production media storage bucket"
}
