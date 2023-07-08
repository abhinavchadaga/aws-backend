import express from 'express';
import cors from 'cors';
import trainRouter from './routes/train.js';
import datasetRouter from './routes/dataset.js';
import setupTrainSock from './createTrainSock.js';
import { TrainingProgress } from './types.js';
import { createUploadFolder } from './routes/dataset.js';

export const progress: TrainingProgress = {
  epochsComplete: 0,
  trainingLoss: null,
  validationLoss: null,
  status: 'not started',
};

setupTrainSock();

const expressPort = 3000;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(createUploadFolder);
app.use('/dataset', datasetRouter);
app.use('/train', trainRouter);

app.listen(expressPort, () => console.log(`Listening on port ${expressPort}`));
