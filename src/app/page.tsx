'use client';

import { useState, useRef, FormEvent } from 'react';
import Image from 'next/image';

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [textResponse, setTextResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmittedData, setLastSubmittedData] = useState<{description: string, images: File[]} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    // Limit to 3 images
    const selectedFiles = Array.from(e.target.files).slice(0, 3);
    
    // Create preview URLs
    const newPreviewUrls = selectedFiles.map(file => URL.createObjectURL(file));
    
    setImages(selectedFiles);
    setPreviewUrls(prevUrls => {
      // Revoke old URLs to avoid memory leaks
      prevUrls.forEach(url => URL.revokeObjectURL(url));
      return newPreviewUrls;
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!description) {
      setError('Description is required');
      return;
    }
    
    setUploading(true);
    setError(null);
    setTextResponse(null); // Reset previous text response
    setResultImage(null); // Reset previous image result
    
    // Save the form data for potential retry
    setLastSubmittedData({
      description: description,
      images: [...images]
    });
    
    try {
      const formData = new FormData();
      formData.append('description', description);
      
      // Add images to form data
      images.forEach((image, index) => {
        formData.append(`image${index}`, image);
      });
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }
      
      const data = await response.json();
      console.log('API Response:', data); // Log the entire response for debugging
      
      setResultImage(data.generatedImage || null);
      
      // Handle text response more flexibly
      if (data.textResponse) {
        setTextResponse(data.textResponse);
      } else if (data.text) {
        setTextResponse(data.text);
      } else if (data.message) {
        setTextResponse(data.message);
      } else if (typeof data === 'string') {
        setTextResponse(data);
      } else {
        // If there's no specific text response field, but we have data, stringify it
        const textContent = JSON.stringify(data, null, 2);
        setTextResponse(textContent);
      }
      
    } catch (error) {
      console.error('Error generating image:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };
  
  // Retry the last submission
  const handleRetry = async () => {
    if (!lastSubmittedData) return;
    
    setUploading(true);
    setError(null);
    setTextResponse(null); // Reset previous text response
    setResultImage(null); // Reset previous image result
    
    try {
      const formData = new FormData();
      formData.append('description', lastSubmittedData.description);
      
      // Add images to form data
      lastSubmittedData.images.forEach((image, index) => {
        formData.append(`image${index}`, image);
      });
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }
      
      const data = await response.json();
      console.log('API Retry Response:', data); // Log the retry response for debugging
      
      setResultImage(data.generatedImage || null);
      
      // Handle text response more flexibly
      if (data.textResponse) {
        setTextResponse(data.textResponse);
      } else if (data.text) {
        setTextResponse(data.text);
      } else if (data.message) {
        setTextResponse(data.message);
      } else if (typeof data === 'string') {
        setTextResponse(data);
      } else {
        // If there's no specific text response field, but we have data, stringify it
        const textContent = JSON.stringify(data, null, 2);
        setTextResponse(textContent);
      }
      
    } catch (error) {
      console.error('Error during retry:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };
  
  // Handle image removal
  const removeImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
    setPreviewUrls(prevUrls => {
      // Create a new array without the removed image
      const newUrls = [...prevUrls];
      URL.revokeObjectURL(newUrls[index]);
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <div className="w-full max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-8">NaturalPS - Gemini 2 Pro Image Generator</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description input */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you want Gemini to generate or modify in your images..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Images (max 3)
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="file-upload"
                className="w-full flex flex-col items-center px-4 py-6 bg-white border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <svg
                  className="w-8 h-8 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-500">Click to upload images</p>
                <p className="text-xs text-gray-500 mt-1">{previewUrls.length}/3 images selected</p>
              </label>
              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
          
          {/* Image previews */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative">
                  <div className="relative h-32 w-full overflow-hidden rounded-lg">
                    <Image
                      src={url}
                      alt={`Preview ${index + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    aria-label="Remove image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-600 mb-2">{error}</div>
              {error.includes('未能生成任何内容') && (
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={uploading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400"
                >
                  {uploading ? '重试中...' : '点击重试'}
                </button>
              )}
            </div>
          )}
          
          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={uploading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                uploading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {uploading ? 'Processing...' : 'Generate Image'}
            </button>
          </div>
        </form>
        
        {/* Result image and text response */}
        {(resultImage || textResponse) && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Generated Result</h2>
            
            {/* Text response */}
            {textResponse && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium mb-2">Text Response</h3>
                <p className="whitespace-pre-wrap">{textResponse}</p>
              </div>
            )}
            
            {/* Image result */}
            {resultImage && (
              <div className="relative h-96 w-full overflow-hidden rounded-lg">
                <Image
                  src={resultImage}
                  alt="Generated image"
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
