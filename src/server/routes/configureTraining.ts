import express from 'express';
import { trainingConfig } from '../index.js';
import { TrainingConfig } from '../types.js';
import { Request, Response } from 'express';

const router = express.Router();

router.post('/', (req: Request, res: Response) => {
  if (TrainingConfig.guard(req.body)) {
    const { modelArch, maxEpochs, learningRate } = req.body;
    trainingConfig.modelArch = modelArch;
    trainingConfig.maxEpochs = maxEpochs;
    trainingConfig.learningRate = learningRate;
    res.json({
      message: 'Training config updated',
      trainingConfig,
    });
    return;
  } else {
    res.status(400).json({ message: 'Invalid training config' });
    return;
  }
});

export default router;
