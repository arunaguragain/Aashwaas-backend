import { DonationRepository } from '../../../repositories/donation.repository';
import { DonationModel } from '../../../models/donation.model';

describe('DonationRepository', () => {
  let repo: DonationRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new DonationRepository();
  });

  test('deleteDonation returns true when doc exists and false otherwise', async () => {
    jest.spyOn(DonationModel, 'findByIdAndDelete' as any).mockResolvedValueOnce({ _id: 'd1' } as any);
    const res1 = await repo.deleteDonation('d1');
    expect(res1).toBe(true);

    jest.spyOn(DonationModel, 'findByIdAndDelete' as any).mockResolvedValueOnce(null as any);
    const res2 = await repo.deleteDonation('d2');
    expect(res2).toBe(false);
  });

  test('getAllDonations and getDonationsByDonorId return data with pagination', async () => {
    const docs = [{ _id: 'd1' }];
    // simulate chain find().skip(...).limit(...).populate(...)
    const fakeQuery = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValueOnce(docs),
    } as any;
    jest.spyOn(DonationModel, 'find' as any).mockReturnValueOnce(fakeQuery);
    jest.spyOn(DonationModel, 'countDocuments' as any).mockResolvedValueOnce(1 as any);

    const out1 = await repo.getAllDonations(1, 10);
    expect(out1.total).toBe(1);
    expect(out1.donations).toEqual(docs);
    expect(fakeQuery.skip).toHaveBeenCalledWith(0);
    expect(fakeQuery.limit).toHaveBeenCalledWith(10);

    // for getDonationsByDonorId ensured filter is applied
    const fakeQuery2 = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValueOnce(docs),
    } as any;
    const findSpy = jest.spyOn(DonationModel, 'find' as any).mockReturnValueOnce(fakeQuery2);
    jest.spyOn(DonationModel, 'countDocuments' as any).mockResolvedValueOnce(1 as any);
    const out2 = await repo.getDonationsByDonorId('donor1', 2, 5);
    expect(out2.total).toBe(1);
    expect(out2.donations).toEqual(docs);
    expect(fakeQuery2.skip).toHaveBeenCalledWith(5);
    expect(fakeQuery2.limit).toHaveBeenCalledWith(5);
    expect(findSpy).toHaveBeenCalledWith({ donorId: 'donor1' });
  });

  test('getDonationById returns result', async () => {
    const d = { _id: 'd2' } as any;
    jest.spyOn(DonationModel, 'findById' as any).mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(d) } as any);
    const res = await repo.getDonationById('d2');
    expect(res).toEqual(d);
  });

  test('updateDonation returns doc or null', async () => {
    const updated = { _id: 'd3' } as any;
    jest.spyOn(DonationModel, 'findByIdAndUpdate' as any).mockReturnValueOnce({ populate: jest.fn().mockResolvedValueOnce(updated) } as any);
    const res = await repo.updateDonation('d3', { status: 'approved' } as any);
    expect(res).toEqual(updated);

    // when the query resolved to null, a populate stub is still needed to avoid runtime error
    jest.spyOn(DonationModel, 'findByIdAndUpdate' as any).mockReturnValueOnce({ populate: jest.fn().mockResolvedValueOnce(null) } as any);
    const res2 = await repo.updateDonation('no', {} as any);
    expect(res2).toBeNull();
  });
});