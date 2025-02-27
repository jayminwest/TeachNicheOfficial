output "db_instance_name" {
  value = google_sql_database_instance.main.name
}

output "db_connection_name" {
  value = google_sql_database_instance.main.connection_name
}

output "media_bucket_url" {
  value = google_storage_bucket.media_bucket.url
}
