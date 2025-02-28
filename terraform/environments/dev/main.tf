terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Cloud SQL instance
resource "google_sql_database_instance" "main" {
  name             = "${var.project_id}-dev-db-instance"
  database_version = "POSTGRES_14"
  region           = var.region
  
  settings {
    tier = "db-f1-micro"  # Smallest instance for development
    
    backup_configuration {
      enabled = true
      point_in_time_recovery_enabled = true
    }
  }

  # Prevent accidental deletion
  deletion_protection = true
}

# Cloud SQL database
resource "google_sql_database" "database" {
  name     = "teach-niche-dev"
  instance = google_sql_database_instance.main.name
}

# Cloud SQL user
resource "google_sql_user" "users" {
  name     = "teach-niche-app-dev"
  instance = google_sql_database_instance.main.name
  password = var.db_password
}

# Cloud Storage bucket for files
resource "google_storage_bucket" "media_bucket" {
  name     = "${var.project_id}-dev-media"
  location = var.region
  
  uniform_bucket_level_access = true
  
  cors {
    origin          = ["https://teach-niche.com", "https://*.teach-niche.com"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}
