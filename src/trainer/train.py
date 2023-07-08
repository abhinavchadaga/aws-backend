import json
import sys
import time
from typing import Literal, Union

import zmq
from pydantic import BaseModel


class Progress(BaseModel):
    epochsComplete: int
    trainingLoss: Union[float, None]
    validationLoss: Union[float, None]
    status: Literal["training", "complete", "error", "not started"]


def send_progress():
    global socket, progress
    socket.send_string(progress.json())


def train():
    global progress
    for i in range(1, 10):
        progress.epochsComplete = i
        send_progress()
        time.sleep(1)


def main():
    global socket, progress
    context = zmq.Context()
    socket = context.socket(zmq.PUSH)
    socket.bind("tcp://127.0.0.1:8080")

    input_data = json.loads(sys.stdin.read())
    progress = Progress(**input_data)

    send_progress()
    progress.status = "training"
    send_progress()

    train()

    progress.status = "complete"
    send_progress()


if __name__ == "__main__":
    main()
