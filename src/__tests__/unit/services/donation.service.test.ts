import { DonationService } from '../../../services/donation.service';
import { DonationRepository } from '../../../repositories/donation.repository';

jest.mock('../../../repositories/donation.repository');

describe('DonationService', () => {
  let service: DonationService;
  let mockDonationRepo: jest.Mocked<DonationRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DonationService();
    const MockedDonationRepository = DonationRepository as unknown as jest.MockedClass<typeof DonationRepository>;
    mockDonationRepo = MockedDonationRepository.mock.instances[0] as jest.Mocked<DonationRepository>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getDonationById', () => {
    test('throws 400 when id is not provided', async () => {
      await expect(service.getDonationById('')).rejects.toThrow('Donation ID is required');
      await expect(service.getDonationById(undefined as any)).rejects.toThrow('Donation ID is required');
    });

    test('throws 404 when donation not found', async () => {
      const getByIdSpy = jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce(null as any);

      await expect(service.getDonationById('nonexistent-id')).rejects.toThrow('Donation not found');
      expect(getByIdSpy).toHaveBeenCalledWith('nonexistent-id');
    });

    test('returns donation when found', async () => {
      const donation = { _id: 'don1', itemName: 'Blanket', category: 'Clothes', quantity: '1', condition: 'Good', pickupLocation: 'Kathmandu', donorId: 'd1', status: 'pending' } as any;
      const getByIdSpy = jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce(donation);

      const result = await service.getDonationById('don1');

      expect(result).toBe(donation);
      expect(getByIdSpy).toHaveBeenCalledWith('don1');
    });
  });

  describe('getAllDonations', () => {
    test('returns donations with default pagination', async () => {
      const donations = [{ _id: 'd1' }, { _id: 'd2' }] as any;
      const getAllSpy = jest.spyOn(DonationRepository.prototype, 'getAllDonations').mockResolvedValueOnce({ donations, total: 15 } as any);

      const result = await service.getAllDonations();

      expect(result.donations).toBe(donations);
      expect(result.pagination).toEqual({ page: 1, size: 10, totalItems: 15, totalPages: Math.ceil(15 / 10) });
      expect(getAllSpy).toHaveBeenCalledWith(1, 10);
    });

    test('parses page and size strings and uses them', async () => {
      const donations = [{ _id: 'd1' }] as any;
      const getAllSpy = jest.spyOn(DonationRepository.prototype, 'getAllDonations').mockResolvedValueOnce({ donations, total: 15 } as any);

      const result = await service.getAllDonations('2', '5');

      expect(result.donations).toBe(donations);
      expect(result.pagination).toEqual({ page: 2, size: 5, totalItems: 15, totalPages: Math.ceil(15 / 5) });
      expect(getAllSpy).toHaveBeenCalledWith(2, 5);
    });
  });

  describe('getDonationsByDonorId', () => {
    test('throws 400 when donorId missing', async () => {
      await expect(service.getDonationsByDonorId('' as any)).rejects.toThrow('Donor ID is required');
    });

    test('returns donations and pagination', async () => {
      const donations = [{ _id: 'd1' }];
      const getByDonorSpy = jest.spyOn(DonationRepository.prototype, 'getDonationsByDonorId').mockResolvedValueOnce({ donations, total: 7 } as any);

      const result = await service.getDonationsByDonorId('donor1', '1', '5');

      expect(result.donations).toBe(donations);
      expect(result.pagination).toEqual({ page: 1, size: 5, totalItems: 7, totalPages: Math.ceil(7 / 5) });
      expect(getByDonorSpy).toHaveBeenCalledWith('donor1', 1, 5);
    });
  });

  describe('createDonation', () => {
    test('throws 400 when donorId missing', async () => {
      await expect(service.createDonation({}, '' as any)).rejects.toThrow('Donor ID is required');
    });

    test('creates donation and sets defaults', async () => {
      const input = { itemName: 'Blanket', category: 'Other', quantity: '1', condition: 'Good', pickupLocation: 'Kathmandu' } as any;
      const saved = { _id: 'x', ...input, donorId: 'd1', status: 'pending' } as any;
      const createSpy = jest.spyOn(DonationRepository.prototype, 'createDonation').mockResolvedValueOnce(saved);

      const result = await service.createDonation(input, 'd1');

      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ donorId: 'd1', status: 'pending' }));
      expect(result).toBe(saved);
    });
  });

  describe('updateDonation', () => {
    test('throws 400 when id missing', async () => {
      await expect(service.updateDonation('' as any, {})).rejects.toThrow('Donation ID is required');
    });

    test('throws 404 when donation not found', async () => {
      const getByIdSpy = jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce(null as any);
      await expect(service.updateDonation('noid', {})).rejects.toThrow('Donation not found');
      expect(getByIdSpy).toHaveBeenCalledWith('noid');
    });

    test('updates and returns donation', async () => {
      const getByIdSpy = jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce({ _id: 'd1' } as any);
      const updated = { _id: 'd1', status: 'approved' } as any;
      const updateSpy = jest.spyOn(DonationRepository.prototype, 'updateDonation').mockResolvedValueOnce(updated as any);

      const result = await service.updateDonation('d1', { status: 'approved' } as any);

      expect(getByIdSpy).toHaveBeenCalledWith('d1');
      expect(updateSpy).toHaveBeenCalledWith('d1', { status: 'approved' });
      expect(result).toBe(updated);
    });
  });

  describe('deleteDonation', () => {
    test('throws 400 when id missing', async () => {
      await expect(service.deleteDonation('' as any)).rejects.toThrow('Donation ID is required');
    });

    test('throws 404 when not found', async () => {
      const getByIdSpy = jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce(null as any);
      await expect(service.deleteDonation('noid')).rejects.toThrow('Donation not found');
      expect(getByIdSpy).toHaveBeenCalledWith('noid');
    });

    test('deletes and returns result', async () => {
      const getByIdSpy = jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce({ _id: 'd1' } as any);
      const deleteSpy = jest.spyOn(DonationRepository.prototype, 'deleteDonation').mockResolvedValueOnce(true as any);

      const result = await service.deleteDonation('d1');

      expect(getByIdSpy).toHaveBeenCalledWith('d1');
      expect(deleteSpy).toHaveBeenCalledWith('d1');
      expect(result).toBe(true);
    });
  });
});
