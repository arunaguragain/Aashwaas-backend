import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { UserModel } from '../../models/user.model';

describe('Admin User Integration Tests', () => { // Test Suite function
    const adminUser = {
        email: 'admin.test@example.com',
        password: 'Admin@1234',
        confirmPassword: 'Admin@1234',
        name: 'Admin User',
        role: 'admin',
    };

    const donorUser = {
        email: 'donor.test@example.com',
        password: 'Donor@1234',
        confirmPassword: 'Donor@1234',
        name: 'Donor User',
        role: 'donor',
    };

    let adminToken = '';
    let donorToken = '';
    let createdUserId = '';
    const createdEmails: string[] = [];

    beforeAll(async () => {
        // Ensure admin and donor users exist before tests
        await UserModel.deleteMany({
            email: { $in: [adminUser.email, donorUser.email] },
        });

        await request(app).post('/api/auth/register').send(adminUser);
        await request(app).post('/api/auth/register').send(donorUser);

        const adminLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: adminUser.email, password: adminUser.password });

        const donorLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: donorUser.email, password: donorUser.password });

        adminToken = adminLogin.body.token;
        donorToken = donorLogin.body.token;
    });

    afterAll(async () => {
        // Clean up admin, donor, and created users after tests
        await UserModel.deleteMany({
            email: { $in: [adminUser.email, donorUser.email, ...createdEmails] },
        });
    });

    describe('Authorization guard', () => { // Test Case function
        test(
            'should forbid non-admin users from accessing admin routes', // Test name
            async () => { // Test function
                const response = await request(app)
                    .get('/api/admin/users')
                    .set('Authorization', `Bearer ${donorToken}`);

                expect(response.status).toBe(403);
                expect(response.body).toHaveProperty('success', false);
            }
        );
    });

    describe('POST /api/admin/users', () => { // Test Case function
        test(
            'should allow admin to create a new user', // Test name
            async () => { // Test function
                const email = 'created.user@example.com';
                createdEmails.push(email);

                const response = await request(app)
                    .post('/api/admin/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        email,
                        password: 'User@1234',
                        confirmPassword: 'User@1234',
                        name: 'Created User',
                        role: 'donor',
                    });

                createdUserId = response.body.data?._id ?? '';

                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('data');
            }
        );
    });

    describe('GET /api/admin/users', () => { // Test Case function
        test(
            'should list all users for admin', // Test name
            async () => { // Test function
                const response = await request(app)
                    .get('/api/admin/users')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
                expect(Array.isArray(response.body.data)).toBe(true);
            }
        );
    });

    describe('GET /api/admin/users/:id', () => { // Test Case function
        test(
            'should get a user by id for admin', // Test name
            async () => { // Test function
                const response = await request(app)
                    .get(`/api/admin/users/${createdUserId}`)
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('data');
            }
        );

        test(
            'should return 404 when requesting a non-existent user', // Test name
            async () => { // Test function
                const missingId = new mongoose.Types.ObjectId().toString();
                const response = await request(app)
                    .get(`/api/admin/users/${missingId}`)
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(404);
                expect(response.body).toHaveProperty('success', false);
            }
        );
    });

    describe('PUT /api/admin/users/:id', () => { // Test Case function
        test(
            'should update a user as admin', // Test name
            async () => { // Test function
                const response = await request(app)
                    .put(`/api/admin/users/${createdUserId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: 'Updated User' });

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
                expect(response.body.data).toHaveProperty('name', 'Updated User');
            }
        );
    });

    describe('DELETE /api/admin/users/:id', () => { // Test Case function
        test(
            'should delete a user as admin', // Test name
            async () => { // Test function
                const response = await request(app)
                    .delete(`/api/admin/users/${createdUserId}`)
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
            }
        );
    });
});
