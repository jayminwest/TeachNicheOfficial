# Architecture Overview

This document provides a high-level overview of the Teach Niche platform architecture. The architecture is designed to be modular, scalable, and secure, with clear separation of concerns.

## System Architecture

### Client Layer
- **Web Application**: Next.js-based frontend with React components
- **Mobile Responsive Design**: Adaptive UI for all device sizes
- **Progressive Enhancement**: Core functionality works without JavaScript

### API Layer
- **REST API**: Primary interface for client-server communication
- **GraphQL API**: For complex data requirements and optimized queries
- **Webhooks**: For integration with external services

### Service Layer
- **Authentication Service**: User identity and access management
- **Content Service**: Lesson management and delivery
- **Payment Service**: Processing transactions and payouts
- **Analytics Service**: Usage tracking and reporting
- **Notification Service**: User alerts and communications

### Data Layer
- **Relational Database**: Google Cloud SQL (PostgreSQL) for structured data
- **Object Storage**: Firebase Storage / Google Cloud Storage for media content
- **Search Index**: For efficient content discovery
- **Cache**: For performance optimization

## Data Flow

1. **Content Creation**:
   - Instructor creates lesson content
   - Content is processed, validated, and stored
   - Metadata is indexed for discovery

2. **Content Discovery**:
   - Users search or browse for content
   - Recommendation engine suggests relevant content
   - Search results are filtered based on user preferences

3. **Content Consumption**:
   - User requests access to content
   - Authorization check confirms access rights
   - Content is delivered with appropriate controls

4. **Transactions**:
   - User initiates purchase
   - Payment is processed securely through Teach Niche as merchant of record
   - Buyer pays base price plus Stripe processing fees
   - Access rights are granted
   - Creator earnings (85% of lesson price) are recorded in the system
   - Platform fee (15% of lesson price) is retained
   - Creator receives periodic payouts based on accumulated earnings

## Security Architecture

- **Authentication**: Firebase Authentication with multi-factor authentication options
- **Authorization**: Role-based access control
- **Data Protection**: Encryption at rest and in transit
- **API Security**: Rate limiting, input validation, CSRF protection
- **Monitoring**: Google Cloud Monitoring with anomaly detection and alerting
- **End-to-End Testing**: Comprehensive testing of security flows with Playwright, including tests that verify correct integration with Firebase Authentication and payment services

## Testing Architecture

- **Test Driven Development (TDD)**: All features and components must have tests written before implementation
- **Unit Testing**: Component and function level tests
- **Integration Testing**: Testing interactions between components
- **End-to-End Testing**: Playwright tests for complete user journeys
- **Third-Party API Testing**: Tests that interact with actual third-party services (Stripe, Firebase, Google Cloud, etc.)
- **Visual Regression**: Screenshot comparison for UI consistency
- **API Testing**: Validation of API contracts and behaviors

## Scalability Considerations

- **Horizontal Scaling**: Stateless services for easy replication
- **Caching Strategy**: Multi-level caching for performance
- **Database Sharding**: For data growth management
- **CDN Integration**: For global content delivery
- **Microservices**: For independent scaling of components

## Integration Points

- **Payment Processing**: Stripe for payments (merchant of record model) and creator payouts
- **Video Services**: Mux for video processing and delivery
- **Analytics**: Google Analytics and BigQuery for data analysis
- **Email Service**: Google Workspace for notifications and communications
- **Social Media**: For sharing and authentication
- **Infrastructure**: Google Cloud Platform for hosting and services

This architecture is designed to be technology-agnostic while providing a clear structure for implementation. Specific technology choices should adhere to the principles outlined in this document.
