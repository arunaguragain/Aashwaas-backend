import mongoose from 'mongoose';
import { AdminTaskService } from '../../../../services/admin/task.service';
import { TaskRepository } from '../../../../repositories/task.repository';
import { UserRepository } from '../../../../repositories/user.repository';
import { HttpError } from '../../../../errors/http-error';
import { sendEmail } from '../../../../config/email';

jest.mock('../../../../repositories/task.repository');
jest.mock('../../../../repositories/user.repository');
jest.mock('../../../../config/email', () => ({ sendEmail: jest.fn() }));

describe('AdminTaskService', () => {
  let service: AdminTaskService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminTaskService();
  });

  test('getTaskById throws 404 when not found', async () => {
    jest.spyOn(TaskRepository.prototype, 'getTaskById').mockResolvedValueOnce(null as any);
    await expect(service.getTaskById('missing')).rejects.toEqual(expect.any(HttpError));
  });

  test('getTaskById returns task when found', async () => {
    const task = { _id: 't1', title: 'Task 1' } as any;
    jest.spyOn(TaskRepository.prototype, 'getTaskById').mockResolvedValueOnce(task);
    await expect(service.getTaskById('t1')).resolves.toEqual(task);
  });

  test('createTask throws 400 when volunteerId missing', async () => {
    await expect(service.createTask({ donationId: 'd1', ngoId: 'n1' } as any)).rejects.toEqual(expect.any(HttpError));
  });

  test('createTask throws 400 when donationId missing', async () => {
    await expect(service.createTask({ volunteerId: 'v1', ngoId: 'n1' } as any)).rejects.toEqual(expect.any(HttpError));
  });

  test('createTask converts ids to ObjectId and calls repository', async () => {
    const created = { _id: 'new' } as any;
    const spy = jest.spyOn(TaskRepository.prototype, 'createTask').mockResolvedValueOnce(created);

    const data = { donationId: 'aaaaaaaaaaaaaaaaaaaaaaaa', volunteerId: 'bbbbbbbbbbbbbbbbbbbbbbbb', ngoId: 'cccccccccccccccccccccccc' };
    const res = await service.createTask(data as any);

    expect(spy).toHaveBeenCalled();
    const calledArg = spy.mock.calls[0][0];
    expect(calledArg.donationId).toBeDefined();
    expect(calledArg.volunteerId).toBeDefined();
    expect(mongoose.Types.ObjectId.isValid(calledArg.donationId as any)).toBeTruthy();
    expect(mongoose.Types.ObjectId.isValid(calledArg.volunteerId as any)).toBeTruthy();
    expect(res).toEqual(created);
  });

  test('createTask sends email if volunteer exists', async () => {
    const created = { _id: 'newemail' } as any;
    jest.spyOn(TaskRepository.prototype, 'createTask').mockResolvedValueOnce(created);
    jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce({ _id: 'v10', email: 'vol10@example.com', name: 'VolTen' } as any);

    const data = { donationId: 'aaaaaaaaaaaaaaaaaaaaaaaa', volunteerId: 'bbbbbbbbbbbbbbbbbbbbbbbb', ngoId: 'cccccccccccccccccccccccc', title: 'My task' };
    const res = await service.createTask(data as any);
    expect(res).toEqual(created);
    expect(sendEmail).toHaveBeenCalledWith(
      'vol10@example.com',
      expect.any(String),
      expect.stringContaining('assigned')
    );
  });

  test('createTask handles missing ngoId gracefully', async () => {
    const created = { _id: 'new_no_ngo' } as any;
    const spy = jest.spyOn(TaskRepository.prototype, 'createTask').mockResolvedValueOnce(created);
    const data = { donationId: 'aaaaaaaaaaaaaaaaaaaaaaaa', volunteerId: 'bbbbbbbbbbbbbbbbbbbbbbbb' };
    const res = await service.createTask(data as any);
    expect(spy).toHaveBeenCalled();
    const calledArg = spy.mock.calls[0][0];
    expect(calledArg.ngoId).toBeUndefined();
    expect(res).toEqual(created);
  });

  test('createTask continues even if email send fails', async () => {
    jest.spyOn(TaskRepository.prototype, 'createTask').mockResolvedValueOnce({ _id: 'err' } as any);
    jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce({ _id: 'v11', email: 'bad@example.com' } as any);
    (sendEmail as jest.Mock).mockRejectedValueOnce(new Error('smtp'));
    await expect(service.createTask({ donationId: 'aaaaaaaaaaaaaaaaaaaaaaaa', volunteerId: 'bbbbbbbbbbbbbbbbbbbbbbbb', ngoId: 'cccccccccccccccccccccccc' } as any)).resolves.toBeDefined();
    expect(sendEmail).toHaveBeenCalled();
  });

  test('updateTask throws 404 when task not found', async () => {
    jest.spyOn(TaskRepository.prototype, 'getTaskById').mockResolvedValueOnce(null as any);
    await expect(service.updateTask('x', { donationId: 'd', volunteerId: 'v' } as any)).rejects.toEqual(expect.any(HttpError));
  });

  test('updateTask converts ids and returns updated', async () => {
    const existing = { _id: 'e' } as any;
    const updated = { _id: 'e', title: 'Updated' } as any;
    jest.spyOn(TaskRepository.prototype, 'getTaskById').mockResolvedValueOnce(existing);
    const spy = jest.spyOn(TaskRepository.prototype, 'updateTask').mockResolvedValueOnce(updated as any);

    const res = await service.updateTask('e', { donationId: 'aaaaaaaaaaaaaaaaaaaaaaaa', volunteerId: 'bbbbbbbbbbbbbbbbbbbbbbbb' } as any);
    expect(spy).toHaveBeenCalled();
    const calledArg = spy.mock.calls[0][1];
    expect(calledArg.donationId).toBeDefined();
    expect(mongoose.Types.ObjectId.isValid(calledArg.donationId as any)).toBeTruthy();
    expect(res).toEqual(updated);
  });

  test('updateTask handles missing ngoId gracefully', async () => {
    const existing = { _id: 'e2' } as any;
    const updated = { _id: 'e2', title: 'Updated2' } as any;
    jest.spyOn(TaskRepository.prototype, 'getTaskById').mockResolvedValueOnce(existing);
    const spy = jest.spyOn(TaskRepository.prototype, 'updateTask').mockResolvedValueOnce(updated as any);

    const res = await service.updateTask('e2', { donationId: 'aaaaaaaaaaaaaaaaaaaaaaaa', volunteerId: 'bbbbbbbbbbbbbbbbbbbbbbbb' } as any);
    expect(spy).toHaveBeenCalled();
    const calledArg = spy.mock.calls[0][1];
    expect(calledArg.ngoId).toBeUndefined();
    expect(res).toEqual(updated);
  });

  test('updateTask converts ngoId when provided', async () => {
    const existing = { _id: 'e3' } as any;
    const updated = { _id: 'e3', title: 'Updated3' } as any;
    jest.spyOn(TaskRepository.prototype, 'getTaskById').mockResolvedValueOnce(existing);
    const spy = jest.spyOn(TaskRepository.prototype, 'updateTask').mockResolvedValueOnce(updated as any);

    const res = await service.updateTask('e3', { donationId: 'aaaaaaaaaaaaaaaaaaaaaaaa', volunteerId: 'bbbbbbbbbbbbbbbbbbbbbbbb', ngoId: 'cccccccccccccccccccccccc' } as any);
    expect(spy).toHaveBeenCalled();
    const calledArg = spy.mock.calls[0][1];
    expect(calledArg.ngoId).toBeDefined();
    expect(res).toEqual(updated);
  });

  test('deleteTask throws 404 when not found', async () => {
    jest.spyOn(TaskRepository.prototype, 'getTaskById').mockResolvedValueOnce(null as any);
    await expect(service.deleteTask('nope')).rejects.toEqual(expect.any(HttpError));
  });

  test('deleteTask calls TaskModel.findByIdAndDelete when found', async () => {
    const existing = { _id: 'e' } as any;
    jest.spyOn(TaskRepository.prototype, 'getTaskById').mockResolvedValueOnce(existing as any);

    const models = await import('../../../../models/task.model');
    const spy = jest.spyOn(models.TaskModel, 'findByIdAndDelete' as any).mockResolvedValueOnce(existing as any);

    const res = await service.deleteTask('e');
    expect(spy).toHaveBeenCalledWith('e');
    expect(res).toEqual(existing);
  });

  test('getAllTasks returns tasks and default pagination', async () => {
    const tasks = [{ _id: 't1' }];
    const models = await import('../../../../models/task.model');

    jest.spyOn(models.TaskModel, 'find' as any).mockImplementationOnce(() => ({
      skip: () => ({ limit: () => Promise.resolve(tasks) }),
    } as any));
    jest.spyOn(models.TaskModel, 'countDocuments' as any).mockResolvedValueOnce(1 as any);

    const res = await service.getAllTasks();
    expect(res.tasks).toEqual(tasks);
    expect(res.pagination).toMatchObject({ page: 1, size: 10, totalItems: 1, totalPages: 1 });
  });

  test('getAllTasks respects page and size', async () => {
    const tasks = [{ _id: 't2' }];
    const models = await import('../../../../models/task.model');

    jest.spyOn(models.TaskModel, 'find' as any).mockImplementationOnce(() => ({
      skip: (n: number) => ({ limit: (m: number) => Promise.resolve(tasks) }),
    } as any));
    jest.spyOn(models.TaskModel, 'countDocuments' as any).mockResolvedValueOnce(12 as any);

    const res = await service.getAllTasks('2', '5');
    expect(res.tasks).toEqual(tasks);
    expect(res.pagination).toMatchObject({ page: 2, size: 5, totalItems: 12, totalPages: 3 });
  });
});
