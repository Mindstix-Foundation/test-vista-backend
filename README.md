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


## 📊 Performance Specifications

- **Response Time**: Sub-3-second test paper generation
- **Database Performance**: Optimized queries with indexing
- **Memory Usage**: Efficient memory management
- **Uptime**: 99.9% availability target



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


## 🔗 Repository Link:


- **⚙️ Backend Repository**: [Test Vista Frontend](https://github.com/Mindstix-Foundation/test-vista-frontend) 

---

---

**Part of the Test Vista Educational Testing Platform**
