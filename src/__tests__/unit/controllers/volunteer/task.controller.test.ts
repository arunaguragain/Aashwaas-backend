import { VolunteerTaskController } from '../../../../controllers/volunteer/task.controller';
import { VolunteerTaskService } from '../../../../services/volunteer/task.service';
import { HttpError } from '../../../../errors/http-error';

jest.mock('../../../../services/volunteer/task.service');

describe('VolunteerTaskController', () => {
  let controller: VolunteerTaskController;
  beforeEach(() => {
    jest.clearAllMocks();
    controller = new VolunteerTaskController();
  });

  function mockRes() {
    return { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
  }

  describe('getMyTasks', () => {
    test('returns 401 when not authenticated', async () => {
      const req: any = {}; // no user
      const res = mockRes();
      await controller.getMyTasks(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not authenticated' });
    });

    test('returns 200 with data on success', async () => {
      const tasks = [{ _id: 't1' }];
      jest.spyOn(VolunteerTaskService.prototype, 'getMyTasks').mockResolvedValue(tasks as any);
      const req: any = { user: { _id: 'u1' } };
      const res = mockRes();
      await controller.getMyTasks(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: tasks, message: 'Tasks retrieved' });
    });

    test('catches errors with statusCode', async () => {
      const err = new HttpError(418, 'teapot');
      jest.spyOn(VolunteerTaskService.prototype, 'getMyTasks').mockRejectedValue(err);
      const req: any = { user: { _id: 'u1' } };
      const res = mockRes();
      await controller.getMyTasks(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(418);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'teapot' });
    });

    test('catches generic errors', async () => {
      jest.spyOn(VolunteerTaskService.prototype, 'getMyTasks').mockRejectedValue({});
      const req: any = { user: { _id: 'u1' } };
      const res = mockRes();
      await controller.getMyTasks(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
    });
  });

  describe('acceptTask', () => {
    test('returns 401 when not authenticated', async () => {
      const req: any = { params: { id: 'x' } };
      const res = mockRes();
      await controller.acceptTask(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('accepts a task and returns 200', async () => {
      const updated = { _id: 't1', status: 'accepted' };
      jest.spyOn(VolunteerTaskService.prototype, 'acceptTask').mockResolvedValue(updated as any);
      const req: any = { user: { _id: 'u1' }, params: { id: 't1' } };
      const res = mockRes();
      await controller.acceptTask(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: updated, message: 'Task accepted' });
    });

    test('handles service error', async () => {
      const err = new HttpError(400, 'bad');
      jest.spyOn(VolunteerTaskService.prototype, 'acceptTask').mockRejectedValue(err);
      const req: any = { user: { _id: 'u1' }, params: { id: 't1' } };
      const res = mockRes();
      await controller.acceptTask(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('acceptTask propagates message-only error', async () => {
      jest.spyOn(VolunteerTaskService.prototype, 'acceptTask').mockRejectedValueOnce({ message: 'oops' });
      const req: any = { user: { _id: 'u1' }, params: { id: 't1' } };
      const res = mockRes();
      await controller.acceptTask(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'oops' });
    });

    test('handles generic error', async () => {
      jest.spyOn(VolunteerTaskService.prototype, 'acceptTask').mockRejectedValue({});
      const req: any = { user: { _id: 'u1' }, params: { id: 't1' } };
      const res = mockRes();
      await controller.acceptTask(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
    });
  });

  describe('completeTask', () => {
    test('returns 401 when not authenticated', async () => {
      const req: any = { params: { id: 'x' } };
      const res = mockRes();
      await controller.completeTask(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('completes the task and returns 200', async () => {
      const updated = { _id: 't2', status: 'completed' };
      jest.spyOn(VolunteerTaskService.prototype, 'completeTask').mockResolvedValue(updated as any);
      const req: any = { user: { _id: 'u1' }, params: { id: 't2' } };
      const res = mockRes();
      await controller.completeTask(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: updated, message: 'Task completed' });
    });

    test('handles service rejection with generic error', async () => {
      jest.spyOn(VolunteerTaskService.prototype, 'completeTask').mockRejectedValue({});
      const req: any = { user: { _id: 'u1' }, params: { id: 't2' } };
      const res = mockRes();
      await controller.completeTask(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
    });
  });

  describe('cancelTask', () => {
    test('returns 401 when not authenticated', async () => {
      const req: any = { params: { id: 'x' } };
      const res = mockRes();
      await controller.cancelTask(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('cancels and returns 200', async () => {
      jest.spyOn(VolunteerTaskService.prototype, 'cancelTask').mockResolvedValue(undefined as any);
      const req: any = { user: { _id: 'u1' }, params: { id: 't3' } };
      const res = mockRes();
      await controller.cancelTask(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Task cancelled' });
    });

    test('catches error statusCode', async () => {
      const err = new HttpError(403, 'nope');
      jest.spyOn(VolunteerTaskService.prototype, 'cancelTask').mockRejectedValue(err);
      const req: any = { user: { _id: 'u1' }, params: { id: 't3' } };
      const res = mockRes();
      await controller.cancelTask(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'nope' });
    });

    test('cancelTask propagates message-only error', async () => {
      jest.spyOn(VolunteerTaskService.prototype, 'cancelTask').mockRejectedValueOnce({ message: 'denied' });
      const req: any = { user: { _id: 'u1' }, params: { id: 't3' } };
      const res = mockRes();
      await controller.cancelTask(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'denied' });
    });

    test('catches generic error', async () => {
      jest.spyOn(VolunteerTaskService.prototype, 'cancelTask').mockRejectedValue({});
      const req: any = { user: { _id: 'u1' }, params: { id: 't3' } };
      const res = mockRes();
      await controller.cancelTask(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
    });
  });
});
