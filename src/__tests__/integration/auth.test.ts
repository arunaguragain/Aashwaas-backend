import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import { UserModel } from '../../models/user.model';
import { JWT_SECRET } from '../../config';

describe('Authentication Integration Tests', () => { // Test Suite function
        const testUser = {
            email: 'test@example.com',
            password: 'Test@1234',
            confirmPassword: 'Test@1234',
            name: 'Test User',
        };

        const resetUser = {
            email: 'reset.test@example.com',
            password: 'Reset@1234',
            confirmPassword: 'Reset@1234',
            name: 'Reset User',
        };

        beforeAll(async () => {
            // Ensure the test user does not exist before tests
            await UserModel.deleteMany({ email: { $in: [testUser.email, resetUser.email] } });
        });

        afterAll(async () => {
            // Clean up the test user after tests
            await UserModel.deleteMany({ email: { $in: [testUser.email, resetUser.email] } });
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

            test('should not register a new user with invalid email', async () => {
                const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: 'invalid-email',
                        password: 'Test@1234',
                        confirmPassword: 'Test@1234',
                        name: 'Invalid Email User',
                    });

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('success', false);
            })

            test('should not register a new user without name', async () => {
                const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: 'missingname@example.com',
                        password: 'Test@1234',
                        confirmPassword: 'Test@1234',
                    });

                expect(response.status).toBe(400);
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

        describe('POST /api/auth/reset-password/:token', () => {
            test('should not reset password with invalid token', async () => {
                const response = await request(app)
                    .post('/api/auth/reset-password/invalid-token')
                    .send({ newPassword: 'NewPass@123' });

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('success', false);
            });

            test('should reset password with valid token', async () => {
                await request(app).post('/api/auth/register').send(resetUser);
                const resetUserDoc = await UserModel.findOne({ email: resetUser.email });
                const token = jwt.sign({ id: resetUserDoc?._id }, JWT_SECRET, { expiresIn: '1h' });

                const response = await request(app)
                    .post(`/api/auth/reset-password/${token}`)
                    .send({ newPassword: 'NewPass@123' });

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
            });

            test('should login with new password after reset', async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ email: resetUser.email, password: 'NewPass@123' });

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('token');
            });
        });
    }
)