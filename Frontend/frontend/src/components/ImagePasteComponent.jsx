import React, { useState } from 'react';
import axios from 'axios';

const ImagePasteComponent = () => {
    const [pastedImage, setPastedImage] = useState(null); // Preview data url
    const [imageFile, setImageFile] = useState(null); // Actual file to upload

    // Paste event handler
    const handlePaste = (event) => {
        const items = event.clipboardData?.items;

        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            // Check if the item is an image
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile(); // Get the image file

                // Create a preview URL
                const previewUrl = URL.createObjectURL(blob);
                setPastedImage(previewUrl);
                setImageFile(blob);

                // Prevent default paste behavior (like pasting text URL)
                event.preventDefault();
                break;
            }
        }
    };

    // Upload function
    const handleUpload = async () => {
        if (!imageFile) return;

        const formData = new FormData();
        formData.append('file', imageFile);

        try {
            // Use relative path so it goes through Vite proxy to http://localhost:4000
            const response = await axios.post('/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = response.data;
            console.log("Image uploaded:", data);
            alert("Image uploaded successfully!");

            // Clear state after upload
            setPastedImage(null);
            setImageFile(null);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed. Check console for details.");
        }
    };

    return (
        <div
            className="p-5 border-2 border-dashed border-gray-400 rounded-lg"
            onPaste={handlePaste} // Listener attached here
        >
            <h2 className="text-xl font-bold mb-4">Paste Image Here (Ctrl+V)</h2>

            {/* Input area - textarea works best for catching paste events naturally */}
            <textarea
                className="w-full h-24 p-2 border rounded"
                placeholder="Click here and press Ctrl+V to paste screenshot..."
            />

            {/* Preview Section */}
            {pastedImage && (
                <div className="mt-4">
                    <p className="font-semibold text-green-600">Image Preview:</p>
                    <img src={pastedImage} alt="Pasted" className="max-w-md border rounded shadow-lg mt-2" />

                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={handleUpload}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Send Image
                        </button>
                        <button
                            onClick={() => { setPastedImage(null); setImageFile(null); }}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImagePasteComponent;