type TrainingStatus = 'training' | 'complete' | 'error' | 'not started';

export interface TrainingProgress {
  epochsComplete: number;
  trainingLoss: number | null;
  validationLoss: number | null;
  status: TrainingStatus;
}
