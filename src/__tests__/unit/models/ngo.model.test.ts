import { NgoModel } from '../../../models/ngo.model';

describe('NgoModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('validates successfully with required fields', () => {
    const data = {
      name: 'Helping Hands',
      registrationNumber: '001234',
      contactPerson: 'Aruna Guragain',
      phone: '9800000000',
      email: 'ngo@gmail.com',
      address: 'Kathmandu',
      focusAreas: ['education', 'health'],
      photo: 'logo.png',
    } as any;

    const doc = new NgoModel(data);
    const err = doc.validateSync();

    expect(err).toBeUndefined();
    expect(doc.name).toBe('Helping Hands');
    expect(doc.registrationNumber).toBe('001234');
    expect(doc.focusAreas).toEqual(['education', 'health']);
  });

  test('throws validation errors when required fields are missing', () => {
    const doc = new NgoModel({} as any);
    const err = doc.validateSync();

    expect(err).toBeDefined();
    const errors = err!.errors;
    expect(errors['name']).toBeDefined();
    expect(errors['registrationNumber']).toBeDefined();
    expect(errors['contactPerson']).toBeDefined();
    expect(errors['phone']).toBeDefined();
    expect(errors['email']).toBeDefined();
    expect(errors['address']).toBeDefined();
  });

  test('trims string fields on set', () => {
    const doc = new NgoModel({
      name: '  Helping Hands  ',
      registrationNumber: ' 001234 ',
      contactPerson: ' Aruna Guragain ',
      phone: ' 9800000000 ',
      email: ' ngo@gmail.com ',
      address: ' Kathmandu ',
    } as any);

    // Mongoose applies `trim` when casting values on set
    expect(doc.name).toBe('Helping Hands');
    expect(doc.registrationNumber).toBe('001234');
    expect(doc.contactPerson).toBe('Aruna Guragain');
    expect(doc.phone).toBe('9800000000');
    expect(doc.email).toBe('ngo@gmail.com');
    expect(doc.address).toBe('Kathmandu');
  });

  test('focusAreas accepts and trims array entries', () => {
    const doc = new NgoModel({
      name: 'NGO',
      registrationNumber: 'R2',
      contactPerson: 'CP',
      phone: '9800000001',
      email: 'a@gmail.com',
      address: 'addr',
      focusAreas: [' education ', 'health'],
    } as any);

    expect(doc.focusAreas).toEqual(['education', 'health']);
  });

  test('photo is optional', () => {
    const doc = new NgoModel({
      name: 'NGO',
      registrationNumber: 'R3',
      contactPerson: 'CP',
      phone: '9800000002',
      email: 'b@gmail.com',
      address: 'addr',
    } as any);

    const err = doc.validateSync();
    expect(err).toBeUndefined();
    expect(doc.photo).toBeUndefined();
  });
});