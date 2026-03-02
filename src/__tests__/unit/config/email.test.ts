describe('email config', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.EMAIL_USER = 'me@gmail.com';
    process.env.EMAIL_PASS = 'secret';
  });

  test('createTransport is called with gmail and auth from env and sendEmail calls sendMail', async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: '1' });
    const createTransport = jest.fn(() => ({ sendMail }));

    jest.mock('nodemailer', () => ({ createTransport }));

    // require after mocking
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const email = require('../../../config/email');

    expect(createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: { user: 'me@gmail.com', pass: 'secret' },
    });

    await email.sendEmail('you@gmail.com', 'subj', '<b>hi</b>');

    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'you@gmail.com',
      subject: 'subj',
      html: '<b>hi</b>',
    }));
  });
});
