import { NextApiRequest, NextApiResponse } from "next";
import { bucket } from "@/mongodb";

export default async function imageHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const fileIds = (await bucket.find().toArray()).map((file: { _id: { toString: () => string } }) => file._id.toString());
      res.status(200).json({ fileIds });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}