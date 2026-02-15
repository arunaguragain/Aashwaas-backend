import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { UserModel } from '../../models/user.model';
import { WishlistModel } from '../../models/wishlist.model';

describe('Wishlist Integration Tests', () => {
    const donorUser = {
        email: 'wishlist.test@example.com',
        password: 'Wish@1234',
        confirmPassword: 'Wish@1234',
        name: 'Wishlist User',
    };

    let donorToken = '';
    let donorId = '';
    let baseWishlistId = '';

    const baseWishlist = {
        title: 'Warm Blankets',
        category: 'Clothes',
        plannedDate: '2026-03-01',
        notes: 'Need several warm blankets for winter drive',
    };

    beforeAll(async () => {
        await UserModel.deleteMany({ email: donorUser.email });

        await request(app).post('/api/auth/register').send(donorUser);
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({ email: donorUser.email, password: donorUser.password });

        donorToken = loginResponse.body.token;

        const donorDoc = await UserModel.findOne({ email: donorUser.email });
        donorId = donorDoc?._id.toString() ?? '';

        const createResponse = await request(app)
            .post('/api/wishlists')
            .set('Authorization', `Bearer ${donorToken}`)
            .send(baseWishlist);

        baseWishlistId = createResponse.body.data?._id ?? '';
        if (!baseWishlistId) throw new Error('Failed to create base wishlist for tests');
    });

    afterAll(async () => {
        if (donorId) {
            await WishlistModel.deleteMany({ donorId });
        }
        await UserModel.deleteMany({ email: donorUser.email });
    });

    describe('Auth guard', () => {
        test('should reject wishlist routes without auth', async () => {
            const response = await request(app).get('/api/wishlists');
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('success', false);
        });
    });

    describe('POST /api/wishlists', () => {
        test('should reject creation with invalid data', async () => {
            const response = await request(app)
                .post('/api/wishlists')
                .set('Authorization', `Bearer ${donorToken}`)
                .send({ title: 'A' });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('success', false);
        });

        test('should create a wishlist successfully', async () => {
            const response = await request(app)
                .post('/api/wishlists')
                .set('Authorization', `Bearer ${donorToken}`)
                .send({
                    title: 'Children Books',
                    category: 'Books',
                    plannedDate: '2026-04-01',
                    notes: 'A set of illustrated books for children',
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
        });
    });

    describe('GET /api/wishlists', () => {
        test('should get all wishlists', async () => {
            const response = await request(app)
                .get('/api/wishlists')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('GET /api/wishlists/my', () => {
        test('should get wishlists for authenticated user', async () => {
            const response = await request(app)
                .get('/api/wishlists/my')
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('GET /api/wishlists/donor/:donorId', () => {
        test('should get wishlists by donor id', async () => {
            const response = await request(app)
                .get(`/api/wishlists/donor/${donorId}`)
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('GET /api/wishlists/:id', () => {
        test('should get a wishlist by id', async () => {
            const response = await request(app)
                .get(`/api/wishlists/${baseWishlistId}`)
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
        });

        test('should return 404 for a non-existent wishlist', async () => {
            const missingId = new mongoose.Types.ObjectId().toString();
            const response = await request(app)
                .get(`/api/wishlists/${missingId}`)
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('success', false);
        });
    });

    describe('PUT /api/wishlists/:id', () => {
        test('should update a wishlist', async () => {
            const response = await request(app)
                .put(`/api/wishlists/${baseWishlistId}`)
                .set('Authorization', `Bearer ${donorToken}`)
                .send({ notes: 'Updated notes for wishlist' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('notes', 'Updated notes for wishlist');
        });
    });

    describe('DELETE /api/wishlists/:id', () => {
        test('should delete a wishlist', async () => {
            const createResponse = await request(app)
                .post('/api/wishlists')
                .set('Authorization', `Bearer ${donorToken}`)
                .send({
                    title: 'Single Item To Delete',
                    category: 'Other',
                    plannedDate: '2026-05-01',
                    notes: 'Temporary',
                });

            const createdId = createResponse.body.data?._id;

            const response = await request(app)
                .delete(`/api/wishlists/${createdId}`)
                .set('Authorization', `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });
    });
});
