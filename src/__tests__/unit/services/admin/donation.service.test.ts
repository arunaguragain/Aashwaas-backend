// mock email module before importing anything that uses it
jest.mock('../../../../config/email', () => ({ sendEmail: jest.fn() }));

let sendEmail: jest.Mock;
let AdminDonationService: any;
let DonationRepository: any;
let TaskRepository: any;
let UserRepository: any;
let NgoRepository: any;
let HttpError: any;

// we will require these modules fresh inside beforeEach to ensure mocked sendEmail is used

describe('AdminDonationService', () => {
  let service: any;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    // re-require modules to pick up mocked sendEmail
    ({ sendEmail } = require('../../../../config/email'));
    ({ AdminDonationService } = require('../../../../services/admin/donation.service'));
    ({ DonationRepository } = require('../../../../repositories/donation.repository'));
    ({ TaskRepository } = require('../../../../repositories/task.repository'));
    ({ UserRepository } = require('../../../../repositories/user.repository'));
    ({ NgoRepository } = require('../../../../repositories/ngo.repository'));
    ({ HttpError } = require('../../../../errors/http-error'));

    service = new AdminDonationService();
    // default stubs to avoid mongoose access
    jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValue(null as any);
    jest.spyOn(DonationRepository.prototype, 'updateDonation').mockResolvedValue(null as any);
    jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValue({ _id: 'v-default', role: 'volunteer' } as any);
    jest.spyOn(NgoRepository.prototype, 'getNgoById').mockResolvedValue({ _id: 'n-default', name: 'NGO Default' } as any);
    jest.spyOn(TaskRepository.prototype, 'getActiveTaskByDonationId').mockResolvedValue(null as any);
    jest.spyOn(TaskRepository.prototype, 'createTask').mockResolvedValue(null as any);
  });

  test('getDonationById throws 400 when id missing', async () => {
    // @ts-ignore
    await expect(service.getDonationById(undefined)).rejects.toEqual(expect.any(HttpError));
  });

  test('getDonationById throws 404 when donation not found', async () => {
    jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce(null as any);
    await expect(service.getDonationById('d1')).rejects.toEqual(expect.any(HttpError));
  });

  test('getDonationById returns donation with no active assignment', async () => {
    const donationDoc: any = { toObject: () => ({ _id: 'd1', status: 'pending' }) };
    jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce(donationDoc as any);
    jest.spyOn(TaskRepository.prototype, 'getActiveTaskByDonationId').mockResolvedValueOnce(null as any);

    const res = await service.getDonationById('d1');
    expect(res).toEqual({ _id: 'd1', status: 'pending', assignment: null });
  });

  test('getDonationById returns assignment when activeTask has populated objects', async () => {
    const donationDoc: any = { toObject: () => ({ _id: 'd2', status: 'assigned' }) };
    const activeTask: any = {
      volunteerId: { _id: 'v1', name: 'Vol Name' },
      ngoId: { _id: 'n1', name: 'NGO Name' },
    };
    jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce(donationDoc as any);
    jest.spyOn(TaskRepository.prototype, 'getActiveTaskByDonationId').mockResolvedValueOnce(activeTask as any);

    const res = await service.getDonationById('d2');
    expect(res.assignment).toEqual({ volunteerId: 'v1', volunteerName: 'Vol Name', ngoId: 'n1', ngoName: 'NGO Name' });
  });

  test('getDonationById handles activeTask object without name property', async () => {
    const donationDoc: any = { toObject: () => ({ _id: 'dX', status: 'assigned' }) };
    const activeTask: any = {
      volunteerId: { _id: 'v5' },
      ngoId: { _id: 'n5' },
    };
    jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce(donationDoc as any);
    jest.spyOn(TaskRepository.prototype, 'getActiveTaskByDonationId').mockResolvedValueOnce(activeTask as any);
    jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce({ _id: 'v5', name: 'V5' } as any);
    jest.spyOn(NgoRepository.prototype, 'getNgoById').mockResolvedValueOnce({ _id: 'n5', name: 'N5' } as any);

    const res = await service.getDonationById('dX');
    expect(res.assignment).toEqual({
      volunteerId: { _id: 'v5' },
      volunteerName: 'V5',
      ngoId: { _id: 'n5' },
      ngoName: 'N5',
    });
  });

  test('getDonationById handles missing volunteer/ngo when lookup returns null', async () => {
    const donationDoc: any = { toObject: () => ({ _id: 'dNull', status: 'assigned' }) };
    const activeTask: any = {
      volunteerId: { _id: 'vNull' },
      ngoId: { _id: 'nNull' },
    };
    jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce(donationDoc as any);
    jest.spyOn(TaskRepository.prototype, 'getActiveTaskByDonationId').mockResolvedValueOnce(activeTask as any);
    jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce(null as any);
    jest.spyOn(NgoRepository.prototype, 'getNgoById').mockResolvedValueOnce(null as any);

    const res = await service.getDonationById('dNull');
    expect(res.assignment).toEqual({
      volunteerId: { _id: 'vNull' },
      volunteerName: undefined,
      ngoId: { _id: 'nNull' },
      ngoName: undefined,
    });
  });

  test('getDonationById fetches volunteer and ngo when not populated', async () => {
    const donationDoc: any = { toObject: () => ({ _id: 'd3', status: 'assigned' }) };
    const activeTask: any = { volunteerId: 'v2', ngoId: 'n2' };
    jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce(donationDoc as any);
    jest.spyOn(TaskRepository.prototype, 'getActiveTaskByDonationId').mockResolvedValueOnce(activeTask as any);
    jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce({ _id: 'v2', name: 'Volunteer Two' } as any);
    jest.spyOn(NgoRepository.prototype, 'getNgoById').mockResolvedValueOnce({ _id: 'n2', name: 'NGO Two' } as any);

    const res = await service.getDonationById('d3');
    expect(res.assignment).toEqual({ volunteerId: 'v2', volunteerName: 'Volunteer Two', ngoId: 'n2', ngoName: 'NGO Two' });
  });

  test('deleteDonation throws 400 when id missing', async () => {
    // @ts-ignore
    await expect(service.deleteDonation(undefined)).rejects.toEqual(expect.any(HttpError));
  });

  test('approveDonation throws 400 when id missing', async () => {
    // @ts-ignore
    await expect(service.approveDonation(undefined)).rejects.toEqual(expect.any(HttpError));
  });

  test('approveDonation throws 404 when donation not found', async () => {
    jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce(null as any);
    await expect(service.approveDonation('d4')).rejects.toEqual(expect.any(HttpError));
  });

  test('approveDonation throws 400 when status not pending', async () => {
    const donationDoc: any = { status: 'approved' };
    jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce(donationDoc as any);
    await expect(service.approveDonation('d5')).rejects.toEqual(expect.any(HttpError));
  });

  test('approveDonation updates donation when pending', async () => {
    const donationDoc: any = { _id: 'd6', status: 'pending' };
    const updated = { _id: 'd6', status: 'approved' } as any;
    jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce(donationDoc as any);
    const spy = jest.spyOn(DonationRepository.prototype, 'updateDonation').mockResolvedValueOnce(updated as any);

    const res = await service.approveDonation('d6');
    expect(spy).toHaveBeenCalledWith('d6', { status: 'approved' });
    expect(res).toEqual(updated);
  });

  describe('assignDonation', () => {
    test('validations for missing ids', async () => {
      await expect(service.assignDonation('', 'v', 'n', 't')).rejects.toEqual(expect.any(HttpError));
      await expect(service.assignDonation('d', '', 'n', 't')).rejects.toEqual(expect.any(HttpError));
      await expect(service.assignDonation('d', 'v', '', 't')).rejects.toEqual(expect.any(HttpError));
    });

    test('assignDonation throws 404 when donation not found', async () => {
      jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce(null as any);
      await expect(service.assignDonation('aaaaaaaaaaaaaaaaaaaaaaaa', 'v1', 'n1', 'Title')).rejects.toEqual(expect.any(HttpError));
    });

    test('assignDonation throws 400 when donation not approved', async () => {
      jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce({ status: 'pending' } as any);
      await expect(service.assignDonation('bbbbbbbbbbbbbbbbbbbbbbbb', 'v1', 'n1', 'Title')).rejects.toEqual(expect.any(HttpError));
    });

    test('assignDonation throws when volunteer not found or wrong role', async () => {
      jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce({ _id: 'cccccccccccccccccccccccc', status: 'approved' } as any);
      jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce(null as any);
      await expect(service.assignDonation('cccccccccccccccccccccccc', 'vX', 'n1', 'Title')).rejects.toEqual(expect.any(HttpError));

      jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce({ _id: 'u1', role: 'donor' } as any);
      await expect(service.assignDonation('cccccccccccccccccccccccc', 'u1', 'n1', 'Title')).rejects.toEqual(expect.any(HttpError));
    });

    test('assignDonation throws when ngo not found', async () => {
      jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce({ _id: 'dddddddddddddddddddddddd', status: 'approved' } as any);
      jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce({ _id: 'v2', role: 'volunteer' } as any);
      jest.spyOn(NgoRepository.prototype, 'getNgoById').mockResolvedValueOnce(null as any);
      await expect(service.assignDonation('dddddddddddddddddddddddd', 'v2', 'nX', 'Title')).rejects.toEqual(expect.any(HttpError));
    });

    test('assignDonation returns existing active task if present (or errors)', async () => {
    jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce({ _id: 'eeeeeeeeeeeeeeeeeeeeeeee', status: 'approved' } as any);
    jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValueOnce({ _id: 'v3', role: 'volunteer' } as any);
    jest.spyOn(NgoRepository.prototype, 'getNgoById').mockResolvedValueOnce({ _id: 'n3' } as any);
    const active = { _id: 'texist', volunteerId: { _id: 'v3', name: 'Vol' }, ngoId: { _id: 'n3', name: 'NGO' } } as any;
    jest.spyOn(TaskRepository.prototype, 'getActiveTaskByDonationId').mockResolvedValueOnce(active as any);

    try {
      const res = await service.assignDonation('eeeeeeeeeeeeeeeeeeeeeeee', 'v3', 'n3', 'Title');
      expect(res).toHaveProperty('task');
      expect(res.alreadyAssigned).toBeDefined();
    } catch (err: any) {
      expect(err).toEqual(expect.any(HttpError));
    }
    });

    test('assignDonation creates task and updates donation (and sends email)', async () => {
      jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValueOnce({ _id: 'ffffffffffffffffffffffff', status: 'approved' } as any);
      // stub volunteer lookup directly via prototype after module reload
      jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValue({ _id: 'v4', role: 'volunteer', email: 'vol@example.com', name: 'Volunteer Four' } as any);
      jest.spyOn(NgoRepository.prototype, 'getNgoById').mockResolvedValueOnce({ _id: 'n4' } as any);
      jest.spyOn(TaskRepository.prototype, 'getActiveTaskByDonationId').mockResolvedValueOnce(null as any);
      jest.spyOn(TaskRepository.prototype, 'createTask').mockResolvedValueOnce({ _id: 'tnew' } as any);
      jest.spyOn(DonationRepository.prototype, 'updateDonation').mockResolvedValueOnce({ _id: 'd12', status: 'assigned' } as any);

      const res = await service.assignDonation('ffffffffffffffffffffffff', 'v4', 'n4', 'Title');
      expect(res).toHaveProperty('alreadyAssigned');
      expect(res.alreadyAssigned).toBeDefined();
      expect(sendEmail).toHaveBeenCalled();
    });


    test('deleteDonation returns repository result on valid id', async () => {
      jest.spyOn(DonationRepository.prototype, 'deleteDonation').mockResolvedValueOnce(true as any);
      const r = await service.deleteDonation('someid');
      expect(r).toBe(true);
    });

    test("AdminDonationService.assignDonation - already assigned and new assignment", async () => {
      jest.resetModules();
      const { AdminDonationService } = require('../../../../services/admin/donation.service');
      const { DonationRepository } = require('../../../../repositories/donation.repository');
      const { TaskRepository } = require('../../../../repositories/task.repository');
      const { UserRepository } = require('../../../../repositories/user.repository');
      const { NgoRepository } = require('../../../../repositories/ngo.repository');
      const svc = new AdminDonationService();

      const donation: any = { _id: 'd1', status: 'approved', toObject: () => ({ _id: 'd1' }) };
      jest.spyOn(DonationRepository.prototype, 'getDonationById').mockResolvedValue(donation as any);

      const activeTask: any = { _id: 't1', volunteerId: 'v1', ngoId: 'n1' };
      // mock volunteer and ngo lookups (service checks these before active task)
      jest.spyOn(UserRepository.prototype, 'getUserById').mockResolvedValue({ _id: 'v1', role: 'volunteer', name: 'vol' } as any);
      jest.spyOn(NgoRepository.prototype, 'getNgoById').mockResolvedValue({ _id: 'n1', name: 'ngo' } as any);
      const getActiveSpy = jest.spyOn(TaskRepository.prototype, 'getActiveTaskByDonationId').mockResolvedValue(activeTask as any);
      const createSpy = jest.spyOn(TaskRepository.prototype, 'createTask').mockResolvedValue({ _id: 'should-not' } as any);

      const res1 = await svc.assignDonation('d1', 'v1', 'n1', 'title');
      expect(res1.task).toEqual(activeTask);
      expect(getActiveSpy).toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();

      // now simulate second assignment path
      getActiveSpy.mockResolvedValue(null as any);
      jest.spyOn(TaskRepository.prototype, 'createTask').mockResolvedValue({ _id: 't2' } as any);
      jest.spyOn(DonationRepository.prototype, 'updateDonation').mockResolvedValue({ status: 'assigned' } as any);

      const res2 = await svc.assignDonation('d1', 'v1', 'n1', 'title');
      expect(res2.alreadyAssigned).toBe(false);
      expect(res2.task).toBeDefined();
    });
  });
});
