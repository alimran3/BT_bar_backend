const QRCode = require('qrcode');

const generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#8B5CF6',
        light: '#FFFFFF',
      },
      width: 300,
    });

    return qrCodeDataURL;
  } catch (error) {
    throw new Error('Error generating QR code: ' + error.message);
  }
};

const generateQRCodeBuffer = async (data) => {
  try {
    const buffer = await QRCode.toBuffer(data, {
      errorCorrectionLevel: 'H',
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#8B5CF6',
        light: '#FFFFFF',
      },
      width: 300,
    });

    return buffer;
  } catch (error) {
    throw new Error('Error generating QR code buffer: ' + error.message);
  }
};

module.exports = { generateQRCode, generateQRCodeBuffer };