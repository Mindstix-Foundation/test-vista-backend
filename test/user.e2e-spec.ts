import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';

// Mock repositories since this is an e2e test and we don't want to rely on real database connections
jest.mock('../src/modules/user/entities/user.entity');
jest.mock('../src/modules/role/entities/role.entity');
jest.mock('../src/modules/school/entities/school.entity');
jest.mock('../src/modules/school_standard/entities/school_standard.entity');
jest.mock('../src/modules/subject/entities/subject.entity');
jest.mock('../src/modules/medium_standard_subject/entities/medium_standard_subject.entity');
jest.mock('../src/modules/instruction_medium/entities/instruction_medium.entity');
jest.mock('../src/modules/school_instruction_medium/entities/school_instruction_medium.entity');
jest.mock('../src/modules/user_role/entities/user_role.entity');
jest.mock('../src/modules/user_school/entities/user_school.entity');
jest.mock('../src/modules/teacher_subject/entities/teacher_subject.entity');

describe('User Module (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let adminToken: string;
  
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    
    // Create admin token for authentication
    adminToken = jwtService.sign({ 
      sub: 1, 
      email: 'admin@example.com',
      roles: ['ADMIN']
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('PUT /users/teacher (Edit Teacher)', () => {
    it('should validate request and return 400 for missing required fields', async () => {
      const updateDto = {
        // Missing id field which is required
        name: 'Updated Teacher Name'
      };

      const response = await request(app.getHttpServer())
        .put('/users/teacher')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('id'); // should mention missing id field
    });

    it('should return 401 if no token is provided', async () => {
      const updateDto = {
        id: 1,
        name: 'Updated Teacher Name'
      };

      await request(app.getHttpServer())
        .put('/users/teacher')
        .send(updateDto)
        .expect(401);
    });

    it('should return 403 if user is not authenticated as admin', async () => {
      // Create a token for a teacher
      const teacherToken = jwtService.sign({ 
        sub: 1, 
        email: 'teacher@example.com',
        roles: ['TEACHER']
      });

      const updateDto = {
        id: 1,
        name: 'Should not update'
      };

      await request(app.getHttpServer())
        .put('/users/teacher')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(updateDto)
        .expect(403);
    });
  });
}); 