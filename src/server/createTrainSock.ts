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
    progress.epochsComplete = data.epochsComplete;
    progress.trainingLoss = data.trainingLoss == null ? Infinity : data.trainingLoss;
    progress.validationLoss = data.validationLoss == null ? Infinity : data.validationLoss;
    progress.status = data.status;
    console.log(progress);
  });
}

export default setupSocket;
