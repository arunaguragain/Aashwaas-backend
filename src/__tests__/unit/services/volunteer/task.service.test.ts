import { HttpError } from '../../../../errors/http-error';
import { VolunteerTaskService } from '../../../../services/volunteer/task.service';
import { TaskRepository } from '../../../../repositories/task.repository';
import { DonationRepository } from '../../../../repositories/donation.repository';
import { DonationService } from '../../../../services/donation.service';

jest.mock('../../../../repositories/task.repository');
jest.mock('../../../../repositories/donation.repository');
jest.mock('../../../../services/donation.service');

describe('VolunteerTaskService', () => {
  let service: VolunteerTaskService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VolunteerTaskService();
  });

  test('getMyTasks throws 400 when volunteerId missing', async () => {
    await expect((service as any).getMyTasks('')).rejects.toEqual(expect.any(HttpError));
  });

  test('getMyTasks returns tasks', async () => {
    const tasks = [{ _id: 't1' }];
    jest.spyOn(TaskRepository.prototype, 'getTasksByVolunteerId' as any).mockResolvedValueOnce(tasks as any);
    const res = await service.getMyTasks('v1');
    expect(res).toEqual(tasks);
  });

  describe('acceptTask', () => {
    test('throws 400 when taskId or volunteerId missing', async () => {
      await expect(service.acceptTask('', 'v1')).rejects.toEqual(expect.any(HttpError));
      await expect(service.acceptTask('t1', '')).rejects.toEqual(expect.any(HttpError));
    });

    test('throws 404 when task not found', async () => {
      jest.spyOn(TaskRepository.prototype, 'getTaskById' as any).mockResolvedValueOnce(null as any);
      await expect(service.acceptTask('t1', 'v1')).rejects.toEqual(expect.any(HttpError));
    });

    test('throws 403 when volunteer mismatches', async () => {
      const task = { _id: 't1', volunteerId: 'other', status: 'assigned' } as any;
      jest.spyOn(TaskRepository.prototype, 'getTaskById' as any).mockResolvedValueOnce(task);
      await expect(service.acceptTask('t1', 'v1')).rejects.toEqual(expect.any(HttpError));
    });

    test('throws 400 when status is not assigned', async () => {
      const task = { _id: 't1', volunteerId: 'v1', status: 'accepted' } as any;
      jest.spyOn(TaskRepository.prototype, 'getTaskById' as any).mockResolvedValueOnce(task);
      await expect(service.acceptTask('t1', 'v1')).rejects.toEqual(expect.any(HttpError));
    });

    test('accepts assigned task and updates', async () => {
      const task = { _id: 't1', volunteerId: 'v1', status: 'assigned' } as any;
      const updated = { ...task, status: 'accepted' } as any;
      jest.spyOn(TaskRepository.prototype, 'getTaskById' as any).mockResolvedValueOnce(task);
      jest.spyOn(TaskRepository.prototype, 'updateTask' as any).mockResolvedValueOnce(updated as any);

      const res = await service.acceptTask('t1', 'v1');
      expect(res).toEqual(updated);
    });
  });

  describe('completeTask', () => {
    test('throws for missing ids and not found', async () => {
      await expect(service.completeTask('', 'v1')).rejects.toEqual(expect.any(HttpError));
      await expect(service.completeTask('t1', '')).rejects.toEqual(expect.any(HttpError));

      jest.spyOn(TaskRepository.prototype, 'getTaskById' as any).mockResolvedValueOnce(null as any);
      await expect(service.completeTask('t1', 'v1')).rejects.toEqual(expect.any(HttpError));
    });

    test('throws 403 when volunteer mismatches', async () => {
      const task = { _id: 't1', volunteerId: 'other', status: 'accepted' } as any;
      jest.spyOn(TaskRepository.prototype, 'getTaskById' as any).mockResolvedValueOnce(task);
      await expect(service.completeTask('t1', 'v1')).rejects.toEqual(expect.any(HttpError));
    });

    test('throws 400 when status is not accepted', async () => {
      const task = { _id: 't1', volunteerId: 'v1', status: 'assigned' } as any;
      jest.spyOn(TaskRepository.prototype, 'getTaskById' as any).mockResolvedValueOnce(task);
      await expect(service.completeTask('t1', 'v1')).rejects.toEqual(expect.any(HttpError));
    });

    test('completes accepted task and updates donation (via service)', async () => {
      const task = { _id: 't1', volunteerId: 'v1', status: 'accepted', donationId: 'd1' } as any;
      const updated = { ...task, status: 'completed' } as any;
      jest.spyOn(TaskRepository.prototype, 'getTaskById' as any).mockResolvedValueOnce(task);
      jest.spyOn(TaskRepository.prototype, 'updateTask' as any).mockResolvedValueOnce(updated as any);
      jest.spyOn(DonationService.prototype, 'updateDonation' as any).mockResolvedValueOnce({ _id: 'd1', status: 'completed' } as any);

      const res = await service.completeTask('t1', 'v1');
      expect(res).toEqual(updated);
      expect(DonationService.prototype.updateDonation).toHaveBeenCalledWith('d1', { status: 'completed' });
    });
  });

  describe('cancelTask', () => {
    test('throws for missing ids and not found', async () => {
      await expect(service.cancelTask('', 'v1')).rejects.toEqual(expect.any(HttpError));
      await expect(service.cancelTask('t1', '')).rejects.toEqual(expect.any(HttpError));

      jest.spyOn(TaskRepository.prototype, 'getTaskById' as any).mockResolvedValueOnce(null as any);
      await expect(service.cancelTask('t1', 'v1')).rejects.toEqual(expect.any(HttpError));
    });

    test('throws 403 when volunteer mismatches', async () => {
      const task = { _id: 't1', volunteerId: 'other', status: 'assigned' } as any;
      jest.spyOn(TaskRepository.prototype, 'getTaskById' as any).mockResolvedValueOnce(task);
      await expect(service.cancelTask('t1', 'v1')).rejects.toEqual(expect.any(HttpError));
    });

    test('throws 400 when status not cancellable', async () => {
      const task = { _id: 't1', volunteerId: 'v1', status: 'completed' } as any;
      jest.spyOn(TaskRepository.prototype, 'getTaskById' as any).mockResolvedValueOnce(task);
      await expect(service.cancelTask('t1', 'v1')).rejects.toEqual(expect.any(HttpError));
    });

    test('deletes cancellable task', async () => {
      const task = { _id: 't1', volunteerId: 'v1', status: 'assigned' } as any;
      jest.spyOn(TaskRepository.prototype, 'getTaskById' as any).mockResolvedValueOnce(task);
      jest.spyOn(TaskRepository.prototype, 'deleteTask' as any).mockResolvedValueOnce(true as any);

      const res = await service.cancelTask('t1', 'v1');
      expect(res).toBe(true);
    });
  });
});
