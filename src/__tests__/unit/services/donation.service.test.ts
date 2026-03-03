import { DonationService } from '../../../services/donation.service';
import { DonationRepository } from '../../../repositories/donation.repository';
import { UserRepository } from '../../../repositories/user.repository';
import { sendEmail } from '../../../config/email';

jest.mock('../../../repositories/donation.repository');
jest.mock('../../../repositories/user.repository');
jest.mock('../../../config/email', () => ({ sendEmail: jest.fn() }));

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

    test('handles page/size zero values (truthy "0" strings)', async () => {
      const donations = [{ _id: 'd3' }];
      const getByDonorSpy = jest.spyOn(DonationRepository.prototype, 'getDonationsByDonorId').mockResolvedValueOnce({ donations, total: 2 } as any);

      const result = await service.getDonationsByDonorId('donor1', '0', '0');

      expect(result.donations).toBe(donations);
      // parseInt('0') === 0, so pagination reflects page 0 and size 0 behaviour
      expect(getByDonorSpy).toHaveBeenCalledWith('donor1', 0, 0);
    });

    test('handles non-numeric page/size strings (NaN from parseInt)', async () => {
      const donations = [{ _id: 'd4' }];
      const getByDonorSpy = jest.spyOn(DonationRepository.prototype, 'getDonationsByDonorId').mockResolvedValueOnce({ donations, total: 4 } as any);

      const result = await service.getDonationsByDonorId('donor1', 'abc', 'def');

      expect(result.donations).toBe(donations);
      // parseInt('abc') returns NaN; function should have passed NaN values through
      expect(getByDonorSpy).toHaveBeenCalledWith('donor1', NaN, NaN);
    });

    test('returns donations and default pagination when page/size omitted', async () => {
      const donations = [{ _id: 'd2' }];
      const getByDonorSpy = jest.spyOn(DonationRepository.prototype, 'getDonationsByDonorId').mockResolvedValueOnce({ donations, total: 12 } as any);

      const result = await service.getDonationsByDonorId('donor1');

      expect(result.donations).toBe(donations);
      expect(result.pagination).toEqual({ page: 1, size: 10, totalItems: 12, totalPages: Math.ceil(12 / 10) });
      expect(getByDonorSpy).toHaveBeenCalledWith('donor1', 1, 10);
    });

    test('omitted page/size when explicitly passed null', async () => {
      const donations = [{ _id: 'd5' }];
      const getByDonorSpy = jest.spyOn(DonationRepository.prototype, 'getDonationsByDonorId').mockResolvedValueOnce({ donations, total: 3 } as any);

      const result = await service.getDonationsByDonorId('donor1', null as any, undefined as any);

      expect(result.donations).toBe(donations);
      expect(result.pagination).toEqual({ page: 1, size: 10, totalItems: 3, totalPages: Math.ceil(3 / 10) });
      expect(getByDonorSpy).toHaveBeenCalledWith('donor1', 1, 10);
    });

    test('empty string page/size falls back to defaults', async () => {
      const donations = [{ _id: 'd6' }];
      const getByDonorSpy = jest.spyOn(DonationRepository.prototype, 'getDonationsByDonorId').mockResolvedValueOnce({ donations, total: 6 } as any);

      const result = await service.getDonationsByDonorId('donor1', '', '');

      expect(result.donations).toBe(donations);
      expect(result.pagination).toEqual({ page: 1, size: 10, totalItems: 6, totalPages: Math.ceil(6 / 10) });
      expect(getByDonorSpy).toHaveBeenCalledWith('donor1', 1, 10);
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
      const getByIdSpy = jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce({ _id: 'd1', status: 'pending' } as any);
      const updated = { _id: 'd1', status: 'approved' } as any;
      const updateSpy = jest.spyOn(DonationRepository.prototype, 'updateDonation').mockResolvedValueOnce(updated as any);

      const result = await service.updateDonation('d1', { status: 'approved' } as any);

      expect(getByIdSpy).toHaveBeenCalledWith('d1');
      expect(updateSpy).toHaveBeenCalledWith('d1', { status: 'approved' });
      expect(result).toBe(updated);
      // email should not be called for a non-completion change
      expect(sendEmail).not.toHaveBeenCalled();
    });

    test('sends thank-you email when status changes to completed', async () => {
      const existing: any = { _id: 'd10', status: 'assigned', donorId: 'u10', itemName: 'Books' };
      jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce(existing as any);
      jest.spyOn(DonationRepository.prototype, 'updateDonation').mockResolvedValueOnce({ ...existing, status: 'completed' } as any);
      jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce({ email: 'donor@example.com', name: 'Sam' } as any);

      const result = await service.updateDonation('d10', { status: 'completed' } as any);
      expect(result!.status).toBe('completed');
      expect(sendEmail).toHaveBeenCalledWith(
        'donor@example.com',
        expect.any(String),
        expect.stringContaining('Thank you')
      );
    });

    test('sends thank-you email with populated donorId and skips user lookup', async () => {
      const existing: any = {
        _id: 'd15',
        status: 'assigned',
        donorId: { _id: 'u15', email: 'populated@example.com', name: 'Pop' },
        itemName: 'Food'
      };
      jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce(existing as any);
      jest.spyOn(DonationRepository.prototype, 'updateDonation').mockResolvedValueOnce({ ...existing, status: 'completed' } as any);
      const userSpy = jest.spyOn(UserRepository.prototype, 'getUserById');

      const result = await service.updateDonation('d15', { status: 'completed' } as any);
      expect(result!.status).toBe('completed');
      expect(sendEmail).toHaveBeenCalledWith(
        'populated@example.com',
        expect.any(String),
        expect.stringContaining('Thank you')
      );
      expect(userSpy).not.toHaveBeenCalled();
    });

    test('does not send email if status remains completed', async () => {
      const existing: any = { _id: 'd11', status: 'completed', donorId: 'u11', itemName: 'Food' };
      jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce(existing as any);
      jest.spyOn(DonationRepository.prototype, 'updateDonation').mockResolvedValueOnce(existing as any);
      jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce({ email: 'email@x.com' } as any);

      const result = await service.updateDonation('d11', { status: 'completed' } as any);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    test('skips email if donorId missing on donation', async () => {
      const existing: any = { _id: 'd12', status: 'assigned', itemName: 'Books' };
      jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce(existing as any);
      jest.spyOn(DonationRepository.prototype, 'updateDonation').mockResolvedValueOnce({ ...existing, status: 'completed' } as any);
      // no donorId so UserRepository should not be called
      const userSpy = jest.spyOn(UserRepository.prototype, 'getUserById');

      const result = await service.updateDonation('d12', { status: 'completed' } as any);
      expect(result!.status).toBe('completed');
      expect(userSpy).not.toHaveBeenCalled();
      expect(sendEmail).not.toHaveBeenCalled();
    });

    test('catches sendEmail failure without throwing', async () => {
      const existing: any = { _id: 'd13', status: 'assigned', donorId: 'u13', itemName: 'Toy' };
      jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce(existing as any);
      jest.spyOn(DonationRepository.prototype, 'updateDonation').mockResolvedValueOnce({ ...existing, status: 'completed' } as any);
      jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce({ email: 'fail@x.com', name: 'Fail' } as any);
      (sendEmail as jest.Mock).mockRejectedValueOnce(new Error('smtp down'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.updateDonation('d13', { status: 'completed' } as any);
      expect(result!.status).toBe('completed');
      expect(sendEmail).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('returns null when updateDonation repository returns null', async () => {
      const existing: any = { _id: 'd14', status: 'pending', donorId: 'u14' };
      jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce(existing as any);
      jest.spyOn(DonationRepository.prototype, 'updateDonation').mockResolvedValueOnce(null as any);

      const result = await service.updateDonation('d14', { status: 'approved' } as any);
      expect(result).toBeNull();
      expect(sendEmail).not.toHaveBeenCalled();
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
