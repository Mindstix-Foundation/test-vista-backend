# Test Vista Backend

NestJS backend API for the Test Vista educational testing platform, providing robust services for intelligent test paper generation, user management, and comprehensive analytics.

## 🎯 Overview

The Test Vista backend is a scalable, enterprise-grade API built with NestJS that powers both offline test paper generation and online MCQ testing capabilities. It provides secure, high-performance services for administrators, teachers, and students with comprehensive question bank management and advanced analytics.

## 🚀 Tech Stack

### Core Framework
- **NestJS** - Progressive Node.js framework with TypeScript
- **TypeScript** - Type-safe development with enhanced IDE support
- **Node.js** - JavaScript runtime for server-side development

### Database & ORM
- **PostgreSQL** - Robust relational database
- **Prisma ORM** - Type-safe database client and schema management
- **Database Migrations** - Automated schema versioning

### Authentication & Security
- **JWT (JSON Web Tokens)** - Stateless authentication
- **Passport.js** - Authentication middleware
- **bcrypt** - Password hashing and security
- **CORS** - Cross-origin resource sharing

### File Storage & Processing
- **AWS S3** - Cloud file storage
- **Multer** - File upload handling
- **Sharp** - Image processing (if needed)

### API Documentation & Validation
- **Swagger/OpenAPI** - Comprehensive API documentation
- **Class Validator** - Request validation and transformation
- **Class Transformer** - Object serialization and deserialization

### Development & Testing
- **Jest** - Unit and integration testing
- **Supertest** - HTTP assertion testing
- **ESLint** - Code linting and quality
- **Prettier** - Code formatting

## 📁 Project Structure

```
backend/
├── src/
│   ├── modules/             # Feature modules
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # User management
│   │   ├── questions/      # Question bank management
│   │   ├── test-papers/    # Test paper generation
│   │   ├── students/       # Student management
│   │   ├── teachers/       # Teacher management
│   │   ├── analytics/      # Performance analytics
│   │   └── iti-mocktest/   # ITI-specific testing
│   ├── common/             # Shared utilities
│   │   ├── decorators/     # Custom decorators
│   │   ├── filters/        # Exception filters
│   │   ├── guards/         # Authentication guards
│   │   ├── interceptors/   # Request/response interceptors
│   │   └── pipes/          # Validation pipes
│   ├── prisma/             # Database configuration
│   ├── utils/              # Helper functions
│   └── main.ts             # Application entry point
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── seed.ts             # Database seeding
├── test/                   # Test files
├── dist/                   # Compiled JavaScript
└── backups/                # Database backups
```

## 🛠️ Development Setup

### Prerequisites
- **Node.js**: v16.0.0 or higher
- **PostgreSQL**: v12.0 or higher
- **npm**: v7.0.0 or higher
- **Git**: For version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd test-vista-be
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DATABASE_URL="postgresql://username:password@localhost:5432/test_vista"
   
   # JWT Configuration
   JWT_SECRET="your-super-secret-jwt-key-here"
   JWT_EXPIRES_IN="24h"
   
   # AWS S3 Configuration
   AWS_ACCESS_KEY_ID="your-aws-access-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
   AWS_REGION="your-aws-region"
   AWS_S3_BUCKET="your-s3-bucket-name"
   
   # Application Configuration
   PORT=3000
   NODE_ENV=development
   
   # Email Configuration (if needed)
   SMTP_HOST="your-smtp-host"
   SMTP_PORT=587
   SMTP_USER="your-email@domain.com"
   SMTP_PASS="your-email-password"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # Seed database with initial data (optional)
   npx prisma db seed
   ```

5. **Start development server**
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3000`

## 📜 Available Scripts

### Development
- `npm run start` - Start the application
- `npm run start:dev` - Start with hot reload (recommended for development)
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start in production mode

### Building
- `npm run build` - Build the application for production

### Database
- `npx prisma migrate dev` - Create and apply new migration
- `npx prisma migrate deploy` - Apply migrations in production
- `npx prisma generate` - Generate Prisma client
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma db seed` - Seed database with initial data

### Code Quality
- `npm run lint` - Run ESLint and fix issues
- `npm run format` - Format code with Prettier

### Testing
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage report
- `npm run test:e2e` - Run end-to-end tests

## 🏗️ API Architecture

### Module Structure
Each feature is organized as a NestJS module with:
- **Controller** - HTTP request handling
- **Service** - Business logic implementation
- **DTOs** - Data Transfer Objects for validation
- **Entities** - Database model definitions
- **Guards** - Authentication and authorization
- **Interceptors** - Request/response transformation

### Database Schema
Key database entities include:
- **Users** - Admin, Teacher, Student accounts
- **Boards** - Educational boards (CBSE, ICSE, etc.)
- **Schools** - Educational institutions
- **Standards** - Class/grade levels
- **Subjects** - Academic subjects
- **Chapters** - Subject chapters
- **Questions** - Question bank with multiple types
- **TestPapers** - Generated test papers
- **TestAttempts** - Student test submissions
- **Results** - Performance analytics data

## 📚 Key Features

### 🔐 Authentication & Authorization
- **JWT-based Authentication** - Secure token-based auth
- **Role-based Access Control** - Admin, Teacher, Student roles
- **Password Security** - bcrypt hashing with salt
- **Session Management** - Secure session handling

### 📝 Test Paper Management
- **Intelligent Generation** - Algorithm-based question selection
- **Pattern Management** - Flexible exam pattern configuration
- **Weightage Distribution** - Chapter-wise mark allocation
- **Question Swapping** - Replace questions while maintaining integrity
- **Multi-format Export** - PDF, HTML, TXT generation

### 📊 Question Bank System
- **Multi-type Support** - MCQ, Fill-blanks, True/False, Match pairs, Short/Long answers
- **Multi-language Support** - English, Hindi, Marathi questions
- **Categorization** - Organized by board, subject, chapter, difficulty
- **Bulk Import** - CSV-based question import
- **Quality Control** - Admin review and approval system

### 👥 User Management
- **Multi-institutional Support** - Handle multiple schools
- **User Onboarding** - Email invitation system
- **Profile Management** - Comprehensive user profiles
- **Access Control** - Granular permission management

### 📈 Analytics & Reporting
- **Performance Tracking** - Student and class analytics
- **Chapter-wise Analysis** - Detailed performance breakdowns
- **Trend Analysis** - Historical performance data
- **Export Capabilities** - PDF and Excel reports

### 🔄 Online Testing System
- **MCQ Test Assignment** - Assign tests to students
- **Real-time Processing** - Instant result calculation
- **Time Management** - Timed test sessions
- **Auto-submission** - Automatic test submission

## 🔧 Configuration

### Database Configuration
Prisma schema defines the database structure:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  role      UserRole
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // ... additional fields
}
```

### Swagger API Documentation
Access comprehensive API documentation at:
- **Development**: `http://localhost:3000/api`
- **JSON Schema**: `http://localhost:3000/api-json`

## 🧪 Testing

### Unit Testing
```bash
npm run test
```

### Test Coverage
```bash
npm run test:cov
```

### End-to-End Testing
```bash
npm run test:e2e
```

### Testing Best Practices
- Write unit tests for all services
- Mock external dependencies
- Test both success and error scenarios
- Maintain high test coverage (>80%)

## 🚀 Production Deployment

### Environment Setup
1. **Set production environment variables**
2. **Configure production database**
3. **Set up AWS S3 bucket**
4. **Configure SMTP for emails**

### Build and Deploy
```bash
# Build the application
npm run build

# Run database migrations
npx prisma migrate deploy

# Start in production mode
npm run start:prod
```

### Performance Optimization
- **Connection Pooling** - Database connection optimization
- **Caching** - Redis integration for frequently accessed data
- **Rate Limiting** - Prevent API abuse
- **Compression** - Gzip compression for responses

## 🔒 Security Features

### Authentication Security
- **JWT Token Validation** - Secure token verification
- **Password Hashing** - bcrypt with salt rounds
- **Role-based Guards** - Endpoint-level authorization
- **CORS Configuration** - Cross-origin request control

### Data Protection
- **Input Validation** - Comprehensive request validation
- **SQL Injection Prevention** - Prisma ORM protection
- **XSS Protection** - Input sanitization
- **Rate Limiting** - DDoS protection

### OWASP Compliance
- **Security Headers** - Helmet.js integration
- **Dependency Scanning** - Regular security audits
- **Error Handling** - Secure error responses
- **Logging** - Comprehensive audit trails

## 📊 Performance Specifications

- **Response Time**: Sub-3-second test paper generation
- **Concurrent Users**: 1000+ simultaneous users supported
- **Database Performance**: Optimized queries with indexing
- **Memory Usage**: Efficient memory management
- **Uptime**: 99.9% availability target

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database connection
   npx prisma db pull
   
   # Reset database (development only)
   npx prisma migrate reset
   ```

2. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   ```

3. **Prisma Client Issues**
   ```bash
   # Regenerate Prisma client
   npx prisma generate
   ```

4. **Environment Variables**
   ```bash
   # Verify environment variables are loaded
   node -e "console.log(process.env.DATABASE_URL)"
   ```

### Debug Mode
Enable debug logging:
```env
NODE_ENV=development
LOG_LEVEL=debug
```

## 📚 Documentation

- **NestJS Documentation**: https://docs.nestjs.com/
- **Prisma Documentation**: https://www.prisma.io/docs/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **JWT Documentation**: https://jwt.io/

## 🔍 API Endpoints Overview

### Authentication
- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout

### Test Paper Management
- `POST /test-papers/create-offline` - Create offline test paper
- `POST /test-papers/create-mcq` - Create online MCQ test
- `GET /test-papers` - List test papers
- `PUT /test-papers/:id` - Update test paper
- `POST /test-papers/:id/export-pdf` - Export as PDF

### Question Bank
- `POST /questions/bulk-import` - Import questions from CSV
- `GET /questions` - List questions with filters
- `POST /questions` - Add new question
- `PUT /questions/:id` - Update question
- `DELETE /questions/:id` - Delete question

### User Management
- `GET /users` - List users
- `POST /users/invite` - Invite new user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Analytics
- `GET /analytics/class-performance` - Class performance data
- `GET /analytics/student-progress` - Student progress tracking
- `GET /analytics/chapter-wise` - Chapter-wise analysis

## 🤝 Contributing

1. Follow NestJS best practices and conventions
2. Write comprehensive unit tests
3. Update API documentation for new endpoints
4. Follow TypeScript strict mode guidelines
5. Implement proper error handling
6. Add appropriate logging

### Code Style Guidelines
- Use TypeScript strict mode
- Follow NestJS module structure
- Implement proper DTOs for validation
- Use descriptive variable and function names
- Add JSDoc comments for complex functions

---

**Part of the Test Vista Educational Testing Platform**
