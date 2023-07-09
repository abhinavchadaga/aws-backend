import express from 'express';
import cors from 'cors';
import trainRouter from './routes/train.js';
import datasetRouter from './routes/dataset.js';
import configureModelRouter from './routes/configureTraining.js';
import downloadModelRouter from './routes/downloadModel.js';
import setupTrainSock from './createTrainSock.js';
import { TrainingConfig, TrainingProgress } from './types.js';
import { createUploadFolder } from './routes/dataset.js';

export const progress: TrainingProgress = {
  stepsComplete: 0,
  maxSteps: 0,
  trainingLoss: null,
  validationLoss: null,
  status: 'not started',
};

export const trainingConfig: TrainingConfig = {
  modelArch: 'not configured',
  numEpochs: '0',
  learningRate: '0.0',
};

setupTrainSock();

const expressPort = 3000;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(createUploadFolder);
app.use('/dataset', datasetRouter);
app.use('/configure-training', configureModelRouter);
app.use('/train', trainRouter);
app.use('/download-model', downloadModelRouter);

app.listen(expressPort, () => console.log(`Listening on port ${expressPort}`));
