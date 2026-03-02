import { AdminTaskController } from '../../../../controllers/admin/task.controller';
import { AdminTaskService } from '../../../../services/admin/task.service';

// Mock the AdminTaskService to isolate controller logic
jest.mock('../../../../services/admin/task.service');

describe('AdminTaskController', () => {
  let controller: AdminTaskController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AdminTaskController();
  });

  function mockRes() {
    return { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
  }

  test('getAllTasks returns 200 with tasks and pagination', async () => {
    const spy = jest.spyOn(AdminTaskService.prototype, 'getAllTasks').mockResolvedValueOnce({ tasks: [{ id: 't1' }], pagination: { page: 1, size: 10 } } as any);
    const req: any = { query: { page: '1', size: '10' } };
    const res = mockRes();

    await controller.getAllTasks(req, res, jest.fn() as any);

    expect(spy).toHaveBeenCalledWith('1', '10', undefined);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: [{ id: 't1' }] }));
  });

  test('getAllTasks handles service error', async () => {
    jest.spyOn(AdminTaskService.prototype, 'getAllTasks').mockRejectedValueOnce({ statusCode: 418, message: 'oops' });
    const req: any = { query: {} };
    const res = mockRes();

    await controller.getAllTasks(req, res, jest.fn() as any);

    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'oops' });
  });

  test('getAllTasks falls back to default message when service throws without message', async () => {
    jest.spyOn(AdminTaskService.prototype, 'getAllTasks').mockRejectedValueOnce({});
    const req: any = { query: {} };
    const res = mockRes();
    await controller.getAllTasks(req, res, jest.fn() as any);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
  });

  test('getAllTasks propagates message-only service error', async () => {
    jest.spyOn(AdminTaskService.prototype, 'getAllTasks').mockRejectedValueOnce({ message: 'nope' });
    const req: any = { query: {} };
    const res = mockRes();
    await controller.getAllTasks(req, res, jest.fn() as any);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'nope' });
  });

  test('getTaskById returns task on success', async () => {
    jest.spyOn(AdminTaskService.prototype, 'getTaskById').mockResolvedValueOnce({ id: 't1' } as any);
    const req: any = { params: { id: 't1' } };
    const res = mockRes();

    await controller.getTaskById(req, res, jest.fn() as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { id: 't1' } }));
  });

  test("AdminTaskController.deleteTask - error handling", async () => {
    // reuse the controller instance created by beforeEach
    const req: any = { params: { id: 't1' } };
    const res = mockRes();
    jest.spyOn(AdminTaskService.prototype, 'deleteTask').mockRejectedValue({ statusCode: 403, message: 'nope' });
    await controller.deleteTask(req, res, jest.fn());
    // ensure catch branch executed (status code may default 500 if not set)
    expect(res.status).toHaveBeenCalled();
  });

  test("AdminTaskController.updateTask - error handling", async () => {
    const req: any = { params: { id: 't1' }, body: {} };
    const res = mockRes();
    jest.spyOn(AdminTaskService.prototype, 'updateTask').mockRejectedValue({ statusCode: 501, message: 'oops' });
    await controller.updateTask(req, res, jest.fn());
    expect(res.status).toHaveBeenCalled();
  });

  test('getTaskById catches generic error fallback', async () => {
    jest.spyOn(AdminTaskService.prototype, 'getTaskById').mockRejectedValueOnce({});
    const req: any = { params: { id: 't1' } };
    const res = mockRes();
    await controller.getTaskById(req, res, jest.fn() as any);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
  });

  test('getTaskById handles not-found error', async () => {
    jest.spyOn(AdminTaskService.prototype, 'getTaskById').mockRejectedValueOnce({ statusCode: 404, message: 'Not found' });
    const req: any = { params: { id: 'nope' } };
    const res = mockRes();

    await controller.getTaskById(req, res, jest.fn() as any);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Not found' });
  });

  test('getTaskById statusCode-only error falls back to default message', async () => {
    jest.spyOn(AdminTaskService.prototype, 'getTaskById').mockRejectedValueOnce({ statusCode: 418 });
    const req: any = { params: { id: 'nope' } };
    const res = mockRes();
    await controller.getTaskById(req, res, jest.fn() as any);
    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
  });

  test('getAllTasks statusCode-only error falls back to default message', async () => {
    jest.spyOn(AdminTaskService.prototype, 'getAllTasks').mockRejectedValueOnce({ statusCode: 418 });
    const req: any = { query: {} };
    const res = mockRes();
    await controller.getAllTasks(req, res, jest.fn() as any);
    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
  });

  test('createTask returns 400 on validation failure', async () => {
    const req: any = { body: { title: '', donationId: '', volunteerId: '', ngoId: '' } };
    const res = mockRes();

    await controller.createTask(req, res, jest.fn() as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
  test('createTask catches generic service error and falls back', async () => {
    jest.spyOn(AdminTaskService.prototype, 'createTask').mockRejectedValueOnce({});
    const req: any = { body: { title: 'T', donationId: 'd', volunteerId: 'v', ngoId: 'n' } };
    const res = mockRes();
    await controller.createTask(req, res, jest.fn() as any);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
  });
  test('createTask returns 201 on success', async () => {
    const newTask = { id: 't2', title: 'Do stuff' };
    jest.spyOn(AdminTaskService.prototype, 'createTask').mockResolvedValueOnce(newTask as any);
    const req: any = { body: { title: 'Do stuff', donationId: 'd1', volunteerId: 'v1', ngoId: 'n1' } };
    const res = mockRes();

    await controller.createTask(req, res, jest.fn() as any);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: newTask }));
  });

  test('createTask forwards service errors', async () => {
    jest.spyOn(AdminTaskService.prototype, 'createTask').mockRejectedValueOnce({ statusCode: 409, message: 'Conflict' });
    const req: any = { body: { title: 'Do', donationId: 'd1', volunteerId: 'v1', ngoId: 'n1' } };
    const res = mockRes();

    await controller.createTask(req, res, jest.fn() as any);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Conflict' });
  });

  test('updateTask validation failure returns 400', async () => {
    const req: any = { params: { id: 't3' }, body: { title: '' } };
    const res = mockRes();

    await controller.updateTask(req, res, jest.fn() as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('updateTask returns 200 on success', async () => {
    const updated = { id: 't3', title: 'updated' };
    jest.spyOn(AdminTaskService.prototype, 'updateTask').mockResolvedValueOnce(updated as any);
    const req: any = { params: { id: 't3' }, body: { title: 'updated', donationId: 'd1', volunteerId: 'v1', ngoId: 'n1' } };
    const res = mockRes();

    await controller.updateTask(req, res, jest.fn() as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: updated }));
  });

  test('updateTask catches generic service error and falls back', async () => {
    jest.spyOn(AdminTaskService.prototype, 'updateTask').mockRejectedValueOnce({});
    const req: any = { params: { id: 't3' }, body: { title: 'updated', donationId: 'd1', volunteerId: 'v1', ngoId: 'n1' } };
    const res = mockRes();
    await controller.updateTask(req, res, jest.fn() as any);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
  });

  test('updateTask propagates message-only error', async () => {
    jest.spyOn(AdminTaskService.prototype, 'updateTask').mockRejectedValueOnce({ message: 'oops' });
    const req: any = { params: { id: 't3' }, body: { title: 'updated', donationId: 'd1', volunteerId: 'v1', ngoId: 'n1' } };
    const res = mockRes();
    await controller.updateTask(req, res, jest.fn() as any);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'oops' });
  });

  test('deleteTask returns 200 on success', async () => {
    jest.spyOn(AdminTaskService.prototype, 'deleteTask').mockResolvedValueOnce(undefined as any);
    const req: any = { params: { id: 't4' } };
    const res = mockRes();

    await controller.deleteTask(req, res, jest.fn() as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Task deleted' });
  });

  test('deleteTask catches generic service error and falls back', async () => {
    jest.spyOn(AdminTaskService.prototype, 'deleteTask').mockRejectedValueOnce({});
    const req: any = { params: { id: 't4' } };
    const res = mockRes();
    await controller.deleteTask(req, res, jest.fn() as any);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
  });

  test('deleteTask forwards service error', async () => {
    jest.spyOn(AdminTaskService.prototype, 'deleteTask').mockRejectedValueOnce({ statusCode: 500, message: 'boom' });
    const req: any = { params: { id: 't4' } };
    const res = mockRes();

    await controller.deleteTask(req, res, jest.fn() as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'boom' });
  });
});
