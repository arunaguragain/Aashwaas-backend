import { AdminNgoService } from '../../../../services/admin/ngo.service';
import { NgoRepository } from '../../../../repositories/ngo.repository';
import { HttpError } from '../../../../errors/http-error';

describe('AdminNgoService', () => {
  let service: AdminNgoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminNgoService();
  });

  describe('createNgo', () => {
    test('throws if email already exists', async () => {
      jest.spyOn(NgoRepository.prototype, 'getNgoByEmail').mockResolvedValueOnce({ _id: 'x' } as any);
      await expect(service.createNgo({ email: 'a', registrationNumber: 'r' } as any)).rejects.toEqual(expect.any(HttpError));
    });

    test('throws if registration number already exists', async () => {
      jest.spyOn(NgoRepository.prototype, 'getNgoByEmail').mockResolvedValueOnce(null as any);
      jest.spyOn(NgoRepository.prototype, 'getNgoByRegistrationNumber').mockResolvedValueOnce({ _id: 'x' } as any);
      await expect(service.createNgo({ email: 'a', registrationNumber: 'r' } as any)).rejects.toEqual(expect.any(HttpError));
    });

    test('returns new ngo on success', async () => {
      const obj = { _id: 'new' } as any;
      jest.spyOn(NgoRepository.prototype, 'getNgoByEmail').mockResolvedValueOnce(null as any);
      jest.spyOn(NgoRepository.prototype, 'getNgoByRegistrationNumber').mockResolvedValueOnce(null as any);
      jest.spyOn(NgoRepository.prototype, 'createNgo').mockResolvedValueOnce(obj as any);
      const res = await service.createNgo({ email: 'a', registrationNumber: 'r' } as any);
      expect(res).toEqual(obj);
    });
  });

  describe('getAllNgos', () => {
    test('uses default pagination when none provided', async () => {
      jest.spyOn(NgoRepository.prototype, 'getAllNgos').mockResolvedValueOnce({ ngos: [], total: 0 } as any);
      const out = await service.getAllNgos(undefined, undefined, undefined);
      expect(out.pagination.page).toBe(1);
      expect(out.pagination.size).toBe(10);
    });

    test('parses string page and size and passes search', async () => {
      jest.spyOn(NgoRepository.prototype, 'getAllNgos').mockResolvedValueOnce({ ngos: [], total: 0 } as any);
      await service.getAllNgos('2', '5', 'term');
      expect(NgoRepository.prototype.getAllNgos).toHaveBeenCalledWith(2, 5, 'term');
    });
  });

  describe('getNgoById', () => {
    test('throws 404 if not found', async () => {
      jest.spyOn(NgoRepository.prototype, 'getNgoById').mockResolvedValueOnce(null as any);
      await expect(service.getNgoById('i')).rejects.toEqual(expect.any(HttpError));
    });

    test('returns ngo when found', async () => {
      const ngo = { _id: 'i' } as any;
      jest.spyOn(NgoRepository.prototype, 'getNgoById').mockResolvedValueOnce(ngo as any);
      const res = await service.getNgoById('i');
      expect(res).toEqual(ngo);
    });
  });

  describe('updateNgo', () => {
    test('throws when ngo missing', async () => {
      jest.spyOn(NgoRepository.prototype, 'getNgoById').mockResolvedValueOnce(null as any);
      await expect(service.updateNgo('i', {} as any)).rejects.toEqual(expect.any(HttpError));
    });

    test('throws when updating email to one used by others', async () => {
      jest.spyOn(NgoRepository.prototype, 'getNgoById').mockResolvedValueOnce({ _id: 'i', email: 'old' } as any);
      jest.spyOn(NgoRepository.prototype, 'getNgoByEmail').mockResolvedValueOnce({ _id: 'other' } as any);
      await expect(service.updateNgo('i', { email: 'new' } as any)).rejects.toEqual(expect.any(HttpError));
    });

    test('throws when updating registration number to one used by others', async () => {
      jest.spyOn(NgoRepository.prototype, 'getNgoById').mockResolvedValueOnce({ _id: 'i', registrationNumber: 'old' } as any);
      jest.spyOn(NgoRepository.prototype, 'getNgoByEmail').mockResolvedValueOnce(null as any);
      jest.spyOn(NgoRepository.prototype, 'getNgoByRegistrationNumber').mockResolvedValueOnce({ _id: 'other' } as any);
      await expect(service.updateNgo('i', { registrationNumber: 'new' } as any)).rejects.toEqual(expect.any(HttpError));
    });

    test('returns updated object', async () => {
      const orig = { _id: 'i', email: 'old', registrationNumber: 'old' } as any;
      jest.spyOn(NgoRepository.prototype, 'getNgoById').mockResolvedValueOnce(orig as any);
      jest.spyOn(NgoRepository.prototype, 'getNgoByEmail').mockResolvedValueOnce(null as any);
      jest.spyOn(NgoRepository.prototype, 'getNgoByRegistrationNumber').mockResolvedValueOnce(null as any);
      const upd = { _id: 'i', email: 'new' } as any;
      jest.spyOn(NgoRepository.prototype, 'updateNgo').mockResolvedValueOnce(upd as any);
      const res = await service.updateNgo('i', { email: 'new' } as any);
      expect(res).toEqual(upd);
    });

    test('allows registration number update when the found record has same id', async () => {
      const orig = { _id: 'i', email: 'x', registrationNumber: 'orig' } as any;
      jest.spyOn(NgoRepository.prototype, 'getNgoById').mockResolvedValueOnce(orig as any);
      jest.spyOn(NgoRepository.prototype, 'getNgoByEmail').mockResolvedValueOnce(null as any);
      jest.spyOn(NgoRepository.prototype, 'getNgoByRegistrationNumber').mockResolvedValueOnce({ _id: 'i' } as any);
      const upd = { _id: 'i', registrationNumber: 'orig' } as any;
      jest.spyOn(NgoRepository.prototype, 'updateNgo').mockResolvedValueOnce(upd as any);
      const res = await service.updateNgo('i', { registrationNumber: 'orig' } as any);
      expect(res).toEqual(upd);
    });
  });

  describe('deleteNgo', () => {
    test('throws when ngo not found', async () => {
      jest.spyOn(NgoRepository.prototype, 'getNgoById').mockResolvedValueOnce(null as any);
      await expect(service.deleteNgo('i')).rejects.toEqual(expect.any(HttpError));
    });

    test('returns boolean result on success', async () => {
      jest.spyOn(NgoRepository.prototype, 'getNgoById').mockResolvedValueOnce({ _id: 'i' } as any);
      jest.spyOn(NgoRepository.prototype, 'deleteNgo').mockResolvedValueOnce(true as any);
      const res = await service.deleteNgo('i');
      expect(res).toBe(true);
    });
  });
});