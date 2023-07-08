import express from 'express';
import { spawn } from 'child_process';
import { progress } from './index.js';

const router = express.Router();

router.get('/start', (req, res) => {
  const pythonPath = '/Users/abhinavchadaga/miniforge3/envs/py39/bin/python3';
  const scriptPath = './src/train.py';
  const trainingProgress = spawn(pythonPath, [scriptPath]);

  trainingProgress.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });

  trainingProgress.stdin.write(JSON.stringify(progress));
  trainingProgress.stdin.end();

  res.status(203).send('Training started');
});

router.get('/status', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.write(':ok\n\n');

  const interval = setInterval(() => {
    if (progress.status === 'complete') {
      clearInterval(interval);
      res.write('data: complete\n\n');
      res.end();
      return;
    }
    res.write(`data: ${JSON.stringify(progress)}\n\n`);
  }, 1000);
});

export default router;
