import { DonationController } from '../../../controllers/donation.controller';
import { DonationService } from '../../../services/donation.service';

jest.mock('../../../services/donation.service');

describe('DonationController', () => {
  let controller: DonationController;
  let mockDonationService: jest.Mocked<DonationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new DonationController();
    const MockedDonationService = DonationService as unknown as jest.MockedClass<typeof DonationService>;
    mockDonationService = MockedDonationService.mock.instances[0] as jest.Mocked<DonationService>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function mockRes() {
    return { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
  }

  test('createDonation returns 201 on success', async () => {
    const newDonation = { _id: 'don1', itemName: 'Shirt' } as any;
    jest.spyOn(DonationService.prototype, 'createDonation').mockResolvedValueOnce(newDonation);

    const req: any = {
      body: { itemName: 'Shirt', category: 'Clothes', quantity: '1', condition: 'Good', pickupLocation: 'Somewhere' },
      user: { _id: 'user1' }
    };
    const res = mockRes();

    await controller.createDonation(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Donation created successfully', data: newDonation });
  });

  test('createDonation returns 400 on validation error', async () => {
    const req: any = { body: { itemName: 'S' }, user: { _id: 'user1' } }; // invalid: itemName too short and missing required fields
    const res = mockRes();

    await controller.createDonation(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('createDonation returns 401 when no user', async () => {
    const req: any = { body: { itemName: 'Shirt', category: 'Clothes', quantity: '1', condition: 'Good', pickupLocation: 'Somewhere' } };
    const res = mockRes();

    await controller.createDonation(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not authenticated' });
  });

  test('getAllDonations returns 200 with data', async () => {
    const donations = [{ _id: 'd1' }];
    const pagination = { page: 1, size: 10, totalItems: 1, totalPages: 1 };
    jest.spyOn(DonationService.prototype, 'getAllDonations').mockResolvedValueOnce({ donations, pagination } as any);

    const req: any = { query: {} };
    const res = mockRes();

    await controller.getAllDonations(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: donations, pagination, message: 'All donations retrieved' });
  });

  test('getAllDonations parses page/size query strings', async () => {
    const donations = [{ _id: 'd2' }];
    const pagination = { page: 2, size: 5, totalItems: 1, totalPages: 1 };
    jest.spyOn(DonationService.prototype, 'getAllDonations').mockResolvedValueOnce({ donations, pagination } as any);

    const req: any = { query: { page: '2', size: '5' } };
    const res = mockRes();
    await controller.getAllDonations(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: donations, pagination, message: 'All donations retrieved' });
  });

  test('getAllDonations propagates custom message error', async () => {
    jest.spyOn(DonationService.prototype, 'getAllDonations').mockRejectedValueOnce({ message: 'no data' });
    const req: any = { query: {} };
    const res = mockRes();
    await controller.getAllDonations(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'no data' });
  });

  test('getAllDonations catches generic error', async () => {
    jest.spyOn(DonationService.prototype, 'getAllDonations').mockRejectedValueOnce({});
    const req: any = { query: {} };
    const res = mockRes();
    await controller.getAllDonations(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getDonationById returns 200 with donation', async () => {
    const donation = { _id: 'd1' } as any;
    jest.spyOn(DonationService.prototype, 'getDonationById').mockResolvedValueOnce(donation);

    const req: any = { params: { id: 'd1' } };
    const res = mockRes();

    await controller.getDonationById(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: donation, message: 'Donation retrieved successfully' });
  });

  test('getDonationById catches error', async () => {
    jest.spyOn(DonationService.prototype, 'getDonationById').mockRejectedValueOnce(new Error('oops'));
    const req: any = { params: { id: 'd1' } };
    const res = mockRes();
    await controller.getDonationById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getDonationById propagates service error status', async () => {
    const err: any = new Error('Boom');
    err.statusCode = 418;
    jest.spyOn(DonationService.prototype, 'getDonationById').mockRejectedValueOnce(err);
    const req: any = { params: { id: 'd1' } };
    const res = mockRes();
    await controller.getDonationById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(418);
  });

  // generic error branch where message is undefined
  test('getDonationById falls back to default message when error has no message', async () => {
    jest.spyOn(DonationService.prototype, 'getDonationById').mockRejectedValueOnce({});
    const req: any = { params: { id: 'd1' } };
    const res = mockRes();
    await controller.getDonationById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
  });

  test('createDonation uses file from req.files.image and passes media to service', async () => {
    const newDonation = { _id: 'don1', itemName: 'Shirt' } as any;
    const spy = jest.spyOn(DonationService.prototype, 'createDonation').mockResolvedValueOnce(newDonation);

    const req: any = {
      body: { itemName: 'Shirt', category: 'Clothes', quantity: '1', condition: 'Good', pickupLocation: 'Somewhere' },
      user: { _id: 'user1' },
      files: { image: [{ filename: 'uploaded1.png' }] }
    };
    const res = mockRes();

    await controller.createDonation(req, res, jest.fn());

    expect(spy).toHaveBeenCalled();
    const passedData = spy.mock.calls[0][0] as any;
    expect(passedData.media).toBe('uploaded1.png');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('createDonation returns service error status when service throws', async () => {
    const err: any = new Error('Boom');
    err.statusCode = 418;
    jest.spyOn(DonationService.prototype, 'createDonation').mockRejectedValueOnce(err);

    const req: any = {
      body: { itemName: 'Shirt', category: 'Clothes', quantity: '1', condition: 'Good', pickupLocation: 'Somewhere' },
      user: { _id: 'user1' }
    };
    const res = mockRes();

    await controller.createDonation(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Boom' });
  });

  test('createDonation propagates message-only error', async () => {
    jest.spyOn(DonationService.prototype, 'createDonation').mockRejectedValueOnce({ message: 'failed' });
    const req: any = {
      body: { itemName: 'Shirt', category: 'Clothes', quantity: '1', condition: 'Good', pickupLocation: 'Somewhere' },
      user: { _id: 'user1' }
    };
    const res = mockRes();
    await controller.createDonation(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'failed' });
  });

  test('createDonation catches generic errors', async () => {
    jest.spyOn(DonationService.prototype, 'createDonation').mockRejectedValueOnce({});
    const req: any = {
      body: { itemName: 'Shirt', category: 'Clothes', quantity: '1', condition: 'Good', pickupLocation: 'Somewhere' },
      user: { _id: 'user1' }
    };
    const res = mockRes();
    await controller.createDonation(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('updateDonation uses donationPhoto file when present', async () => {
    const updated = { _id: 'd1', itemName: 'Shirt' } as any;
    const spy = jest.spyOn(DonationService.prototype, 'updateDonation').mockResolvedValueOnce(updated);

    const req: any = { params: { id: 'd1' }, body: { itemName: 'Shirt' }, files: { donationPhoto: [{ filename: 'donphoto.jpg' }] } };
    const res = mockRes();

    await controller.updateDonation(req, res, jest.fn());

    expect(spy).toHaveBeenCalled();
    const passedUpdate = spy.mock.calls[0][1] as any;
    expect(passedUpdate.media).toBe('donphoto.jpg');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('updateDonation propagates message-only error', async () => {
    jest.spyOn(DonationService.prototype, 'updateDonation').mockRejectedValueOnce({ message: 'oops' });
    const req: any = { params: { id: 'd1' }, body: { itemName: 'Shirt' } };
    const res = mockRes();
    await controller.updateDonation(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'oops' });
  });

  test('getMyDonations returns 401 when unauthenticated', async () => {
    const req: any = { query: {} };
    const res = mockRes();

    await controller.getMyDonations(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not authenticated' });
  });

  // user object exists but has no _id (falsy donorId branch)
  test('getMyDonations returns 401 when user has no id', async () => {
    const req: any = { query: {}, user: {} };
    const res = mockRes();

    await controller.getMyDonations(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not authenticated' });
  });

  test('getDonationsByDonorId handles error', async () => {
    jest.spyOn(DonationService.prototype, 'getDonationsByDonorId').mockRejectedValueOnce(new Error('fail'));
    const req: any = { params: { donorId: 'd1' }, query: {} };
    const res = mockRes();
    await controller.getDonationsByDonorId(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getDonationsByDonorId propagates service error status', async () => {
    const err: any = new Error('oops');
    err.statusCode = 413;
    jest.spyOn(DonationService.prototype, 'getDonationsByDonorId').mockRejectedValueOnce(err);
    const req: any = { params: { donorId: 'd1' }, query: {} };
    const res = mockRes();
    await controller.getDonationsByDonorId(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(413);
  });

  // generic error branch with no message
  test('getDonationsByDonorId falls back to default message when error has no message', async () => {
    jest.spyOn(DonationService.prototype, 'getDonationsByDonorId').mockRejectedValueOnce({});
    const req: any = { params: { donorId: 'd1' }, query: {} };
    const res = mockRes();
    await controller.getDonationsByDonorId(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
  });

  // exercise the happy path to hit the branch where donations exist
  test('getDonationsByDonorId returns 200 with data', async () => {
    const donations = [{ _id: 'd1' }];
    const pagination = { page: 1, size: 5, totalItems: 1, totalPages: 1 };
    jest.spyOn(DonationService.prototype, 'getDonationsByDonorId').mockResolvedValueOnce({ donations, pagination } as any);
    const req: any = { params: { donorId: 'd1' }, query: { page: 1, size: 5 } };
    const res = mockRes();
    await controller.getDonationsByDonorId(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: donations, pagination, message: 'Donor donations retrieved' });
  });

  // my donations authenticated success branch
  test('getMyDonations returns 200 with data when authenticated', async () => {
    const donations = [{ _id: 'd2' }];
    const pagination = { page: 2, size: 5, totalItems: 1, totalPages: 1 };
    jest.spyOn(DonationService.prototype, 'getDonationsByDonorId').mockResolvedValueOnce({ donations, pagination } as any);
    const req: any = { user: { _id: 'user1' }, query: { page: 2, size: 5 } };
    const res = mockRes();
    await controller.getMyDonations(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: donations, pagination, message: 'Your donations retrieved' });
  });

  // deleteDonation branches
  test('deleteDonation returns 404 when not found', async () => {
    jest.spyOn(DonationService.prototype, 'deleteDonation').mockResolvedValueOnce(false);
    const req: any = { params: { id: 'doesntExist' } };
    const res = mockRes();
    await controller.deleteDonation(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Donation not found' });
  });

  test('deleteDonation returns 200 when deleted', async () => {
    jest.spyOn(DonationService.prototype, 'deleteDonation').mockResolvedValueOnce(true);
    const req: any = { params: { id: 'd1' } };
    const res = mockRes();
    await controller.deleteDonation(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Donation deleted successfully' });
  });

  // uploadPhoto branches
  test('uploadPhoto returns 400 when no file is attached', async () => {
    const req: any = {};
    const res = mockRes();
    await controller.uploadPhoto(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'No file uploaded' });
  });

  test('uploadPhoto returns 200 when file is provided', async () => {
    const req: any = { file: { filename: 'pic.png' } };
    const res = mockRes();
    await controller.uploadPhoto(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Photo uploaded successfully', data: { filename: 'pic.png' } });
  });

  // updateDonation validation failure
  test('updateDonation returns 400 when validation fails', async () => {
    const req: any = { params: { id: 'd1' }, body: { itemName: '' } };
    const res = mockRes();
    await controller.updateDonation(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  // updateDonation service error
  test('updateDonation propagates service error', async () => {
    const err: any = new Error('service boom');
    err.statusCode = 499;
    jest.spyOn(DonationService.prototype, 'updateDonation').mockRejectedValueOnce(err);
    const req: any = { params: { id: 'd1' }, body: { itemName: 'Shirt' } };
    const res = mockRes();
    await controller.updateDonation(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(499);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'service boom' });
  });

  // createDonation file priority order: req.file should win
  test('createDonation prefers req.file over files object', async () => {
    const newDonation = { _id: 'don2' } as any;
    const spy2 = jest.spyOn(DonationService.prototype, 'createDonation').mockResolvedValueOnce(newDonation);
    const req: any = {
      body: { itemName: 'Shirt', category: 'Clothes', quantity: '1', condition: 'Good', pickupLocation: 'Somewhere' },
      user: { _id: 'user1' },
      file: { filename: 'reqfile.png' },
      files: { image: [{ filename: 'image.png' }] }
    };
    const res = mockRes();
    await controller.createDonation(req, res, jest.fn());
    expect(spy2.mock.calls[0][0].media).toBe('reqfile.png');
  });

  // getAllDonations branch with page/size parameters
  test('getAllDonations passes page and size query values', async () => {
    const donations: any[] = [];
    const pagination = { page: 3, size: 2, totalItems: 0, totalPages: 0 };
    jest.spyOn(DonationService.prototype, 'getAllDonations').mockResolvedValueOnce({ donations, pagination } as any);
    const req: any = { query: { page: 3, size: 2 } };
    const res = mockRes();
    await controller.getAllDonations(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('uploadPhoto error catch via thrown file getter', async () => {
    const req: any = { get file() { throw new Error('boom'); } };
    const res = mockRes();
    await controller.uploadPhoto(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('uploadPhoto catches error object without message and uses fallback', async () => {
    const req: any = { get file() { throw {}; } };
    const res = mockRes();
    await controller.uploadPhoto(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
  });

  // ensure statusCode nullish fallback is exercised when error provides statusCode
  test('uploadPhoto propagates statusCode when thrown error has it', async () => {
    const req: any = { get file() { throw Object.assign(new Error('fail'), { statusCode: 418 }); } };
    const res = mockRes();
    await controller.uploadPhoto(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(418);
  });

  test('getMyDonations catches generic error', async () => {
    jest.spyOn(DonationService.prototype, 'getDonationsByDonorId').mockRejectedValueOnce({});
    const req: any = { query: {}, user: { _id: 'user1' } };
    const res = mockRes();
    await controller.getMyDonations(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('updateDonation catches generic service error', async () => {
    jest.spyOn(DonationService.prototype, 'updateDonation').mockRejectedValueOnce({});
    const req: any = { params: { id: 'd1' }, body: { itemName: 'Shirt' } };
    const res = mockRes();
    await controller.updateDonation(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('deleteDonation catches generic service error', async () => {
    jest.spyOn(DonationService.prototype, 'deleteDonation').mockRejectedValueOnce({});
    const req: any = { params: { id: 'd1' } };
    const res = mockRes();
    await controller.deleteDonation(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getMyDonations returns 200 when authenticated', async () => {
    const donations = [{ _id: 'd1' }];
    const pagination = { page: 1, size: 10, totalItems: 1, totalPages: 1 };
    jest.spyOn(DonationService.prototype, 'getDonationsByDonorId').mockResolvedValueOnce({ donations, pagination } as any);

    const req: any = { query: {}, user: { _id: 'user1' } };
    const res = mockRes();

    await controller.getMyDonations(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: donations, pagination, message: 'Your donations retrieved' });
  });

  test('updateDonation returns 400 on validation error', async () => {
    const req: any = { params: { id: 'd1' }, body: { quantity: '' } }; // invalid quantity
    const res = mockRes();

    await controller.updateDonation(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('updateDonation catches generic error', async () => {
    jest.spyOn(DonationService.prototype, 'updateDonation').mockRejectedValueOnce(new Error('err'));
    const req: any = { params: { id: 'd1' }, body: { itemName: 'Shirt' } };
    const res = mockRes();
    await controller.updateDonation(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('updateDonation returns 200 on success', async () => {
    const updated = { _id: 'd1', itemName: 'Shirt' } as any;
    jest.spyOn(DonationService.prototype, 'updateDonation').mockResolvedValueOnce(updated);

    const req: any = { params: { id: 'd1' }, body: { itemName: 'Shirt' } };
    const res = mockRes();

    await controller.updateDonation(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Donation updated successfully', data: updated });
  });

  test('deleteDonation returns 200 on success and 404 when not deleted', async () => {
    jest.spyOn(DonationService.prototype, 'deleteDonation').mockResolvedValueOnce(true as any);
    const req1: any = { params: { id: 'd1' } };
    const res1 = mockRes();
    await controller.deleteDonation(req1, res1, jest.fn());
    expect(res1.status).toHaveBeenCalledWith(200);
    expect(res1.json).toHaveBeenCalledWith({ success: true, message: 'Donation deleted successfully' });

    jest.spyOn(DonationService.prototype, 'deleteDonation').mockResolvedValueOnce(false as any);
    const req2: any = { params: { id: 'd2' } };
    const res2 = mockRes();
    await controller.deleteDonation(req2, res2, jest.fn());
    expect(res2.status).toHaveBeenCalledWith(404);
    expect(res2.json).toHaveBeenCalledWith({ success: false, message: 'Donation not found' });
  });

  test('deleteDonation catches generic errors', async () => {
    jest.spyOn(DonationService.prototype, 'deleteDonation').mockRejectedValueOnce(new Error('oops'));
    const req: any = { params: { id: 'd1' } };
    const res = mockRes();
    await controller.deleteDonation(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });
  test('deleteDonation falls back to default message when error has no message', async () => {
    jest.spyOn(DonationService.prototype, 'deleteDonation').mockRejectedValueOnce({});
    const req: any = { params: { id: 'd1' } };
    const res = mockRes();
    await controller.deleteDonation(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
  });
  test('uploadPhoto returns 400 when no file and 200 with filename', async () => {
    const req1: any = {};
    const res1 = mockRes();
    await controller.uploadPhoto(req1, res1, jest.fn());
    expect(res1.status).toHaveBeenCalledWith(400);
    expect(res1.json).toHaveBeenCalledWith({ success: false, message: 'No file uploaded' });

    const req2: any = { file: { filename: 'pic.jpg' } };
    const res2 = mockRes();
    await controller.uploadPhoto(req2, res2, jest.fn());
    expect(res2.status).toHaveBeenCalledWith(200);
    expect(res2.json).toHaveBeenCalledWith({ success: true, message: 'Photo uploaded successfully', data: { filename: 'pic.jpg' } });
  });

  // extra tests covering error propagation
  test('createDonation handles req.file and donationPhoto file priorities', async () => {
    const newDonation = { _id: 'don1' } as any;
    const spy = jest.spyOn(DonationService.prototype, 'createDonation').mockResolvedValueOnce(newDonation);

    const reqA: any = {
      body: { itemName: 'Shirt', category: 'Clothes', quantity: '1', condition: 'Good', pickupLocation: 'Somewhere' },
      user: { _id: 'user1' },
      file: { filename: 'direct.png' },
      files: { image: [{ filename: 'shouldnotuse.png' }], donationPhoto: [{ filename: 'alsonot.png' }] }
    };
    const resA = mockRes();
    await controller.createDonation(reqA, resA, jest.fn());
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].media).toBe('direct.png');
    expect(resA.status).toHaveBeenCalledWith(201);

    // verify donationPhoto case when req.file undefined and image absent
    jest.spyOn(DonationService.prototype, 'createDonation').mockResolvedValueOnce(newDonation);
    const reqB: any = {
      body: { itemName: 'Shirt', category: 'Clothes', quantity: '1', condition: 'Good', pickupLocation: 'Somewhere' },
      user: { _id: 'user1' },
      files: { donationPhoto: [{ filename: 'donphoto-create.jpg' }] }
    };
    const resB = mockRes();
    await controller.createDonation(reqB, resB, jest.fn());
    expect(resB.status).toHaveBeenCalledWith(201);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[1][0].media).toBe('donphoto-create.jpg');
  });

  test('updateDonation handles req.file and files.image branches', async () => {
    const updated = { _id: 'd1' } as any;
    const spy = jest.spyOn(DonationService.prototype, 'updateDonation').mockResolvedValue(updated);

    const reqA: any = { params: { id: 'd1' }, body: { itemName: 'Shirt' }, file: { filename: 'direct-up.png' } };
    const resA = mockRes();
    await controller.updateDonation(reqA, resA, jest.fn());
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][1].media).toBe('direct-up.png');
    expect(resA.status).toHaveBeenCalledWith(200);

    jest.spyOn(DonationService.prototype, 'updateDonation').mockResolvedValue(updated);
    const reqB: any = { params: { id: 'd1' }, body: { itemName: 'Shirt' }, files: { image: [{ filename: 'img-up.png' }] } };
    const resB = mockRes();
    await controller.updateDonation(reqB, resB, jest.fn());
    expect(spy.mock.calls[1][1].media).toBe('img-up.png');

    //supply only donationPhoto to hit third nullish branch
    jest.spyOn(DonationService.prototype, 'updateDonation').mockResolvedValue(updated);
    const reqC: any = { params: { id: 'd1' }, body: { itemName: 'Shirt' }, files: { donationPhoto: [{ filename: 'onlydon.png' }] } };
    const resC = mockRes();
    await controller.updateDonation(reqC, resC, jest.fn());
    expect(spy.mock.calls[2][1].media).toBe('onlydon.png');
  });

  test('getAllDonations propagates service error status', async () => {
    const err: any = new Error('fail');
    err.statusCode = 422;
    jest.spyOn(DonationService.prototype, 'getAllDonations').mockRejectedValueOnce(err);
    const req: any = { query: {} };
    const res = mockRes();
    await controller.getAllDonations(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(422);
  });

  test('getMyDonations propagates service error status', async () => {
    const err: any = new Error('nope');
    err.statusCode = 409;
    jest.spyOn(DonationService.prototype, 'getDonationsByDonorId').mockRejectedValueOnce(err);
    const req: any = { query: {}, user: { _id: 'user1' } };
    const res = mockRes();
    await controller.getMyDonations(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('getDonationsByDonorId returns 200 on success', async () => {
    const donations = [{ _id: 'd1' }];
    const pagination = { page: 1, size: 10, totalItems: 1, totalPages: 1 };
    jest.spyOn(DonationService.prototype, 'getDonationsByDonorId').mockResolvedValueOnce({ donations, pagination } as any);
    const req: any = { params: { donorId: 'd1' }, query: {} };
    const res = mockRes();
    await controller.getDonationsByDonorId(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: donations, pagination, message: 'Donor donations retrieved' });
  });

});
