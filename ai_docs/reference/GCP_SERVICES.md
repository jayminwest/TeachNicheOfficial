# Google Cloud Platform Services Reference

## Overview

This document provides a comprehensive reference for the Google Cloud Platform (GCP) services used in the Teach Niche platform. It outlines each service's purpose, configuration, and integration within our architecture.

## Core Services

### Firebase Authentication

Firebase Authentication provides secure, easy-to-use authentication for our application.

#### Key Features
- Email/password authentication
- Google OAuth integration
- Multi-factor authentication
- Secure session management
- Custom claims for role-based access control

#### Configuration
Firebase Authentication is configured through the Firebase console and initialized in our application:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

#### Integration Points
- User registration and login flows
- Protected API routes
- Role-based access control
- User profile management

#### For detailed information, see [FIREBASE_AUTHENTICATION.md](../reference/FIREBASE_AUTHENTICATION.md)

### Cloud Firestore

Cloud Firestore is our NoSQL document database for storing and syncing application data.

#### Key Features
- Real-time data synchronization
- Offline support
- Automatic scaling
- Strong consistency guarantees
- Complex querying capabilities

#### Configuration
Firestore is initialized in our application:

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

#### Data Structure
Our Firestore database is organized into the following collections:

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `users` | User profiles | `id`, `displayName`, `email`, `createdAt` |
| `lessons` | Lesson content | `id`, `title`, `content`, `creatorId`, `price` |
| `enrollments` | User lesson enrollments | `userId`, `lessonId`, `purchasedAt` |
| `transactions` | Payment records | `id`, `userId`, `amount`, `status`, `createdAt` |
| `payouts` | Creator payout records | `id`, `userId`, `amount`, `status`, `createdAt` |

#### Integration Points
- User data management
- Lesson content storage and retrieval
- Enrollment tracking
- Transaction history

### Cloud SQL (PostgreSQL)

Cloud SQL provides a fully managed PostgreSQL database for structured data storage.

#### Key Features
- Fully managed PostgreSQL
- Automatic backups
- High availability configuration
- Vertical and horizontal scaling
- Private VPC connectivity

#### Configuration
Cloud SQL is provisioned through Terraform:

```hcl
resource "google_sql_database_instance" "main" {
  name             = "${var.project_id}-db-instance"
  database_version = "POSTGRES_14"
  region           = var.region
  
  settings {
    tier = "db-f1-micro"
    
    backup_configuration {
      enabled            = true
      binary_log_enabled = true
      start_time         = "02:00"
    }
    
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.private_network.id
    }
  }
}

resource "google_sql_database" "database" {
  name     = "teach-niche-db"
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "users" {
  name     = "teach-niche-app"
  instance = google_sql_database_instance.main.name
  password = var.db_password
}
```

#### Database Schema
For detailed schema information, see [DATABASE_SCHEMA.md](../reference/DATABASE_SCHEMA.md)

#### Integration Points
- Complex relational data storage
- Reporting and analytics
- Data that requires strong consistency and transactions

### Firebase Storage / Cloud Storage

Firebase Storage provides secure file uploads and downloads for user-generated content.

#### Key Features
- Secure file uploads and downloads
- Integration with Firebase Authentication
- Scalable storage for user content
- CDN integration for fast content delivery
- Fine-grained security rules

#### Configuration
Firebase Storage is initialized in our application:

```typescript
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
```

#### Storage Structure
Our storage is organized into the following buckets:

| Bucket | Purpose | Access Control |
|--------|---------|----------------|
| `teachnicheofficial-media` | User-uploaded media | User-specific access |
| `teachnicheofficial-public` | Public assets | Public read access |
| `teachnicheofficial-backups` | Database backups | Admin-only access |

#### Integration Points
- User profile images
- Lesson media content
- Document attachments
- Backup storage

#### For detailed information, see [CLOUD_STORAGE.md](../reference/CLOUD_STORAGE.md)

### Cloud Functions

Cloud Functions provide serverless compute for event-driven backend processing.

#### Key Features
- Event-driven serverless functions
- Automatic scaling
- Integration with Firebase and GCP services
- Support for Node.js, Python, Go, Java, and more
- HTTP triggers and background functions

#### Configuration
Cloud Functions are deployed through the Firebase CLI or Google Cloud CLI:

```bash
firebase deploy --only functions
```

#### Key Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `processPayment` | HTTP trigger | Process Stripe payment webhooks |
| `generateThumbnail` | Storage trigger | Create thumbnails for uploaded images |
| `sendWelcomeEmail` | Auth trigger | Send welcome email to new users |
| `schedulePayout` | Pub/Sub trigger | Process creator payouts on schedule |

#### Integration Points
- Payment processing
- Email notifications
- Media processing
- Scheduled tasks

### Cloud Run

Cloud Run provides serverless container execution for our API services.

#### Key Features
- Fully managed serverless platform
- Container-based deployment
- Automatic scaling
- Pay-per-use pricing
- Custom domain mapping

#### Configuration
Cloud Run services are deployed through Google Cloud CLI or CI/CD pipelines:

```bash
gcloud run deploy api-service \
  --image gcr.io/teachnicheofficial/api-service \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated
```

#### Services

| Service | Purpose | Endpoints |
|---------|---------|-----------|
| `api-service` | Main API service | `/api/*` |
| `webhook-service` | Webhook processing | `/webhooks/*` |
| `analytics-service` | Analytics processing | `/analytics/*` |

#### Integration Points
- API endpoints
- Webhook processing
- Background processing

### Identity Platform

Identity Platform extends Firebase Authentication with advanced features.

#### Key Features
- Advanced multi-factor authentication
- Enterprise-grade security
- SAML and OIDC support
- Detailed authentication logs
- Custom authentication flows

#### Configuration
Identity Platform is configured through the Google Cloud Console and integrated with Firebase Authentication.

#### Integration Points
- Enhanced authentication security
- Enterprise authentication requirements
- Compliance requirements

## Supporting Services

### Cloud Monitoring

Cloud Monitoring provides visibility into the performance, uptime, and health of our application.

#### Key Features
- Real-time metrics
- Custom dashboards
- Alerting policies
- Uptime checks
- Log-based metrics

#### Configuration
Monitoring is configured through the Google Cloud Console and Terraform:

```hcl
resource "google_monitoring_alert_policy" "api_latency_alert" {
  display_name = "API Latency Alert"
  combiner     = "OR"
  conditions {
    display_name = "API Latency > 1s"
    condition_threshold {
      filter     = "metric.type=\"run.googleapis.com/request_latencies\" resource.type=\"cloud_run_revision\" resource.label.\"service_name\"=\"api-service\""
      duration   = "60s"
      comparison = "COMPARISON_GT"
      threshold_value = 1000
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_PERCENTILE_99"
      }
    }
  }
  notification_channels = [google_monitoring_notification_channel.email.name]
}
```

#### Integration Points
- Application performance monitoring
- Infrastructure monitoring
- Alert notifications
- SLA compliance

### Cloud Logging

Cloud Logging provides centralized logging for all GCP services and our application.

#### Key Features
- Centralized log management
- Log-based metrics
- Log analysis
- Log export to BigQuery
- Log-based alerts

#### Configuration
Logging is configured through the Google Cloud Console and code instrumentation:

```typescript
import { logger } from '@/lib/logger';

try {
  // Operation
  logger.info('Operation successful', { userId, operationId });
} catch (error) {
  logger.error('Operation failed', { userId, operationId, error });
}
```

#### Integration Points
- Application logging
- Error tracking
- Audit logging
- Security analysis

### Secret Manager

Secret Manager provides secure storage for API keys, passwords, and other sensitive data.

#### Key Features
- Centralized secret management
- Version control for secrets
- Fine-grained access control
- Automatic rotation
- Audit logging

#### Configuration
Secrets are managed through the Google Cloud Console, CLI, or Terraform:

```hcl
resource "google_secret_manager_secret" "stripe_api_key" {
  secret_id = "stripe-api-key"
  
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "stripe_api_key_version" {
  secret = google_secret_manager_secret.stripe_api_key.id
  secret_data = var.stripe_api_key
}
```

#### Integration Points
- API keys storage
- Database credentials
- Service account keys
- OAuth client secrets

### Cloud Armor

Cloud Armor provides DDoS protection and web application firewall capabilities.

#### Key Features
- DDoS protection
- Web application firewall
- IP-based access control
- Geographic access control
- Custom security rules

#### Configuration
Cloud Armor is configured through the Google Cloud Console or Terraform:

```hcl
resource "google_compute_security_policy" "policy" {
  name = "teachniche-security-policy"
  
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
    action   = "allow"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default rule"
  }
}
```

#### Integration Points
- API protection
- Frontend protection
- Security compliance

### Cloud CDN

Cloud CDN provides content delivery network capabilities for fast content delivery.

#### Key Features
- Global content delivery
- Edge caching
- HTTPS support
- Cache invalidation
- Origin shield

#### Configuration
Cloud CDN is configured through the Google Cloud Console or Terraform:

```hcl
resource "google_compute_backend_bucket" "static_backend" {
  name        = "static-backend"
  bucket_name = google_storage_bucket.static.name
  enable_cdn  = true
}
```

#### Integration Points
- Static content delivery
- Media content delivery
- Global performance optimization

## Development and Testing

### Firebase Emulator Suite

Firebase Emulator Suite provides local development and testing environments for Firebase services.

#### Key Features
- Local Authentication emulation
- Local Firestore emulation
- Local Storage emulation
- Local Functions emulation
- UI for monitoring and debugging

#### Configuration
Firebase Emulator Suite is configured through `firebase.json`:

```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "functions": {
      "port": 5001
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

#### Integration Points
- Local development
- Automated testing
- CI/CD pipelines

### Cloud Build

Cloud Build provides continuous integration and delivery for our application.

#### Key Features
- Automated builds
- Integration with GitHub
- Custom build steps
- Artifact storage
- Deployment automation

#### Configuration
Cloud Build is configured through `cloudbuild.yaml`:

```yaml
steps:
  - name: 'gcr.io/cloud-builders/npm'
    args: ['install']
  
  - name: 'gcr.io/cloud-builders/npm'
    args: ['run', 'test']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/api-service', '.']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/api-service']
  
  - name: 'gcr.io/cloud-builders/gcloud'
    args: ['run', 'deploy', 'api-service', '--image', 'gcr.io/$PROJECT_ID/api-service', '--region', 'us-central1', '--platform', 'managed']
```

#### Integration Points
- CI/CD pipelines
- Automated testing
- Deployment automation

## Cost Management

### Budget Alerts

Budget Alerts provide notifications when GCP spending approaches or exceeds defined thresholds.

#### Key Features
- Budget definition
- Threshold alerts
- Email notifications
- Programmatic notifications
- Detailed cost breakdown

#### Configuration
Budget Alerts are configured through the Google Cloud Console or Terraform:

```hcl
resource "google_billing_budget" "budget" {
  billing_account = var.billing_account_id
  display_name    = "Teach Niche Monthly Budget"
  
  budget_filter {
    projects = ["projects/${var.project_id}"]
  }
  
  amount {
    specified_amount {
      currency_code = "USD"
      units         = "1000"
    }
  }
  
  threshold_rules {
    threshold_percent = 0.5
  }
  
  threshold_rules {
    threshold_percent = 0.9
  }
  
  all_updates_rule {
    monitoring_notification_channels = [
      google_monitoring_notification_channel.email.name
    ]
    disable_default_iam_recipients = true
  }
}
```

#### Integration Points
- Financial planning
- Cost optimization
- Budget compliance

### Recommendations

Recommendations provide insights for optimizing GCP resource usage and costs.

#### Key Features
- Cost optimization recommendations
- Performance recommendations
- Security recommendations
- Reliability recommendations
- Automated implementation

#### Access
Recommendations are accessed through the Google Cloud Console under "Recommendations".

#### Integration Points
- Cost optimization
- Resource rightsizing
- Security enhancement

## Security and Compliance

### Cloud IAM

Cloud IAM provides fine-grained access control for GCP resources.

#### Key Features
- Role-based access control
- Service accounts
- Custom roles
- Policy binding
- Audit logging

#### Configuration
IAM is configured through the Google Cloud Console, CLI, or Terraform:

```hcl
resource "google_service_account" "app_service_account" {
  account_id   = "app-service-account"
  display_name = "Application Service Account"
}

resource "google_project_iam_binding" "app_service_account_roles" {
  project = var.project_id
  role    = "roles/datastore.user"
  members = [
    "serviceAccount:${google_service_account.app_service_account.email}",
  ]
}
```

#### Integration Points
- Resource access control
- Service-to-service authentication
- Developer access management

### Cloud KMS

Cloud KMS provides cryptographic key management for encrypting sensitive data.

#### Key Features
- Key management
- Automatic key rotation
- Hardware security module (HSM)
- Customer-managed encryption keys (CMEK)
- Integration with GCP services

#### Configuration
KMS is configured through the Google Cloud Console, CLI, or Terraform:

```hcl
resource "google_kms_key_ring" "keyring" {
  name     = "teachniche-keyring"
  location = "global"
}

resource "google_kms_crypto_key" "key" {
  name     = "database-encryption-key"
  key_ring = google_kms_key_ring.keyring.id
  rotation_period = "7776000s" # 90 days
}
```

#### Integration Points
- Database encryption
- Storage encryption
- Secret encryption

### Security Command Center

Security Command Center provides security and risk management for GCP resources.

#### Key Features
- Vulnerability scanning
- Threat detection
- Security posture monitoring
- Compliance monitoring
- Remediation recommendations

#### Access
Security Command Center is accessed through the Google Cloud Console under "Security".

#### Integration Points
- Security monitoring
- Compliance reporting
- Vulnerability management

## Environment-Specific Configurations

### Development Environment

| Service | Configuration | Purpose |
|---------|--------------|---------|
| Firebase Authentication | Email/password only | Simplified authentication for development |
| Firestore | Development database | Isolated data for development |
| Cloud Storage | Development bucket | Isolated storage for development |
| Cloud Functions | Development deployment | Testing function changes |

### Staging Environment

| Service | Configuration | Purpose |
|---------|--------------|---------|
| Firebase Authentication | All methods | Testing all authentication flows |
| Firestore | Staging database | Production-like data for testing |
| Cloud Storage | Staging bucket | Production-like storage for testing |
| Cloud Functions | Staging deployment | Pre-production function testing |

### Production Environment

| Service | Configuration | Purpose |
|---------|--------------|---------|
| Firebase Authentication | All methods with MFA | Secure authentication for production |
| Firestore | Production database | Live application data |
| Cloud Storage | Production bucket | Live application storage |
| Cloud Functions | Production deployment | Live application functions |
| Cloud Armor | Enhanced security | Production DDoS and WAF protection |

## References

- [Google Cloud Documentation](https://cloud.google.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [GCP Pricing Calculator](https://cloud.google.com/products/calculator)
- [Firebase Pricing](https://firebase.google.com/pricing)
- [GCP Status Dashboard](https://status.cloud.google.com/)

## Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-03-01 | Documentation Team | Initial version |

---

*This document serves as a living reference. If you find information that is outdated or incorrect, please submit updates through the established documentation update process.*
