import express from 'express';
import trainRouter from './train.js';
import setupTrainSock from './createTrainSock.js';
import { TrainingProgress } from './types.js';

export const progress: TrainingProgress = {
  epochsComplete: 0,
  trainingLoss: null,
  validationLoss: null,
  status: 'not started',
};

setupTrainSock();

const expressPort = 3000;
const app = express();
app.use('/train', trainRouter);
app.listen(expressPort, () => console.log(`Listening on port ${expressPort}`));
