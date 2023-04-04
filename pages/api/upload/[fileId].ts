import { NextApiRequest, NextApiResponse } from "next";
import { bucket } from "@/mongodb";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const fileId = req.query.fileId as string;
    console.log('fileId UPLOAD:', fileId);
    const downloadStream = bucket.openDownloadStreamByName(fileId);
    downloadStream.on('error', (error: string) => {
      console.log('error:', error);
      res.status(404).json({ message: 'Image not found' });
    });
    res.setHeader('content-type', 'image/png');
    downloadStream.pipe(res);
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: 'Image not found' });
  }
}