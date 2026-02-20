import { Router } from 'express';

// Mock middlewares and controller before importing the router
jest.mock('../../../middlewares/authorization.middleware', () => ({
  authorizedMiddleware: (req: any, res: any, next: any) => next(),
}));

jest.mock('../../../middlewares/upload.middleware', () => ({
  uploads: {
    single: () => (req: any, res: any, next: any) => next(),
    fields: () => (req: any, res: any, next: any) => next(),
  },
}));

jest.mock('../../../controllers/donation.controller', () => ({
  DonationController: jest.fn().mockImplementation(() => ({
    uploadPhoto: jest.fn(),
    createDonation: jest.fn(),
    getAllDonations: jest.fn(),
    getMyDonations: jest.fn(),
    getDonationsByDonorId: jest.fn(),
    getDonationById: jest.fn(),
    updateDonation: jest.fn(),
    deleteDonation: jest.fn(),
  })),
}));

describe('Donation routes', () => {
  let router: Router & any;

  beforeAll(() => {
    // require after mocks so the module picks up the mocked dependencies
    router = require('../../../routes/donation.route').default;
  });

  test('registers expected routes', () => {
    const routeLayers = router.stack.filter((l: any) => l.route);

    function hasRoute(path: string, method: string) {
      return routeLayers.some((layer: any) => layer.route.path === path && layer.route.methods[method]);
    }

    expect(hasRoute('/upload-photo', 'post')).toBe(true);
    expect(hasRoute('/', 'post')).toBe(true);
    expect(hasRoute('/', 'get')).toBe(true);
    expect(hasRoute('/my', 'get')).toBe(true);
    expect(hasRoute('/donor/:donorId', 'get')).toBe(true);
    expect(hasRoute('/:id', 'get')).toBe(true);
    expect(hasRoute('/:id', 'put')).toBe(true);
    expect(hasRoute('/:id', 'delete')).toBe(true);
  });

  test('applies authorization middleware', () => {
    const nonRouteLayers = router.stack.filter((l: any) => !l.route);
    // router.use should have added at least one non-route layer (the auth middleware)
    expect(nonRouteLayers.length).toBeGreaterThanOrEqual(1);
  });
});
