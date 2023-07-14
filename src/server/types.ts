import { Literal, Record, Static, Union, String } from 'runtypes';

type TrainingStatus =
  | 'not started'
  | 'started'
  | 'training'
  | 'validating'
  | 'complete'
  | 'error';

export interface TrainingProgress {
  stepsComplete: number;
  maxSteps: number;
  trainingLoss: number | null;
  validationLoss: number | null;
  status: TrainingStatus;
}

const ModelArch = Union(
  Literal('alexnet'),
  Literal('resnet'),
  Literal('vgg'),
  Literal('not configured'),
);

export const TrainingConfig = Record({
  modelArch: ModelArch,
  maxEpochs: String.withConstraint((s) => !isNaN(Number(s)) && Number(s) > 0),
  learningRate: String.withConstraint(
    (s) => !isNaN(Number(s)) && Number(s) > 0,
  ),
});

export type TrainingConfig = Static<typeof TrainingConfig>;
