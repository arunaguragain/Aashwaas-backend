// explicitly load the real implementation in case some other test mocked the module
const { PasswordResetRepository } = jest.requireActual('../../../repositories/passwordReset.repository');
import { PasswordResetModel } from '../../../models/passwordReset.model';
import mongoose from 'mongoose';

describe('PasswordResetRepository', () => {
  let repo: any; // use any since we import via requireActual

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new PasswordResetRepository();
  });

  test('create calls save on a new model instance', async () => {
    const payload = { userId: 'u1' } as any;
    jest.spyOn(PasswordResetModel.prototype, 'save').mockResolvedValueOnce('saved' as any);

    const res = await repo.create(payload);
    expect(PasswordResetModel.prototype.save).toHaveBeenCalled();
    expect(res).toBe('saved');
  });

  test('findLatestByUser builds query and returns result', async () => {
    const fakeExec = jest.fn().mockResolvedValue('found');
    const sortSpy = jest.fn().mockReturnValue({ exec: fakeExec });
    const findSpy = jest.spyOn(PasswordResetModel, 'findOne').mockReturnValue({ sort: sortSpy } as any);

    const res = await repo.findLatestByUser('507f191e810c19729de860ea');
    expect(findSpy).toHaveBeenCalledWith({ userId: new mongoose.Types.ObjectId('507f191e810c19729de860ea') });
    expect(sortSpy).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res).toBe('found');
  });

  test('markUsed executes update', async () => {
    const execSpy = jest.fn().mockResolvedValue(null);
    jest.spyOn(PasswordResetModel, 'findByIdAndUpdate').mockReturnValue({ exec: execSpy } as any);

    await repo.markUsed('id1');
    expect(PasswordResetModel.findByIdAndUpdate).toHaveBeenCalledWith('id1', { used: true });
    expect(execSpy).toHaveBeenCalled();
  });

  test('incrementAttempts returns updated attempts', async () => {
    const fakeDoc = { attempts: 5 };
    const execSpy = jest.fn().mockResolvedValue(fakeDoc);
    jest.spyOn(PasswordResetModel, 'findByIdAndUpdate').mockReturnValue({ exec: execSpy } as any);

    const count = await repo.incrementAttempts('id2');
    expect(PasswordResetModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'id2',
      { $inc: { attempts: 1 } },
      { new: true }
    );
    expect(count).toBe(5);
  });

  test('incrementAttempts returns 0 when doc missing', async () => {
    const execSpy = jest.fn().mockResolvedValue(null);
    jest.spyOn(PasswordResetModel, 'findByIdAndUpdate').mockReturnValue({ exec: execSpy } as any);

    const count = await repo.incrementAttempts('id3');
    expect(count).toBe(0);
  });

  test('deleteById calls delete', async () => {
    const execSpy = jest.fn().mockResolvedValue(null);
    jest.spyOn(PasswordResetModel, 'findByIdAndDelete').mockReturnValue({ exec: execSpy } as any);

    await repo.deleteById('id4');
    expect(PasswordResetModel.findByIdAndDelete).toHaveBeenCalledWith('id4');
    expect(execSpy).toHaveBeenCalled();
  });
});
