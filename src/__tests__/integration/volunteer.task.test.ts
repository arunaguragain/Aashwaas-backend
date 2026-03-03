import request from 'supertest';

// some operations can be slow due to database interaction
jest.setTimeout(20000);

import mongoose from 'mongoose';
import app from '../../app';
import { UserModel } from '../../models/user.model';
import { DonationModel } from '../../models/donation.model';
import { TaskModel } from '../../models/task.model';
import { NgoModel } from '../../models/ngo.model';

describe('Volunteer Task Integration Tests', () => {
    const donorUser = {
        email: 'task.donor@example.com',
        password: 'Donor@1234',
        confirmPassword: 'Donor@1234',
        name: 'Task Donor',
    };

    const volunteerUser = {
        email: 'task.volunteer@example.com',
        password: 'Vol@12345',
        confirmPassword: 'Vol@12345',
        name: 'Task Volunteer',
        role: 'volunteer',
    } as any;

    let donorToken = '';
    let volunteerToken = '';
    let donorId = '';
    let volunteerId = '';
    let donationId = '';
    let ngoId = '';
    let baseTaskId = '';

    beforeAll(async () => {
        await UserModel.deleteMany({ email: donorUser.email });
        await UserModel.deleteMany({ email: volunteerUser.email });

        // register donor and volunteer
        await request(app).post('/api/auth/register').send(donorUser);
        await request(app).post('/api/auth/register').send(volunteerUser);

        const loginDonor = await request(app).post('/api/auth/login').send({ email: donorUser.email, password: donorUser.password });
        donorToken = loginDonor.body.token;
        const loginVolunteer = await request(app).post('/api/auth/login').send({ email: volunteerUser.email, password: volunteerUser.password });
        volunteerToken = loginVolunteer.body.token;

        const donorDoc = await UserModel.findOne({ email: donorUser.email });
        donorId = donorDoc?._id.toString() ?? '';
        const volunteerDoc = await UserModel.findOne({ email: volunteerUser.email });
        volunteerId = volunteerDoc?._id.toString() ?? '';

        // create a donation via API
        const donationRes = await request(app)
            .post('/api/donations')
            .set('Authorization', `Bearer ${donorToken}`)
            .send({
                itemName: 'Chair',
                category: 'Furniture',
                description: 'One chair',
                quantity: '1',
                condition: 'Good',
                pickupLocation: 'Test , city',
            });
        donationId = donationRes.body.data?._id ?? '';

        // create NGO directly to satisfy task data
        const ngo = await NgoModel.create({
            name: 'Test NGO',
            registrationNumber: `97854670`,
            contactPerson: 'Contact',
            phone: '9800000000',
            email: `ngo@example.com`,
            address: 'NGO Address',
            focusAreas: ['education'],
        });
        ngoId = ngo._id.toString();

        // create a base task assigned to volunteer
        const task = await TaskModel.create({
            title: 'Pickup Chair',
            donationId: new mongoose.Types.ObjectId(donationId),
            volunteerId: new mongoose.Types.ObjectId(volunteerId),
            ngoId: new mongoose.Types.ObjectId(ngoId),
            status: 'assigned',
        } as any);
        baseTaskId = task._id.toString();
    });

    afterAll(async () => {
        if (volunteerId) await TaskModel.deleteMany({ volunteerId });
        if (donorId) await DonationModel.deleteMany({ donorId });
        await UserModel.deleteMany({ email: donorUser.email });
        await UserModel.deleteMany({ email: volunteerUser.email });
        if (ngoId) await NgoModel.deleteMany({ _id: ngoId });
    });

    test('auth guard rejects unauthenticated access', async () => {
        const res = await request(app).get('/api/tasks');
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('success', false);
    });

    test('GET /api/tasks returns assigned tasks for volunteer', async () => {
        const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${volunteerToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('POST /api/tasks/:id/accept allows volunteer to accept assigned task', async () => {
        const res = await request(app).post(`/api/tasks/${baseTaskId}/accept`).set('Authorization', `Bearer ${volunteerToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('status', 'accepted');
    });

    test('POST /api/tasks/:id/complete allows volunteer to complete accepted task', async () => {
        const res = await request(app).post(`/api/tasks/${baseTaskId}/complete`).set('Authorization', `Bearer ${volunteerToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('status', 'completed');
    });

    test('DELETE /api/volunteer/tasks/:id/cancel allows volunteer to cancel an assigned task', async () => {
        // create a new assigned task to cancel
        const newTask = await TaskModel.create({
            title: 'Temp Task',
            donationId: new mongoose.Types.ObjectId(donationId),
            volunteerId: new mongoose.Types.ObjectId(volunteerId),
            ngoId: new mongoose.Types.ObjectId(ngoId),
            status: 'assigned',
        } as any);

        const res = await request(app).delete(`/api/tasks/${newTask._id.toString()}/cancel`).set('Authorization', `Bearer ${volunteerToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
    });
});
