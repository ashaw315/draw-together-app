import { NextApiRequest, NextApiResponse } from "next";
import { bucket } from "@/mongodb";
import stream from 'stream';
import { v4 as uuidv4 } from 'uuid';

export default async function uploadHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {

    const uniqueFilename = (): string => {
        const timestamp = Date.now().toString();
        const randomString = uuidv4().substr(0, 8);
        return `${timestamp}-${randomString}.png`;
    };


  if (req.method === 'POST') {
    try {
      const { dataUrl } = req.body;
      const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
      const bufferStream = stream.Readable.from(buffer);
      const uploadStream = bucket.openUploadStream(uniqueFilename(), {
          chunkSize: 1024 * 1024,
          metadata: { contentType: 'image/png' },
      });
      await new Promise<void>((resolve, reject) => {
        bufferStream.pipe(uploadStream)
          .on('error', reject)
          .on('finish', resolve);
      });
      const fileId = uploadStream.id.toString();
      res.status(200).json({ fileId });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    try {
        const fileId = req.query.fileId as string;
        if (!fileId) {
          // Return a list of available file IDs
          const files = await bucket.find().toArray();
          const fileIds = files.map((file) => file.filename);
          return res.json({ fileIds });
        }
        const downloadStream = bucket.openDownloadStreamByName(fileId);
        downloadStream.on("error", () => {
          res.status(404).json({ message: "Image not found" });
        });
        res.setHeader("content-type", "image/png");
        downloadStream.pipe(res);
    } catch (error) {
      console.log(error);
      res.status(404).json({ message: 'Image not found' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}