describe('upload middleware (fileFilter paths)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('initialization creates uploads directory when missing', () => {
    // reset modules so that the top-level fs logic runs again
    jest.resetModules();
    const fs = require('fs');
    const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const mkdirSpy = jest.spyOn(fs, 'mkdirSync');

    // requiring after mocks triggers the module's initialization code
    const uploads = require('../../../middlewares/upload.middleware').uploads;
    expect(mkdirSpy).toHaveBeenCalledWith(expect.stringContaining('uploads'), { recursive: true });
    expect(uploads).toBeDefined();

    // cleanup: restore spies so subsequent tests are unaffected
    existsSpy.mockRestore();
    mkdirSpy.mockRestore();
  });

  test('rejects non-image mimetype', async () => {
    jest.mock('multer', () => {
      const factory = (opts: any) => ({
        single: () => (req: any, res: any, next: any) => {
        const file = req.file;
        if (!file) return next();
        if (opts.fileFilter) {
          let called = false;
          const cb = (err: any, ok?: boolean) => {
            called = true;
            if (err) return next(err);
            req.file = file;
            return next();
          };
          opts.fileFilter(req, file, cb);
          if (!called) return next();
        } else next();
      },
      });
      (factory as any).diskStorage = (opts: any) => opts;
      return factory;
    });

    // require after mocking
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const uploads = require('../../../middlewares/upload.middleware').uploads;
    const mw = uploads.single('image');

    const req: any = { file: { originalname: 'file.txt', mimetype: 'text/plain', fieldname: 'image' } };
    const next = jest.fn((err?: any) => err);

    mw(req, {} as any, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Only image files are allowed!');
  });

  test('accepts image mimetype and attaches file', async () => {
    jest.mock('multer', () => {
      const factory = (opts: any) => ({
        single: () => (req: any, res: any, next: any) => {
        const file = req.file;
        if (!file) return next();
        if (opts.fileFilter) {
          let called = false;
          const cb = (err: any, ok?: boolean) => {
            called = true;
            if (err) return next(err);
            req.file = file;
            return next();
          };
          opts.fileFilter(req, file, cb);
          if (!called) return next();
        } else next();
      },
      });
      (factory as any).diskStorage = (opts: any) => opts;
      return factory;
    });

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const uploads = require('../../../middlewares/upload.middleware').uploads;
    const mw = uploads.single('image');

    const req: any = { file: { originalname: 'image.png', mimetype: 'image/png', fieldname: 'image' } };
    const next = jest.fn();

    mw(req, {} as any, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.file).toBeDefined();
    expect(req.file.originalname).toBe('image.png');
  });

  test('no file present calls next without error', async () => {
    jest.mock('multer', () => {
      const factory = (opts: any) => ({
        single: () => (req: any, res: any, next: any) => {
        const file = req.file;
        if (!file) return next();
        if (opts.fileFilter) {
          let called = false;
          const cb = (err: any, ok?: boolean) => {
            called = true;
            if (err) return next(err);
            req.file = file;
            return next();
          };
          opts.fileFilter(req, file, cb);
          if (!called) return next();
        } else next();
      },
      });
      (factory as any).diskStorage = (opts: any) => opts;
      return factory;
    });

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const uploads = require('../../../middlewares/upload.middleware').uploads;
    const mw = uploads.single('image');

    const req: any = {}; // no file
    const next = jest.fn();

    mw(req, {} as any, next);

    expect(next).toHaveBeenCalledWith();
  });

  test('storage destination and filename preserve extension and fieldname', async () => {
    let capturedOpts: any = null;
    jest.mock('multer', () => {
      const factory = (opts: any) => ({
        single: () => (req: any, res: any, next: any) => next(),
      });
      (factory as any).diskStorage = (opts: any) => {
        capturedOpts = opts;
        return opts;
      };
      return factory;
    });

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const uploads = require('../../../middlewares/upload.middleware').uploads;
    expect(uploads).toBeDefined();

    // capturedOpts should have been set by mocked diskStorage
    expect(capturedOpts).not.toBeNull();
    // destination should be a function that calls back with a path containing 'uploads'
    const destCb = jest.fn();
    capturedOpts.destination({}, {} as any, destCb);
    expect(destCb).toHaveBeenCalled();
    const destArg = destCb.mock.calls[0][1];
    expect(typeof destArg).toBe('string');
    expect(destArg).toMatch(/uploads$/);

    // filename should preserve original extension and prefix with fieldname-
    const fakeFile = { originalname: 'photo.JPG', fieldname: 'avatar' };
    const nameCb = jest.fn();
    capturedOpts.filename({}, fakeFile, nameCb);
    expect(nameCb).toHaveBeenCalled();
    const generated = nameCb.mock.calls[0][1];
    expect(typeof generated).toBe('string');
    // extension should be lower/upper preserved from originalname (keep extension)
    expect(generated).toMatch(/^avatar-[\w-]+\.JPG$/);
  });

  test('multer options include limits and fileFilter', async () => {
    let capturedOpts: any = null;
    jest.mock('multer', () => {
      const factory = (opts: any) => {
        capturedOpts = opts;
        return {
          single: () => (req: any, res: any, next: any) => next(),
          array: () => (req: any, res: any, next: any) => next(),
          fields: () => (req: any, res: any, next: any) => next(),
        };
      };
      (factory as any).diskStorage = (opts: any) => opts;
      return factory;
    });

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const uploads = require('../../../middlewares/upload.middleware').uploads;
    expect(uploads).toBeDefined();
    expect(capturedOpts).not.toBeNull();
    // limits.fileSize should be 5 MB
    expect(capturedOpts.limits).toBeDefined();
    expect(capturedOpts.limits.fileSize).toBe(5 * 1024 * 1024);
    // fileFilter should be a function
    expect(typeof capturedOpts.fileFilter).toBe('function');
  });

  test('exports array and fields helpers', async () => {
    jest.mock('multer', () => {
      const factory = (opts: any) => ({
        single: () => (req: any, res: any, next: any) => next(),
        array: () => (req: any, res: any, next: any) => next(),
        fields: () => (req: any, res: any, next: any) => next(),
      });
      (factory as any).diskStorage = (opts: any) => opts;
      return factory;
    });

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const uploads = require('../../../middlewares/upload.middleware').uploads;

    expect(typeof uploads.array).toBe('function');
    expect(typeof uploads.fields).toBe('function');
    // ensure calling them returns a middleware function
    const arrMw = uploads.array('photos', 3);
    const fieldsMw = uploads.fields([{ name: 'photos', maxCount: 3 }]);
    expect(typeof arrMw).toBe('function');
    expect(typeof fieldsMw).toBe('function');
  });
});
