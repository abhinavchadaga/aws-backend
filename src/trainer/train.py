from glob import glob
import json
import os
import sys
from typing import Literal, Union
import torch
from PIL import Image, UnidentifiedImageError

from torch.utils.data import random_split, DataLoader
from torchvision.datasets import ImageFolder
from torchvision.models import (
    alexnet,
    AlexNet_Weights,
    resnet50,
    ResNet50_Weights,
    vgg16,
    VGG16_Weights,
)
from torchvision import transforms
from pydantic import BaseModel, Field
import zmq


class Progress(BaseModel):
    stepsComplete: int
    maxSteps: int
    trainingLoss: Union[float, None]
    validationLoss: Union[float, None]
    status: Literal["training", "validating", "complete", "error", "not started"]


class TrainingConfig(BaseModel):
    modelArch: Literal["alexnet", "resnet", "vgg"]
    maxEpochs: int = Field(..., coerce=True)
    learningRate: float = Field(..., coerce=True)


class Trainer:
    def __init__(self, config: TrainingConfig):
        context = zmq.Context()
        self.socket = context.socket(zmq.PUSH)
        self.socket.bind("tcp://127.0.0.1:8080")
        self.arch = config.modelArch
        self.max_epochs = config.maxEpochs
        self.lr = config.learningRate
        self.train_loader = None
        self.val_loader = None
        self.test_loader = None
        self.progress = Progress(
            stepsComplete=0,
            maxSteps=0,
            trainingLoss=None,
            validationLoss=None,
            status="not started",
        )

    def send_progress(self):
        self.socket.send_string(self.progress.model_dump_json())

    def _is_valid_file(self, file_path):
        try:
            img = Image.open(file_path)
            img.verify()
            return True
        except (OSError, UnidentifiedImageError):
            return False

    def create_dataloaders(self):
        img_transforms = [
            transforms.Resize(256),
            transforms.ToTensor(),
            transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225)),
        ]
        if self.arch in ["resnet", "vgg"]:
            img_transforms.insert(1, transforms.CenterCrop(224))

        img_transforms = transforms.Compose(img_transforms)
        root_dir = glob("./uploads/*")[0]
        self.dataset = ImageFolder(
            root=root_dir, transform=img_transforms, is_valid_file=self._is_valid_file
        )

        train_ratio = 0.7
        val_ratio = 0.1

        train_size = int(len(self.dataset) * train_ratio)
        val_size = int(len(self.dataset) * val_ratio)
        test_size = len(self.dataset) - train_size - val_size

        trainset, valset, testset = random_split(
            self.dataset, [train_size, val_size, test_size]
        )
        self.train_loader = DataLoader(
            trainset, batch_size=32, shuffle=True, num_workers=8
        )
        self.val_loader = DataLoader(
            valset, batch_size=32, shuffle=False, num_workers=8
        )
        self.test_loader = DataLoader(
            testset, batch_size=32, shuffle=False, num_workers=8
        )
        self.progress.maxSteps = (
            len(self.train_loader) * self.max_epochs
            + len(self.val_loader) * self.max_epochs
        )

    def train(self):
        # load model
        if self.arch == "alexnet":
            model = alexnet(weights=AlexNet_Weights.IMAGENET1K_V1, progress=True)
            for param in model.parameters():
                param.requires_grad = False
            model.classifier[6] = torch.nn.Linear(4096, len(self.dataset.classes))
        elif self.arch == "resnet":
            model = resnet50(weights=ResNet50_Weights.IMAGENET1K_V2, progress=True)
            for param in model.parameters():
                param.requires_grad = False
            model.fc = torch.nn.Linear(2048, len(self.dataset.classes))
        elif self.arch == "vgg":
            model = vgg16(weights=VGG16_Weights.IMAGENET1K_V1, progress=True)
            for param in model.parameters():
                param.requires_grad = False
            model.classifier[6] = torch.nn.Linear(4096, len(self.dataset.classes))
        else:
            raise NotImplementedError("Model not implemented")

        # basic training loop
        optimizer = torch.optim.Adam(model.parameters(), lr=self.lr)
        criterion = torch.nn.CrossEntropyLoss()
        for epoch in range(self.max_epochs):
            model.train()
            self.progress.status = "training"
            self.send_progress()
            for i, (images, labels) in enumerate(self.train_loader):
                optimizer.zero_grad()
                outputs = model(images)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()
                self.progress.trainingLoss = loss.item()
                self.progress.stepsComplete += 1
                self.send_progress()

            model.eval()
            self.progress.status = "validating"
            self.send_progress()
            with torch.no_grad():
                for i, (images, labels) in enumerate(self.val_loader):
                    outputs = model(images)
                    loss = criterion(outputs, labels)
                    self.progress.validationLoss = loss.item()
                    self.progress.stepsComplete += 1
                    self.send_progress()

        self.progress.status = "complete"
        self.send_progress()

        # save the model
        os.makedirs("./trained_model", exist_ok=True)
        torch.save(model.state_dict(), "./trained_model/model.pth")


def main():
    trainingConfig = TrainingConfig(**json.loads(sys.argv[1]))
    trainer = Trainer(config=trainingConfig)
    trainer.create_dataloaders()
    trainer.train()


if __name__ == "__main__":
    main()
