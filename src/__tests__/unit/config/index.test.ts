describe('config/index.ts environment logic', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // clear module cache
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  // helper to load config with dotenv mocked
  function loadConfig(): any {
    jest.mock('dotenv', () => ({ config: jest.fn() }));
    // require inside isolateModules to ensure mock applies
    let cfg: any;
    jest.isolateModules(() => {
      cfg = require('../../../config/index');
    });
    return cfg;
  }

  test('PORT uses default when not provided', () => {
    delete process.env.PORT;
    const config = loadConfig();
    expect(config.PORT).toBe(5050);
  });

  test('PORT parses numeric env value', () => {
    process.env.PORT = '1234';
    const config = loadConfig();
    expect(config.PORT).toBe(1234);
  });

  test('MONGODB_URI falls back to localhost when undefined', () => {
    delete process.env.MONGODB_URI;
    const config = loadConfig();
    expect(config.MONGODB_URI).toContain('mongodb://localhost');
  });

  test('MONGODB_URI uses provided environment value', () => {
    process.env.MONGODB_URI = 'mongo://example';
    const config = loadConfig();
    expect(config.MONGODB_URI).toBe('mongo://example');
  });

  test('JWT_SECRET falls back to default when missing', () => {
    delete process.env.JWT_SECRET;
    const config = loadConfig();
    expect(config.JWT_SECRET).toBe('default_secret');
  });

  test('JWT_SECRET reads custom value', () => {
    process.env.JWT_SECRET = 'super';
    const config = loadConfig();
    expect(config.JWT_SECRET).toBe('super');
  });
});