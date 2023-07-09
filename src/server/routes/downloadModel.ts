import fs from 'fs';
import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  const modelFilePath = './trained_model/model.pth';

  if (!fs.existsSync(modelFilePath)) {
    res.status(404).send('No trained model');
    return;
  }

  const stream = fs.createReadStream(modelFilePath);
  stream.on('error', (error) => {
    console.error(error);
    res.status(500).send('Error sending model');
  });

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename=model.pth');
  stream.pipe(res);
});

export default router;
