// import { NextApiRequest, NextApiResponse } from 'next';
// import { bucket } from '@/mongodb';

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   if (req.method === 'GET') {
//     try {
//       const fileId = req.query.id as string;
//       const downloadStream = bucket.openDownloadStream(fileId);
//       downloadStream.on('file', (file) => {
//         if (!file.length) {
//           throw new Error('File not found');
//         }
//       });
//       res.setHeader('content-type', 'image/png');
//       downloadStream.pipe(res);
//     } catch (error) {
//       console.log(error);
//       res.status(404).json({ message: 'Image not found' });
//     }
//   } else {
//     res.status(405).json({ message: 'Method not allowed' });
//   }
// }

import { NextApiRequest, NextApiResponse } from "next";
import { bucket } from "@/mongodb";

export default async function imageHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const fileIds = (await bucket.find().toArray()).map((file) => file._id.toString());
      res.status(200).json({ fileIds });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}