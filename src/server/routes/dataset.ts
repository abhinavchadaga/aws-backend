import fs from 'fs';
import express, { Request, Response, NextFunction } from 'express';
import unzipper from 'unzipper';
import multer, { FileFilterCallback } from 'multer';
import path from 'node:path';

const UPLOAD_DIR = './uploads';
const router = express.Router();

/**
 * Ensures that the upload folder exists before any upload requests are handled
 *
 * @param _req Request object
 * @param _res Response object
 * @param next next middleware function to run
 */
export function createUploadFolder(
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!fs.existsSync(UPLOAD_DIR)) {
    console.log(`creating ${UPLOAD_DIR}...`);
    fs.mkdirSync(UPLOAD_DIR);
  }
  next();
}

// Multer storage object to place uploaded files
// in the uploads folder and rename them with a timestamp
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    // create a new filename using the original file name and a timestamp
    const suffix = Date.now();
    const parsedFilename = path.parse(file.originalname);
    cb(null, `${parsedFilename.name}_${suffix}${parsedFilename.ext}`);
  },
});

/**
 * Multer file filter to only allow zip and csv files
 *
 * @param req Request
 * @param file Uploaded file
 * @param cb callback to call when file is accepted or rejected
 */
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

// multer object to handle uploads
const upload = multer({ storage, fileFilter });

/**
 * Allows only one user to be using server at a time
 * @param res Response object
 * @param req Request object
 * @param next next middleware function to run
 */
function checkAvailability(req: Request, res: Response, next: NextFunction) {
  const uploads = fs.readdirSync(UPLOAD_DIR);
  if (uploads.length > 0) {
    res.status(400).json({ message: 'server is busy! please try again later' });
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
    if (!req.file) {
      return res.status(400).json({ message: 'file upload failed' });
    }

    // unzip to same location and delete zip
    if (req.file.mimetype === 'application/zip') {
      const files = fs.readdirSync(UPLOAD_DIR);
      const path_to_zip = path.join(UPLOAD_DIR, files[0]);
      fs.createReadStream(path_to_zip)
        .pipe(unzipper.Extract({ path: UPLOAD_DIR }))
        .on('close', () => {
          fs.unlinkSync(path_to_zip);
          return res.json({
            message: `successfully uploaded ${req.file.originalname}`,
          });
        });
    } else {
      // uploaded file was a csv file
      return res.json({
        message: `successfully uploaded ${req.file.originalname}`,
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
