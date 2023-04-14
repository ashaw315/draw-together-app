import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface UploadedImage {
  fileId: string;
  name: string;
  title: string;
  createdAt: string;
}

function Gallery() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showPaintModal, setShowPaintModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  }

  const handleImageClick = (image: UploadedImage) => {
    setSelectedImage(image)
    setShowPaintModal(true);
    console.log('anything')
  }

  function closeModal(){
    setSelectedImage(null);
    setShowPaintModal(false);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { month: 'numeric', day: 'numeric', year: 'numeric' };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const formattedDate = formatter.format(date);
    return formattedDate.replace(/\//g, '.');
  }

  useEffect(() => {
    const fetchUploads = async () => {
        const response = await fetch('/api/upload');
        const data = await response.json();
        setImages(data);
      }
      fetchUploads();

  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setShowPaintModal(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="gallery">
      <Link href="/">←Back to the Lounge</Link>
      <div className='gallery-header'>
        <h1>Scribble Lounge</h1>
        <h2>Gallery</h2>
      </div>
      <div className='gallery-images'>
        {images.map((image, index) => (
        <div className='image-container' key={index}>
            {isImageLoaded ? null : <div className='loader'></div>}
            <Image
              src={`/api/upload/${image.fileId}`} 
              alt="Drawing" loading='lazy' 
              onLoad={handleImageLoad} 
              onClick={() => handleImageClick(image) }
              width={500}
              height={500}
              />
            <div className='image-info'>
              <p>{image.name ? (image.title ? `${image.title} by ${image.name}` : `${image.name} (Untitled)`) : (image.title ? `${image.title} (Anonymous)` : 'Untitled by Anonymous')}</p>
              <p>{formatDate(image.createdAt)}</p>
            </div>
        </div>
        ))}
      </div>
      {showPaintModal && window.innerWidth > 768 && (
        <div className={`paint-modal`}>
          <div className='paint-modal-content'>
            <span className='close' onClick={closeModal}>&times;</span>
            {selectedImage && (
              <>
                <Image src={`/api/upload/${selectedImage.fileId}`} alt="Drawing" width={500} height={500} />
                <div className='image-info'>
                  <p>{selectedImage.name ? (selectedImage.title ? `${selectedImage.title} by ${selectedImage.name}` : `${selectedImage.name} (Untitled)`) : (selectedImage.title ? `${selectedImage.title} (Anonymous)` : 'Untitled by Anonymous')}</p>
                  <p>{formatDate(selectedImage.createdAt)}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;