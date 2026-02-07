import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { UserModel } from '../../models/user.model';
import { NgoModel } from '../../models/ngo.model';

describe('Admin NGO Integration Tests', () => { // Test Suite function
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
	let createdNgoId = '';
	const createdNgoEmails: string[] = [];
	const createdNgoRegistrations: string[] = [];

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
		// Clean up users and NGOs after tests
		await UserModel.deleteMany({
			email: { $in: [adminUser.email, donorUser.email] },
		});

		await NgoModel.deleteMany({
			$or: [
				{ email: { $in: createdNgoEmails } },
				{ registrationNumber: { $in: createdNgoRegistrations } },
			],
		});
	});

	describe('Authorization guard', () => { // Test Case function
		test(
			'should forbid non-admin users from accessing admin NGO routes', // Test name
			async () => { // Test function
				const response = await request(app)
					.get('/api/admin/ngos')
					.set('Authorization', `Bearer ${donorToken}`);

				expect(response.status).toBe(403);
				expect(response.body).toHaveProperty('success', false);
			}
		);
	});

	describe('POST /api/admin/ngos', () => { // Test Case function
		test(
			'should allow admin to create a new NGO', // Test name
			async () => { // Test function
				const email = 'created.ngo@example.com';
				const registrationNumber = 'REG-NGO-001';
				createdNgoEmails.push(email);
				createdNgoRegistrations.push(registrationNumber);

				const response = await request(app)
					.post('/api/admin/ngos')
					.set('Authorization', `Bearer ${adminToken}`)
					.send({
						name: 'Created NGO',
						registrationNumber,
						contactPerson: 'Contact Person',
						phone: '1234567890',
						email: 'ngo@gmail.com',
						address: 'Test Address 123',
						focusAreas: ['Education', 'Health'],
					});

				createdNgoId = response.body.data?._id ?? '';

				expect(response.status).toBe(201);
				expect(response.body).toHaveProperty('success', true);
				expect(response.body).toHaveProperty('data');
			}
		);
	});

	describe('GET /api/admin/ngos', () => { // Test Case function
		test(
			'should list all NGOs for admin', // Test name
			async () => { // Test function
				const response = await request(app)
					.get('/api/admin/ngos')
					.set('Authorization', `Bearer ${adminToken}`);

				expect(response.status).toBe(200);
				expect(response.body).toHaveProperty('success', true);
				expect(Array.isArray(response.body.data)).toBe(true);
			}
		);
	});

	describe('GET /api/admin/ngos/:id', () => { // Test Case function
		test(
			'should get an NGO by id for admin', // Test name
			async () => { // Test function
				const response = await request(app)
					.get(`/api/admin/ngos/${createdNgoId}`)
					.set('Authorization', `Bearer ${adminToken}`);

				expect(response.status).toBe(200);
				expect(response.body).toHaveProperty('success', true);
				expect(response.body).toHaveProperty('data');
			}
		);

		test(
			'should return 404 when requesting a non-existent NGO', // Test name
			async () => { // Test function
				const missingId = new mongoose.Types.ObjectId().toString();
				const response = await request(app)
					.get(`/api/admin/ngos/${missingId}`)
					.set('Authorization', `Bearer ${adminToken}`);

				expect(response.status).toBe(404);
				expect(response.body).toHaveProperty('success', false);
			}
		);
	});

	describe('PUT /api/admin/ngos/:id', () => { // Test Case function
		test(
			'should update an NGO as admin', // Test name
			async () => { // Test function
				const response = await request(app)
					.put(`/api/admin/ngos/${createdNgoId}`)
					.set('Authorization', `Bearer ${adminToken}`)
					.send({ contactPerson: 'Updated Contact' });

				expect(response.status).toBe(200);
				expect(response.body).toHaveProperty('success', true);
				expect(response.body.data).toHaveProperty('contactPerson', 'Updated Contact');
			}
		);
	});

	describe('DELETE /api/admin/ngos/:id', () => { // Test Case function
		test(
			'should delete an NGO as admin', // Test name
			async () => { // Test function
				const response = await request(app)
					.delete(`/api/admin/ngos/${createdNgoId}`)
					.set('Authorization', `Bearer ${adminToken}`);

				expect(response.status).toBe(200);
				expect(response.body).toHaveProperty('success', true);
			}
		);
	});
});
