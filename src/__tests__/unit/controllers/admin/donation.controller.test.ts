import { AdminDonationController } from '../../../../controllers/admin/donation.controller';
import { AdminDonationService } from '../../../../services/admin/donation.service';

jest.mock('../../../../services/admin/donation.service');

describe('AdminDonationController', () => {
  let controller: AdminDonationController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AdminDonationController();
  });

  function mockRes() {
    return { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
  }

  test('getAllDonations returns pagination and data', async () => {
    jest.spyOn(AdminDonationService.prototype, 'getAllDonations').mockResolvedValueOnce({ donations: [{ _id: 'd1' }], total: 1 } as any);
    const req: any = { query: {} };
    const res = mockRes();
    await controller.getAllDonations(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('getAllDonations parses page/size and handles error', async () => {
    jest.spyOn(AdminDonationService.prototype, 'getAllDonations').mockResolvedValueOnce({ donations: [], total: 5 } as any);
    const req: any = { query: { page: '2', size: '2' } };
    const res = mockRes();
    await controller.getAllDonations(req, res, jest.fn());
    const call = res.json.mock.calls[0][0];
    expect(call.pagination.page).toBe(2);
    expect(call.pagination.size).toBe(2);

    jest.spyOn(AdminDonationService.prototype, 'getAllDonations').mockRejectedValueOnce({});
    const res2 = mockRes();
    await controller.getAllDonations(req, res2, jest.fn());
    expect(res2.status).toHaveBeenCalledWith(500);
  });

  test('getDonationById returns 404 when not found', async () => {
    jest.spyOn(AdminDonationService.prototype, 'getDonationById').mockResolvedValueOnce(null as any);
    const req: any = { params: { id: 'x' } };
    const res = mockRes();
    await controller.getDonationById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('getDonationById catches error', async () => {
    jest.spyOn(AdminDonationService.prototype, 'getDonationById').mockRejectedValueOnce({});
    const req: any = { params: { id: 'x' } };
    const res = mockRes();
    await controller.getDonationById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getDonationById propagates message-only error', async () => {
    jest.spyOn(AdminDonationService.prototype, 'getDonationById').mockRejectedValueOnce({ message: 'notfound' });
    const req: any = { params: { id: 'x' } };
    const res = mockRes();
    await controller.getDonationById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'notfound' });
  });

  test('getDonationById returns 200 when found', async () => {
    const donation = { _id: 'd1' } as any;
    jest.spyOn(AdminDonationService.prototype, 'getDonationById').mockResolvedValueOnce(donation as any);
    const req: any = { params: { id: 'd1' } };
    const res = mockRes();
    await controller.getDonationById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: donation });
  });

  test('deleteDonation returns 200 on success and 404 when not deleted', async () => {
    jest.spyOn(AdminDonationService.prototype, 'deleteDonation').mockResolvedValueOnce(true as any);
    const req1: any = { params: { id: 'd1' } };
    const res1 = mockRes();
    await controller.deleteDonation(req1, res1, jest.fn());
    expect(res1.status).toHaveBeenCalledWith(200);

    jest.spyOn(AdminDonationService.prototype, 'deleteDonation').mockResolvedValueOnce(false as any);
    const req2: any = { params: { id: 'd2' } };
    const res2 = mockRes();
    await controller.deleteDonation(req2, res2, jest.fn());
    expect(res2.status).toHaveBeenCalledWith(404);

    // error case
    jest.spyOn(AdminDonationService.prototype, 'deleteDonation').mockRejectedValueOnce({});
    const res3 = mockRes();
    await controller.deleteDonation(req2, res3, jest.fn());
    expect(res3.status).toHaveBeenCalledWith(500);
  });

  test('deleteDonation propagates message-only error', async () => {
    jest.spyOn(AdminDonationService.prototype, 'deleteDonation').mockRejectedValueOnce({ message: 'gone' });
    const req3: any = { params: { id: 'd2' } };
    const res4 = mockRes();
    await controller.deleteDonation(req3, res4, jest.fn());
    expect(res4.status).toHaveBeenCalledWith(500);
    expect(res4.json).toHaveBeenCalledWith({ success: false, message: 'gone' });
  });

  test('approveDonation returns 200 with updated donation', async () => {
    const updated = { _id: 'd1', status: 'approved' } as any;
    jest.spyOn(AdminDonationService.prototype, 'approveDonation').mockResolvedValueOnce(updated as any);
    const req: any = { params: { id: 'd1' } };
    const res = mockRes();
    await controller.approveDonation(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Donation approved', data: updated });
  });

  test('approveDonation error fallback', async () => {
    jest.spyOn(AdminDonationService.prototype, 'approveDonation').mockRejectedValueOnce({});
    const req: any = { params: { id: 'd1' } };
    const res = mockRes();
    await controller.approveDonation(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('assignDonation handles validation error and assigned/not-assigned branches', async () => {
    const reqBad: any = { params: { id: 'd1' }, body: { volunteerId: 'v' } };
    const resBad = mockRes();
    await controller.assignDonation(reqBad, resBad, jest.fn());
    expect(resBad.status).toHaveBeenCalledWith(400);

    const task = { _id: 't1' } as any;
    jest.spyOn(AdminDonationService.prototype, 'assignDonation').mockResolvedValueOnce({ task, alreadyAssigned: true } as any);
    const req1: any = { params: { id: 'd1' }, body: { donationId: 'd1', volunteerId: 'v', ngoId: 'n' , title: 'T' } };
    const res1 = mockRes();
    await controller.assignDonation(req1, res1, jest.fn());
    expect(res1.status).toHaveBeenCalledWith(200);

    jest.spyOn(AdminDonationService.prototype, 'assignDonation').mockResolvedValueOnce({ task, alreadyAssigned: false } as any);
    const res2 = mockRes();
    await controller.assignDonation(req1, res2, jest.fn());
    expect(res2.status).toHaveBeenCalledWith(201);

    // error branch
    jest.spyOn(AdminDonationService.prototype, 'assignDonation').mockRejectedValueOnce({});
    const res3 = mockRes();
    await controller.assignDonation(req1, res3, jest.fn());
    expect(res3.status).toHaveBeenCalledWith(500);
  });

  test('assignDonation uses default title when title empty', async () => {
    // bypass zod validation so we can exercise fallback branch
    const dtoMod = require('../../../../dtos/task.dto');
    jest.spyOn(dtoMod.AssignTaskDTO, 'safeParse').mockReturnValue({ success: true, data: { donationId: 'd2', volunteerId: 'v2', ngoId: 'n2', title: '' } } as any);

    const task = { _id: 't2' } as any;
    jest.spyOn(AdminDonationService.prototype, 'assignDonation').mockResolvedValueOnce({ task, alreadyAssigned: false } as any);
    const reqDefault: any = { params: { id: 'd2' }, body: { donationId: 'd2', volunteerId: 'v2', ngoId: 'n2', title: '' } };
    const res = mockRes();
    await controller.assignDonation(reqDefault, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
