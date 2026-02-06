import request from 'supertest';
import app from '../../app';
import { UserModel } from '../../models/user.model';

describe(
    'Authentication Integration Tests',  // Test Suite/Group name
    () => { // Test Suite function
        const testUser = {
            'email': 'test@example.com',
            'password': 'Test@1234',
            'username': 'testuser',
            'firstName': 'Test',
            'lastName': 'User'
        }
        beforeAll(async () => {
            // Ensure the test user does not exist before tests
            await UserModel.deleteMany({ email: testUser.email });
        });
        afterAll(async () => {
            // Clean up the test user after tests
            await UserModel.deleteMany({ email: testUser.email });
        });

        describe(
            'POST /api/auth/register', // Test Case name
            () => { // Test Case function
                test(
                    'should register a new user successfully', // Test name
                    async () => { // Test function
                        const response = await request(app)
                            .post('/api/auth/register')
                            .send(testUser)
                            
                        
                        // Validate response structure
                        expect(response.status).toBe(201);
                        expect(response.body).toHaveProperty('message', 'User registered successfully');
                        expect(response.body).toHaveProperty('data');
                    }
                )
            }
        )
    }
)