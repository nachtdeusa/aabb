"use client";

import Image from "next/image";
import { useState } from "react";

export default function Gallery() {
const [images, setImages] = useState([
  "/images/image1.jpg",
  "/images/image2.jpg",
  "/images/image3.jpg",
  "/images/image4.jpg",
  "/images/image5.jpg",
  "/images/image6.jpg",
]);

const [selectedImage, setSelectedImage] = useState<string | null>(null);
const [viewMode, setViewMode] = useState<"normal" | "scroll">("normal");

const handleImageClick = (imageSrc: string) => {
  setSelectedImage(imageSrc);
};

const handleCloseModal = () => {
  setSelectedImage(null);
};

return (
  <div className="container mx-auto p-4">
    <h1 className="text-2xl font-bold mb-4">Image Gallery</h1>

    <div className="mb-4">
      <button
        className={`px-4 py-2 rounded mr-2 ${
          viewMode === "normal"
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-700"
        }`}
        onClick={() => setViewMode("normal")}
      >
        Normal View
      </button>
      <button
        className={`px-4 py-2 rounded ${
          viewMode === "scroll"
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-700"
        }`}
        onClick={() => setViewMode("scroll")}
      >
        Scroll View
      </button>
    </div>

    <div
      className={`grid ${
        viewMode === "normal" ? "grid-cols-3 gap-4" : "flex overflow-x-scroll"
      }`}
    >
      {images.map((imageSrc) => (
        <div
          key={imageSrc}
          className={`relative ${viewMode === "normal" ? "" : "w-64 h-48 mr-4 flex-shrink-0"}`}
        >
          <Image
            src={imageSrc || "/placeholder.svg"}
            alt="Gallery Image"
            width={500}
            height={300}
            className={`object-cover cursor-pointer ${viewMode === "normal" ? "h-48 w-full" : "h-full w-full"}`}
            onClick={() => handleImageClick(imageSrc)}
          />
        </div>
      ))}
    </div>

    {selectedImage && (
      <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 flex justify-center items-center">
        <div className="relative">
          <button
            className="absolute top-4 right-4 text-white text-2xl cursor-pointer"
            onClick={handleCloseModal}
          >
            &times;
          </button>
          <Image
            src={selectedImage || "/placeholder.svg"}
            alt="Selected Image"
            width={800}
            height={600}
            className="object-contain"
          />
        </div>
      </div>
    )}
  </div>
);
}