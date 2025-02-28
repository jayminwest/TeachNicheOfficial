variable "project_id" {
  description = "The GCP project ID"
  type        = string
  default     = "teachnicheofficial"
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The GCP zone"
  type        = string
  default     = "us-central1-a"
}

variable "db_password" {
  description = "The database password"
  type        = string
  sensitive   = true
}

variable "service_account_email" {
  description = "The email of the service account"
  type        = string
  default     = "firebase-adminsdk@teachnicheofficial.iam.gserviceaccount.com"
}
