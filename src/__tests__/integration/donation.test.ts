import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { UserModel } from '../../models/user.model';
import { DonationModel } from '../../models/donation.model';

describe('Donation Integration Tests', () => { // Test Suite function
    const donorUser = {
        email: 'donor.test@example.com',
        password: 'Donor@1234',
        confirmPassword: 'Donor@1234',
        name: 'Donor User',
    };

    let donorToken = '';
    let donorId = '';
    let baseDonationId = '';

    const baseDonation = {
        itemName: 'Winter Jacket',
        category: 'Clothes',
        description: 'Lightly used winter jacket',
        quantity: '2',
        condition: 'Good',
        pickupLocation: 'Test Street 123',
    };

    beforeAll(async () => {
        // Ensure the donor user exists before tests
        await UserModel.deleteMany({ email: donorUser.email });

        await request(app).post('/api/auth/register').send(donorUser);
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({ email: donorUser.email, password: donorUser.password });

        donorToken = loginResponse.body.token;

        const donorDoc = await UserModel.findOne({ email: donorUser.email });
        donorId = donorDoc?._id.toString() ?? '';

        const donationResponse = await request(app)
            .post('/api/donations')
            .set('Authorization', `Bearer ${donorToken}`)
            .send(baseDonation);

        baseDonationId = donationResponse.body.data?._id ?? '';
        if (!baseDonationId) {
            throw new Error('Failed to create base donation for tests');
        }
    });

    afterAll(async () => {
        // Clean up donations and user after tests
        if (donorId) {
            await DonationModel.deleteMany({ donorId });
        }
        await UserModel.deleteMany({ email: donorUser.email });
    });

    describe('Auth guard', () => { // Test Case function
        test(
            'should reject donation routes without auth', // Test name
            async () => { // Test function
                const response = await request(app).get('/api/donations');
                expect(response.status).toBe(401);
                expect(response.body).toHaveProperty('success', false);
            }
        );
    });

    describe('POST /api/donations', () => { // Test Case function
        test(
            'should reject donation creation with invalid data', // Test name
            async () => { // Test function
                const response = await request(app)
                    .post('/api/donations')
                    .set('Authorization', `Bearer ${donorToken}`)
                    .send({ itemName: 'A' });

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('success', false);
            }
        );

        test(
            'should create a donation successfully', // Test name
            async () => { // Test function
                const response = await request(app)
                    .post('/api/donations')
                    .set('Authorization', `Bearer ${donorToken}`)
                    .send({
                        itemName: 'Laptop',
                        category: 'Electronics',
                        description: 'Used laptop in good condition',
                        quantity: '1',
                        condition: 'Good',
                        pickupLocation: 'Test Street 123',
                    });

                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('data');
            }
        );
    });

    describe('GET /api/donations', () => { // Test Case function
        test(
            'should get all donations', // Test name
            async () => { // Test function
                const response = await request(app)
                    .get('/api/donations')
                    .set('Authorization', `Bearer ${donorToken}`);

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
                expect(Array.isArray(response.body.data)).toBe(true);
            }
        );
    });

    describe('GET /api/donations/my', () => { // Test Case function
        test(
            'should get donations for the authenticated user', // Test name
            async () => { // Test function
                const response = await request(app)
                    .get('/api/donations/my')
                    .set('Authorization', `Bearer ${donorToken}`);

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
                expect(Array.isArray(response.body.data)).toBe(true);
            }
        );
    });

    describe('GET /api/donations/donor/:donorId', () => { // Test Case function
        test(
            'should get donations by donor id', // Test name
            async () => { // Test function
                const response = await request(app)
                    .get(`/api/donations/donor/${donorId}`)
                    .set('Authorization', `Bearer ${donorToken}`);

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
                expect(Array.isArray(response.body.data)).toBe(true);
            }
        );
    });

    describe('GET /api/donations/:id', () => { // Test Case function
        test(
            'should get a donation by id', // Test name
            async () => { // Test function
                const response = await request(app)
                    .get(`/api/donations/${baseDonationId}`)
                    .set('Authorization', `Bearer ${donorToken}`);

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('data');
            }
        );

        test(
            'should return 404 for a non-existen donation', // Test name
            async () => { // Test function
                const missingId = new mongoose.Types.ObjectId().toString();
                const response = await request(app)
                    .get(`/api/donations/${missingId}`)
                    .set('Authorization', `Bearer ${donorToken}`);

                expect(response.status).toBe(404);
                expect(response.body).toHaveProperty('success', false);
            }
        );
    });

    describe('PUT /api/donations/:id', () => { // Test Case function
        test(
            'should update a donation', // Test name
            async () => { // Test function
                const response = await request(app)
                    .put(`/api/donations/${baseDonationId}`)
                    .set('Authorization', `Bearer ${donorToken}`)
                    .send({ description: 'Updated description' });

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
                expect(response.body.data).toHaveProperty('description', 'Updated description');
            }
        );
    });

    describe('DELETE /api/donations/:id', () => { // Test Case function
        test(
            'should delete a donation', // Test name
            async () => { // Test function
                const createResponse = await request(app)
                    .post('/api/donations')
                    .set('Authorization', `Bearer ${donorToken}`)
                    .send({
                        itemName: 'Table',
                        category: 'Furniture',
                        description: 'Small table',
                        quantity: '1',
                        condition: 'Fair',
                        pickupLocation: 'Test Street 123',
                    });

                const createdId = createResponse.body.data?._id;

                const response = await request(app)
                    .delete(`/api/donations/${createdId}`)
                    .set('Authorization', `Bearer ${donorToken}`);

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
            }
        );
    });

    describe('POST /api/donations/upload-photo', () => { // Test Case function
        test(
            'should reject photo upload when no file is provided', // Test name
            async () => { // Test function
                const response = await request(app)
                    .post('/api/donations/upload-photo')
                    .set('Authorization', `Bearer ${donorToken}`);

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('success', false);
            }
        );
    });
});
