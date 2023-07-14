import { TrainingConfig, TrainingProgress } from './types.js';
import datasetRouter, { createUploadFolder } from './routes/dataset.js';

import EventEmitter from 'node:events';
import configureModelRouter from './routes/configureTraining.js';
import cors from 'cors';
import downloadModelRouter from './routes/downloadModel.js';
import express from 'express';
import setupTrainSock from './createTrainSock.js';
import trainRouter from './routes/train.js';

export const progress: TrainingProgress = {
  stepsComplete: 0,
  maxSteps: 0,
  trainingLoss: null,
  validationLoss: null,
  status: 'not started',
};

export const trainingConfig: TrainingConfig = {
  modelArch: 'not configured',
  maxEpochs: '0',
  learningRate: '0.0',
};

export const trainingUpdateReceived = new EventEmitter();

setupTrainSock();

const expressPort = 3000;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(createUploadFolder);
app.get('/', (req, res) => res.send('Hello World!'));
app.use('/dataset', datasetRouter);
app.use('/configure-training', configureModelRouter);
app.use('/train', trainRouter);
app.use('/download-model', downloadModelRouter);

app.listen(expressPort, () => console.log(`Listening on port ${expressPort}`));
