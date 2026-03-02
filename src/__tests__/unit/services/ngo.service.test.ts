import { NgoService } from "../../../services/ngo.service";
import { NgoRepository } from "../../../repositories/ngo.repository";
import { HttpError } from "../../../errors/http-error";

describe('NgoService', () => {
  let service: NgoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NgoService();
  });

  test('getAllNgos returns ngos with default pagination', async () => {
    const ngos = [{ _id: 'n1', name: 'NGO1' } as any];
    const total = 1;
    jest.spyOn(NgoRepository.prototype, 'getAllNgos').mockResolvedValueOnce({ ngos, total } as any);

    const res = await service.getAllNgos(undefined, undefined, undefined);
    expect(res.ngos).toEqual(ngos);
    expect(res.pagination.page).toBe(1);
    expect(res.pagination.size).toBe(10);
    expect(res.pagination.totalItems).toBe(total);
  });

  test('getAllNgos parses page and size strings', async () => {
    const ngos: any[] = [];
    const total = 0;
    const spy = jest.spyOn(NgoRepository.prototype, 'getAllNgos').mockResolvedValueOnce({ ngos, total } as any);

    const res = await service.getAllNgos('2', '5', 'search');
    expect(spy).toHaveBeenCalledWith(2, 5, 'search');
    expect(res.pagination.page).toBe(2);
    expect(res.pagination.size).toBe(5);
  });

  test('getNgoById throws 400 when id not provided', async () => {
    // @ts-ignore allow calling with undefined to trigger validation
    await expect(service.getNgoById(undefined)).rejects.toMatchObject({ statusCode: 400, message: 'NGO ID is required' });
  });

  test('getNgoById throws 404 when not found', async () => {
    jest.spyOn(NgoRepository.prototype, 'getNgoById').mockResolvedValueOnce(null as any);
    await expect(service.getNgoById('missing')).rejects.toMatchObject({ statusCode: 404, message: 'NGO not found' });
  });

  test('getNgoById returns ngo when found', async () => {
    const ngo = { _id: 'n1', name: 'Found' } as any;
    jest.spyOn(NgoRepository.prototype, 'getNgoById').mockResolvedValueOnce(ngo);
    await expect(service.getNgoById('n1')).resolves.toEqual(ngo);
  });
});
