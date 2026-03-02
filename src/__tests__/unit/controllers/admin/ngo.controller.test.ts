import { AdminNgoController } from '../../../../controllers/admin/ngo.controller';
import { AdminNgoService } from '../../../../services/admin/ngo.service';

jest.mock('../../../../services/admin/ngo.service');

describe('AdminNgoController', () => {
  let controller: AdminNgoController;
  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AdminNgoController();
  });

  function mockRes() {
    return { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
  }

  describe('createNgo', () => {
    const dtoModule = require('../../../../dtos/ngo.dto');

    test('returns 400 when validation fails', async () => {
      jest.spyOn(dtoModule.CreateNgoDTO, 'safeParse').mockReturnValue({ success: false, error: { issues: [] } } as any);
      const req: any = { body: {} };
      const res = mockRes();
      await controller.createNgo(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('creates without file', async () => {
      const parsed: any = { success: true, data: { name: 'foo' } };
      jest.spyOn(dtoModule.CreateNgoDTO, 'safeParse').mockReturnValue(parsed as any);
      const newNgo = { _id: 'n1' };
      jest.spyOn(AdminNgoService.prototype, 'createNgo').mockResolvedValue(newNgo as any);
      const req: any = { body: { name: 'foo' } };
      const res = mockRes();
      await controller.createNgo(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'NGO created', data: newNgo });
    });

    test('handles file from req.file', async () => {
      const parsed: any = { success: true, data: { name: 'foo' } };
      jest.spyOn(dtoModule.CreateNgoDTO, 'safeParse').mockReturnValue(parsed as any);
      const newNgo = { _id: 'n2' };
      jest.spyOn(AdminNgoService.prototype, 'createNgo').mockResolvedValue(newNgo as any);
      const req: any = { body: { name: 'foo' }, file: { filename: 'pic.png' } };
      const res = mockRes();
      await controller.createNgo(req, res, jest.fn());
      expect(parsed.data.photo).toBe('pic.png');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('handles files.image and files.photo options', async () => {
      const parsed: any = { success: true, data: { name: 'foo' } };
      jest.spyOn(dtoModule.CreateNgoDTO, 'safeParse').mockReturnValue(parsed as any);
      const newNgo = { _id: 'n3' };
      jest.spyOn(AdminNgoService.prototype, 'createNgo').mockResolvedValue(newNgo as any);
      const req: any = { body: { name: 'foo' }, files: { image: [{ filename: 'img.jpg' }], photo: [{ filename: 'ph.png' }] } };
      const res = mockRes();
      await controller.createNgo(req, res, jest.fn());
      // should pick req.file first (none), then files.image
      expect(parsed.data.photo).toBe('img.jpg');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('handles service error with no message', async () => {
      const parsed = { success: true, data: { name: 'foo' } };
      jest.spyOn(dtoModule.CreateNgoDTO, 'safeParse').mockReturnValue(parsed as any);
      jest.spyOn(AdminNgoService.prototype, 'createNgo').mockRejectedValue({ statusCode: 418 } as any);
      const req: any = { body: { name: 'foo' } };
      const res = mockRes();
      await controller.createNgo(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(418);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
    });

    test('handles service error with message-only', async () => {
      const parsed = { success: true, data: { name: 'foo' } };
      jest.spyOn(dtoModule.CreateNgoDTO, 'safeParse').mockReturnValue(parsed as any);
      jest.spyOn(AdminNgoService.prototype, 'createNgo').mockRejectedValue({ message: 'bad' } as any);
      const req: any = { body: { name: 'foo' } };
      const res = mockRes();
      await controller.createNgo(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'bad' });
    });
  });

  describe('getAllNgos', () => {
    test('returns data', async () => {
      const data = { ngos: [], pagination: {} };
      jest.spyOn(AdminNgoService.prototype, 'getAllNgos').mockResolvedValue(data as any);
      const req: any = { query: { page: '2', size: '3', search: 'x' } };
      const res = mockRes();
      await controller.getAllNgos(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: data.ngos }));
    });

    test('handles generic error', async () => {
      jest.spyOn(AdminNgoService.prototype, 'getAllNgos').mockRejectedValue(new Error('boom'));
      const req: any = { query: {} };
      const res = mockRes();
      await controller.getAllNgos(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'boom' });
    });

    test('getAllNgos falls back to default message when error has no message', async () => {
      jest.spyOn(AdminNgoService.prototype, 'getAllNgos').mockRejectedValue({});
      const req: any = { query: {} };
      const res = mockRes();
      await controller.getAllNgos(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
    });
  });

  describe('getNgoById', () => {
    test('returns ngo on success', async () => {
      const ngo = { _id: 'n1' };
      jest.spyOn(AdminNgoService.prototype, 'getNgoById').mockResolvedValue(ngo as any);
      const req: any = { params: { id: 'n1' } };
      const res = mockRes();
      await controller.getNgoById(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: ngo, message: 'Single NGO retrieved' });
    });

    test('error fallback no message', async () => {
      jest.spyOn(AdminNgoService.prototype, 'getNgoById').mockRejectedValue({ statusCode: 402 } as any);
      const req: any = { params: { id: 'x' } };
      const res = mockRes();
      await controller.getNgoById(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(402);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
    });

    test('error fallback message-only', async () => {
      jest.spyOn(AdminNgoService.prototype, 'getNgoById').mockRejectedValue({ message: 'oops' } as any);
      const req: any = { params: { id: 'x' } };
      const res = mockRes();
      await controller.getNgoById(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'oops' });
    });
  });

  describe('updateNgo', () => {
    const dtoModule = require('../../../../dtos/ngo.dto');

    test('returns 400 when validation fails', async () => {
      jest.spyOn(dtoModule.UpdateNgoDTO, 'safeParse').mockReturnValue({ success: false, error: { issues: [] } } as any);
      const req: any = { params: { id: 'n1' }, body: {} };
      const res = mockRes();
      await controller.updateNgo(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('updates without file', async () => {
      const parsed: any = { success: true, data: { name: 'foo' } };
      jest.spyOn(dtoModule.UpdateNgoDTO, 'safeParse').mockReturnValue(parsed as any);
      const updated = { _id: 'n1' };
      jest.spyOn(AdminNgoService.prototype, 'updateNgo').mockResolvedValue(updated as any);
      const req: any = { params: { id: 'n1' }, body: { name: 'foo' } };
      const res = mockRes();
      await controller.updateNgo(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('updateNgo catches generic service error default message', async () => {
      const parsed: any = { success: true, data: { name: 'foo' } };
      jest.spyOn(dtoModule.UpdateNgoDTO, 'safeParse').mockReturnValue(parsed as any);
      jest.spyOn(AdminNgoService.prototype, 'updateNgo').mockRejectedValueOnce({});
      const req: any = { params: { id: 'n1' }, body: { name: 'foo' } };
      const res = mockRes();
      await controller.updateNgo(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
    });

    test('updates with file present', async () => {
      const parsed: any = { success: true, data: { name: 'foo' } };
      jest.spyOn(dtoModule.UpdateNgoDTO, 'safeParse').mockReturnValue(parsed as any);
      const updated = { _id: 'n2' };
      jest.spyOn(AdminNgoService.prototype, 'updateNgo').mockResolvedValue(updated as any);
      const req: any = { params: { id: 'n2' }, body: { name: 'foo' }, file: { filename: 'file.jpg' } };
      const res = mockRes();
      await controller.updateNgo(req, res, jest.fn());
      expect(parsed.data.photo).toBe('file.jpg');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('updates using files.image fallback', async () => {
      const parsed: any = { success: true, data: { name: 'foo' } };
      jest.spyOn(dtoModule.UpdateNgoDTO, 'safeParse').mockReturnValue(parsed as any);
      const updated = { _id: 'n2' };
      jest.spyOn(AdminNgoService.prototype, 'updateNgo').mockResolvedValue(updated as any);
      const req: any = { params: { id: 'n3' }, body: { name: 'foo' }, files: { image: [{ filename: 'img2.png' }] } };
      const res = mockRes();
      await controller.updateNgo(req, res, jest.fn());
      expect(parsed.data.photo).toBe('img2.png');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('handles error message provided', async () => {
      const parsed = { success: true, data: { name: 'foo' } };
      jest.spyOn(dtoModule.UpdateNgoDTO, 'safeParse').mockReturnValue(parsed as any);
      jest.spyOn(AdminNgoService.prototype, 'updateNgo').mockRejectedValue(new Error('oops'));
      const req: any = { params: { id: 'n3' }, body: { name: 'foo' } };
      const res = mockRes();
      await controller.updateNgo(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteNgo', () => {
    test('returns 404 when not deleted', async () => {
      jest.spyOn(AdminNgoService.prototype, 'deleteNgo').mockResolvedValue(false as any);
      const req: any = { params: { id: 'n1' } };
      const res = mockRes();
      await controller.deleteNgo(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('returns 200 when deleted', async () => {
      jest.spyOn(AdminNgoService.prototype, 'deleteNgo').mockResolvedValue(true as any);
      const req: any = { params: { id: 'n1' } };
      const res = mockRes();
      await controller.deleteNgo(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('catches error without message', async () => {
      jest.spyOn(AdminNgoService.prototype, 'deleteNgo').mockRejectedValue({ statusCode: 123 } as any);
      const req: any = { params: { id: 'n1' } };
      const res = mockRes();
      await controller.deleteNgo(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(123);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
    });

    test('catches message-only error', async () => {
      jest.spyOn(AdminNgoService.prototype, 'deleteNgo').mockRejectedValue({ message: 'nope' } as any);
      const req: any = { params: { id: 'n1' } };
      const res = mockRes();
      await controller.deleteNgo(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'nope' });
    });
  });
});