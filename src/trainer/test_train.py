from PIL import UnidentifiedImageError, Image
from torch.utils.data import random_split, DataLoader
from torchvision.datasets import ImageFolder
from torchvision import transforms

img_transforms = transforms.Compose(
    [
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225)),
    ]
)


def is_valid_file(file_path):
    try:
        img = Image.open(file_path)
        img.verify()  # Verify the image integrity
        return True
    except (OSError, UnidentifiedImageError):
        return False


root_dir = "/Users/abhinavchadaga/Developer/aws3/server/uploads/chess-pieces"

dataset = ImageFolder(
    root=root_dir,
    transform=img_transforms,
    is_valid_file=is_valid_file,
)

# Perform random split
train_ratio = 0.7
val_ratio = 0.1
test_ratio = 0.2

train_size = int(len(dataset) * train_ratio)
val_size = int(len(dataset) * val_ratio)
test_size = len(dataset) - train_size - val_size

print(train_size, val_size, test_size)
print(dataset.classes)

trainset, valset, testset = random_split(dataset, [train_size, val_size, test_size])
trainloader = DataLoader(trainset, batch_size=32, shuffle=True)
val_loader = DataLoader(valset, batch_size=32, shuffle=True)
test_loader = DataLoader(testset, batch_size=32, shuffle=True)

train_batch = next(iter(trainloader))
print(train_batch[0].shape, train_batch[1].shape)
