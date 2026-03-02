
jest.mock('mongoose', () => ({ connect: jest.fn() }));

let mongoose: any;

describe('connectDatabase', () => {
  const OLD_ENV = process.env;
  let connectDatabase: () => Promise<void>;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, MONGODB_URI: 'mongodb://test-uri' } as NodeJS.ProcessEnv;
    // require after reset so the mocked mongoose is used by the module
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    connectDatabase = require('../../../database/mongodb').connectDatabase;
    // require mongoose after mocking
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    mongoose = require('mongoose');
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.clearAllMocks();
  });

  test('connects successfully', async () => {
    (mongoose.connect as jest.Mock).mockResolvedValueOnce(undefined);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await connectDatabase();

    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://test-uri');
    expect(logSpy).toHaveBeenCalledWith('Connected to MongoDB');

    logSpy.mockRestore();
  });

  test('handles connection error and exits', async () => {
    const err = new Error('fail');
    (mongoose.connect as jest.Mock).mockRejectedValueOnce(err);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => { throw new Error('process.exit called'); }) as any);

    await expect(connectDatabase()).rejects.toThrow('process.exit called');

    expect(errorSpy).toHaveBeenCalledWith('Database Error:', err);
    expect(exitSpy).toHaveBeenCalledWith(1);

    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
