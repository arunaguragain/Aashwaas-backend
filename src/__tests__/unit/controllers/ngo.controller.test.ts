import { NgoController } from '../../../controllers/ngo.controller';
import { NgoService } from '../../../services/ngo.service';
import { HttpError } from '../../../errors/http-error';

jest.mock('../../../services/ngo.service');

describe('NgoController', () => {
  let controller: NgoController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new NgoController();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function mockRes() {
    return { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
  }

  test('getAllNgos returns 200 with data', async () => {
    const ngos = [{ _id: 'n1', name: 'NGO1' }];
    const pagination = { page: 1, size: 10, totalItems: 1, totalPages: 1 };
    jest.spyOn(NgoService.prototype, 'getAllNgos').mockResolvedValueOnce({ ngos, pagination } as any);

    const req: any = { query: {} };
    const res = mockRes();

    await controller.getAllNgos(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: ngos, pagination, message: 'All NGOs retrieved' });
  });

  test('getAllNgos forwards service error', async () => {
    jest.spyOn(NgoService.prototype, 'getAllNgos').mockRejectedValueOnce(new HttpError(500, 'DB error'));
    const req: any = { query: {} };
    const res = mockRes();

    await controller.getAllNgos(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'DB error' });
  });

  test('getAllNgos handles generic error', async () => {
    jest.spyOn(NgoService.prototype, 'getAllNgos').mockRejectedValueOnce({});
    const req: any = { query: {} };
    const res = mockRes();

    await controller.getAllNgos(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getNgoById returns 200 with ngo', async () => {
    const ngo = { _id: 'n1', name: 'NGO1' } as any;
    jest.spyOn(NgoService.prototype, 'getNgoById').mockResolvedValueOnce(ngo);

    const req: any = { params: { id: 'n1' } };
    const res = mockRes();

    await controller.getNgoById(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: ngo, message: 'NGO retrieved' });
  });

  test('getNgoById forwards not-found error', async () => {
    jest.spyOn(NgoService.prototype, 'getNgoById').mockRejectedValueOnce(new HttpError(404, 'NGO not found'));
    const req: any = { params: { id: 'missing' } };
    const res = mockRes();

    await controller.getNgoById(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'NGO not found' });
  });

  test('getNgoById handles generic error', async () => {
    jest.spyOn(NgoService.prototype, 'getNgoById').mockRejectedValueOnce({});
    const req: any = { params: { id: 'n1' } };
    const res = mockRes();

    await controller.getNgoById(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('getNgoById forwards not-found error', async () => {
    jest.spyOn(NgoService.prototype, 'getNgoById').mockRejectedValueOnce(new HttpError(404, 'NGO not found'));
    const req: any = { params: { id: 'missing' } };
    const res = mockRes();

    await controller.getNgoById(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'NGO not found' });
  });
});
