import request from 'supertest';
import app from '../../app';
import { UserModel } from '../../models/user.model';

describe('Authentication Integration Tests', () => { // Test Suite function
        const testUser = {
            email: 'test@example.com',
            password: 'Test@1234',
            confirmPassword: 'Test@1234',
            name: 'Test User',
        };

        beforeAll(async () => {
            // Ensure the test user does not exist before tests
            await UserModel.deleteMany({ email: testUser.email });
        });

        afterAll(async () => {
            // Clean up the test user after tests
            await UserModel.deleteMany({ email: testUser.email });
        });

        describe('POST /api/auth/register', () => { // Test Case function
            test(
                'should register a new user successfully', // Test name
                async () => { // Test function
                    const response = await request(app)
                        .post('/api/auth/register')
                        .send(testUser)
                        
                    // Validate response structure
                    expect(response.status).toBe(201);
                    expect(response.body).toHaveProperty('message', 'User Registered');
                    expect(response.body).toHaveProperty('data');
            })

            test('should not register a new user with duplicate email', async () => {
                const response = await request(app)
                    .post('/api/auth/register')
                    .send(testUser)
                
                expect(response.status).toBe(403);
                expect(response.body).toHaveProperty('success', false);
            })
        });

        describe('POST /api/auth/login', () => {
            test('should login an existing user', async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ email: testUser.email, password: testUser.password });
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('token');
            });

            test('should not login with incorrect password', async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ email: testUser.email, password: 'WrongPassword!' });
                expect(response.status).toBe(401);
                expect(response.body).toHaveProperty('success', false);
            });
        });
    }
)