import express from 'express';
import { trainingConfig } from '../index.js';
import { TrainingConfig } from '../types.js';
import { Request, Response } from 'express';

const router = express.Router();

router.post('/', (req: Request, res: Response) => {
  if (TrainingConfig.guard(req.body)) {
    const { modelArch, numEpochs, learningRate } = req.body;
    trainingConfig.modelArch = modelArch;
    trainingConfig.numEpochs = numEpochs;
    trainingConfig.learningRate = learningRate;
    res.json({
      message: 'Training config updated',
      trainingConfig,
    });
    return;
  } else {
    res.status(400).send('Invalid training config');
    return;
  }
});

export default router;
