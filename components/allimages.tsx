import { useState, useEffect } from 'react';

interface ImageData {
  id: string;
  data: Blob;
}

function Gallery() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [galleryImages, setGalleryImages] = useState<ImageData[]>([]);

//   const fetchImages = async () => {
//     const response = await fetch('/api/images');
//     const data = await response.json();
//     console.log('yo its DATATAATAT',data)
//     const imagesData = await Promise.all(
//       data.fileIds.map(async (fileId) => {
//         console.log('fileId:', fileId);
//         const imageResponse = await fetch(`/upload/${fileId}`);
//         const imageData = await imageResponse.blob();
//         return { id: fileId, data: imageData };
//       })
//     );
//     console.log('IMAGESDATAAAAA',imagesData)
//     setImages(imagesData);
//   };

  useEffect(() => {
    const fetchUploads = async () => {
        const response = await fetch('/api/upload');
        const data = await response.json();
        setGalleryImages(data.fileIds);
      }
      fetchUploads();

  }, []);

  // console.log("IMAGES:",images)
  // console.log("Gallery Images:",galleryImages)

  return (
    <div className="gallery">
      <h2>Gallery</h2>
      {/* <button onClick={fetchImages}>Fetch Images</button> */}
      {images.map((image) => (
        <div key={image.id}>
          <img src={URL.createObjectURL(image.data)} alt={image.id} />
        </div>
      ))}
      {galleryImages.map((image, index) => (
        <div key={index}>
            <img src={`/api/upload/${image}`} alt="Drawing" />
        </div>
      ))}
    </div>
  );
}

export default Gallery;