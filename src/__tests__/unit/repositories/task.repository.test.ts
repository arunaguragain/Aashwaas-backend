import { TaskRepository } from '../../../repositories/task.repository';
import { TaskModel } from '../../../models/task.model';

describe('TaskRepository', () => {
  let repo: TaskRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new TaskRepository();
  });

  test('createTask constructs TaskModel and calls save', async () => {
    const fakeSave = jest.fn().mockResolvedValueOnce({ _id: 't1', title: 'T' });
    // Mock TaskModel constructor to return object with save
    const Original = (TaskModel as any);
    const spyCtor = jest.spyOn(Original.prototype, 'save').mockImplementationOnce(fakeSave as any);

    //call createTask and ensure save called via prototype
    const res = await repo.createTask({ title: 'T' } as any);
    expect(fakeSave).toHaveBeenCalled();
    expect(res).toEqual(expect.objectContaining({ _id: 't1' }));
    spyCtor.mockRestore();
  });
});
