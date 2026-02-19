import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { UserModel } from '../../models/user.model';
import { DonationModel } from '../../models/donation.model';


describe('Admin Donation Integration Tests', () => {
    const adminUser = {
        email: 'admin@example.com',
        password: 'Admin@1234',
        confirmPassword: 'Admin@1234',
        name: 'Admin Donation',
        role: 'admin',
    };
    const donorUser = {
        email: 'donor@example.com',
        password: 'Donor@1234',
        confirmPassword: 'Donor@1234',
        name: 'Donor Donation',
        role: 'donor',
    };
    let adminToken = '';
    let donorToken = '';
    let donationId = '';
    beforeAll(async () => {
        await UserModel.deleteMany({ email: { $in: [adminUser.email, donorUser.email] } });
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
        // Create a donation as donor
        const donationRes = await request(app)
            .post('/api/donations')
            .set('Authorization', `Bearer ${donorToken}`)
            .send({
                itemName: 'Test Item',
                category: 'Clothes',
                description: 'test donation',
                quantity: '1',
                condition: 'Good',
                pickupLocation: 'Test Street',
            });
        donationId = donationRes.body.data?._id ?? '';
    });
    afterAll(async () => {
        try {
            console.log('TEST-DEBUG: running cleanup for test-created documents only');
            await DonationModel.deleteOne({ _id: donationId });
            await UserModel.deleteMany({ email: { $in: [adminUser.email, donorUser.email] } });
        } catch (err) {
            console.error('Cleanup failed:', err);
        }
    });
    test('should list all donations for admin', async () => {
        const res = await request(app)
            .get('/api/admin/donations')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
    test('should get donation by id for admin', async () => {
        const res = await request(app)
            .get(`/api/admin/donations/${donationId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
    });
    test('should approve a donation as admin', async () => {
        const res = await request(app)
            .put(`/api/admin/donations/${donationId}/approve`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('status', 'approved');
    });
    test('should delete a donation as admin', async () => {
        const res = await request(app)
            .delete(`/api/admin/donations/${donationId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
    });
});
