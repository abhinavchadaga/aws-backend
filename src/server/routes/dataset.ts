import fs from 'fs';
import express, { Request, Response, NextFunction } from 'express';
import unzipper from 'unzipper';
import multer, { FileFilterCallback } from 'multer';
import path from 'node:path';

const UPLOAD_DIR = './uploads';
const router = express.Router();

export function createUploadFolder(
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!fs.existsSync(UPLOAD_DIR)) {
    console.log(`creating ${UPLOAD_DIR}...`);
    fs.mkdirSync(UPLOAD_DIR);
  }

  const files = fs.readdirSync(UPLOAD_DIR);
  files.forEach((file) => {
    if (file === '.DS_Store') {
      fs.unlinkSync(path.join(UPLOAD_DIR, file));
    }

    if (file === '__MACOSX') {
      fs.rmSync(path.join(UPLOAD_DIR, file), { recursive: true });
    }
  });

  next();
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const suffix = Date.now();
    const parsedFilename = path.parse(file.originalname);
    cb(null, `${parsedFilename.name}_${suffix}${parsedFilename.ext}`);
  },
});

function fileFilter(
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) {
  // only zips and csv files are allowed
  const allowedExtensions = new Set(['.zip', '.csv']);
  const ext = path.extname(file.originalname);
  if (allowedExtensions.has(ext)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

const upload = multer({ storage, fileFilter });

function checkAvailability(req: Request, res: Response, next: NextFunction) {
  const uploads = fs.readdirSync(UPLOAD_DIR);
  if (uploads.length > 0) {
    res.status(400).json({
      message: 'server is busy! please try again later',
      files: uploads,
    });
    return;
  }
  next();
}

/**
 * POST route to upload dataset to server
 */
router.post(
  '/upload',
  checkAvailability,
  upload.single('dataset'),
  (req: Request, res: Response) => {
    const file = req.file;
    if (file == null) {
      return res.status(400).json({ message: 'file upload failed' });
    }

    // unzip to same location and delete zip
    if (file.mimetype === 'application/zip') {
      const files = fs.readdirSync(UPLOAD_DIR);
      const path_to_zip = path.join(UPLOAD_DIR, files[0]);
      fs.createReadStream(path_to_zip)
        .pipe(unzipper.Extract({ path: UPLOAD_DIR }))
        .on('close', () => {
          fs.unlinkSync(path_to_zip);
          return res.json({
            message: `successfully uploaded ${file.originalname}`,
          });
        });
    } else {
      // uploaded file was a csv file
      return res.json({
        message: `successfully uploaded ${file.originalname}`,
      });
    }
  },
);

/**
 * DELETE route to delete the uploaded dataset
 */
router.delete('/delete', (req: Request, res: Response) => {
  const files = fs.readdirSync(UPLOAD_DIR);
  if (files.length === 0) {
    return res.json({ message: 'nothing to delete' });
  }

  const path_to_dataset = path.join(UPLOAD_DIR, files[0]);
  if (fs.lstatSync(path_to_dataset).isDirectory()) {
    fs.rmSync(path_to_dataset, { recursive: true });
  } else {
    fs.unlinkSync(path_to_dataset);
  }
  res.json({ message: `successfully deleted ${files[0]}` });
});

export default router;
