import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase'; // Assuming you have firebase.ts for storage initialization
import { v4 as uuidv4 } from 'uuid'; // For generating unique file names

// Upload an image and get its URL
// userId parameter removed, path is now generic
export const uploadImage = async (file: File): Promise<string> => {
  if (!file) throw new Error('No file provided for upload.');

  const fileExtension = file.name.split('.').pop();
  // Path no longer includes userId, making it global for admin uploads
  const fileName = `${uuidv4()}.${fileExtension}`;
  const storageRef = ref(storage, `dataItemImages/${fileName}`);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image: ', error);
    throw new Error('Failed to upload image.');
  }
};

// Delete an image from storage
export const deleteImageByUrl = async (imageUrl: string): Promise<void> => {
  if (!imageUrl) return;

  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    if ((error as any).code === 'storage/object-not-found') {
      console.warn('Image not found for deletion, might have been already deleted:', imageUrl);
      return;
    }
    console.error('Error deleting image: ', error);
    throw new Error('Failed to delete image.');
  }
};
