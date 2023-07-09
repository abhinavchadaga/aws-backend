import zmq from 'zeromq';
import { progress } from './index.js';
import { TrainingProgress } from './types.js';

function setupSocket() {
  const sock = zmq.socket('pull');
  const port = 8080;
  sock.connect(`tcp://127.0.0.1:${port}`);
  console.log(`Consumer connected to port ${port}`);

  sock.on('message', (msg: string) => {
    const data = JSON.parse(msg) as TrainingProgress;
    progress.stepsComplete = data.stepsComplete;
    progress.maxSteps = data.maxSteps;
    progress.trainingLoss = data.trainingLoss;
    progress.validationLoss = data.validationLoss;
    progress.status = data.status;
    console.log(progress);
  });
}

export default setupSocket;
