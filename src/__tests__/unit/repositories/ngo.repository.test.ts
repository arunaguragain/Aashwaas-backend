import { NgoRepository } from '../../../repositories/ngo.repository';
import { NgoModel } from '../../../models/ngo.model';

describe('NgoRepository', () => {
  let repo: NgoRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new NgoRepository();
  });

  test('deleteNgo returns true when exists and false otherwise', async () => {
    jest.spyOn(NgoModel, 'findByIdAndDelete' as any).mockResolvedValueOnce({ _id: 'n1' } as any);
    const r1 = await repo.deleteNgo('n1');
    expect(r1).toBe(true);
    jest.spyOn(NgoModel, 'findByIdAndDelete' as any).mockResolvedValueOnce(null as any);
    const r2 = await repo.deleteNgo('n2');
    expect(r2).toBe(false);
  });

  test('getAllNgos uses search filter when provided', async () => {
    const results = [{ _id: 'n1' }];
    const mockLimit = jest.fn().mockResolvedValueOnce(results);
    const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
    const findSpy = jest.spyOn(NgoModel, 'find' as any).mockReturnValueOnce({ skip: mockSkip } as any);
    jest.spyOn(NgoModel, 'countDocuments' as any).mockResolvedValueOnce(1 as any);

    const out = await repo.getAllNgos(1, 10, 'search');
    expect(out.total).toBe(1);
    expect(out.ngos).toEqual(results);
    expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({ $or: expect.any(Array) }));
  });

  test('getAllNgos works without search', async () => {
    const results = [{ _id: 'n2' }];
    const mockLimit = jest.fn().mockResolvedValueOnce(results);
    const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
    jest.spyOn(NgoModel, 'find' as any).mockReturnValueOnce({ skip: mockSkip } as any);
    jest.spyOn(NgoModel, 'countDocuments' as any).mockResolvedValueOnce(1 as any);

    const out = await repo.getAllNgos(2, 5);
    expect(out.total).toBe(1);
    expect(out.ngos).toEqual(results);
    expect(mockSkip).toHaveBeenCalledWith(5);
  });

  test('getNgoByEmail and getNgoById and getNgoByRegistrationNumber', async () => {
    const f = { _id: 'f' } as any;
    jest.spyOn(NgoModel, 'findOne' as any).mockResolvedValueOnce(f);
    expect(await repo.getNgoByEmail('e')).toEqual(f);
    jest.spyOn(NgoModel, 'findOne' as any).mockResolvedValueOnce(f);
    expect(await repo.getNgoByRegistrationNumber('r')).toEqual(f);
    jest.spyOn(NgoModel, 'findById' as any).mockResolvedValueOnce(f);
    expect(await repo.getNgoById('i')).toEqual(f);
  });

  test('updateNgo returns updated or null', async () => {
    const u = { _id: 'u1' } as any;
    jest.spyOn(NgoModel, 'findByIdAndUpdate' as any).mockResolvedValueOnce(u as any);
    const r = await repo.updateNgo('u1', { name: 'x' } as any);
    expect(r).toEqual(u);
    jest.spyOn(NgoModel, 'findByIdAndUpdate' as any).mockResolvedValueOnce(null as any);
    const r2 = await repo.updateNgo('none', {} as any);
    expect(r2).toBeNull();
  });
});