
"use client";

import { useState, useCallback, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  initialImageUrl?: string | null;
  accept?: string;
  maxSizeMb?: number; // Max size in MB
  onImageCleared?: () => void; // Callback when image is explicitly cleared by user
}

export default function FileUpload({
  onFileSelect,
  initialImageUrl = null,
  accept = "image/*",
  maxSizeMb = 5, // Default 5MB
  onImageCleared,
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialImageUrl);
  // selectedFile state is managed internally for the input element, parent manages its own selectedFile state
  const { toast } = useToast();

  useEffect(() => {
    // Sync preview if initialImageUrl changes externally (e.g. form reset)
    setPreview(initialImageUrl);
  }, [initialImageUrl]);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > maxSizeMb * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: `Veuillez sélectionner un fichier de moins de ${maxSizeMb}Mo.`,
          variant: "destructive",
        });
        event.target.value = ''; // Clear the input
        onFileSelect(null); // Notify parent that selection is now null
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Type de fichier invalide",
          description: `Veuillez sélectionner un fichier image.`,
          variant: "destructive",
        });
        event.target.value = ''; // Clear the input
        onFileSelect(null); // Notify parent
        return;
      }

      onFileSelect(file); // Notify parent of new file
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // User cancelled the file dialog or selected no file
      // If there was a preview from initialImageUrl, and no new file selected, keep preview.
      // If a file was previously selected (and previewed), then cancelled, onFileSelect(null) is important.
      onFileSelect(null); 
      // Do not clear preview here if it was from initialImageUrl and no new file was chosen
      // setPreview(initialImageUrl); // Revert to initial or stay null if it was
    }
  }, [onFileSelect, maxSizeMb, toast, initialImageUrl]);

  const handleRemoveImage = useCallback(() => {
    onFileSelect(null); // Inform parent: no file is actively selected for upload
    if (onImageCleared) {
      onImageCleared(); // Inform parent: user explicitly cleared the image
    }
    setPreview(null); // Clear internal preview
    // Clear the file input value
    const inputElement = document.getElementById('file-upload-input') as HTMLInputElement;
    if (inputElement) {
      inputElement.value = '';
    }
  }, [onFileSelect, onImageCleared]);

  return (
    <div className="space-y-2">
      <div className="relative group w-full h-64 border-2 border-dashed border-input rounded-lg flex items-center justify-center overflow-hidden bg-muted/20 hover:border-primary transition-colors">
        {preview ? (
          <>
            <Image
              src={preview}
              alt="Aperçu de l'image sélectionnée"
              layout="fill"
              objectFit="cover" // Changed from "contain" to "cover"
              className="rounded-lg"
              data-ai-hint="uploaded content"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={handleRemoveImage}
              aria-label="Supprimer l'image"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <label
            htmlFor="file-upload-input"
            className="flex flex-col items-center justify-center text-muted-foreground cursor-pointer p-4 text-center"
          >
            <UploadCloud className="h-10 w-10 mb-2" />
            <span className="font-semibold">Cliquez pour téléverser ou glissez-déposez</span>
            <span className="text-xs">Images jusqu'à {maxSizeMb}Mo</span>
          </label>
        )}
      </div>
      <Input
        id="file-upload-input"
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden" // Hidden, triggered by label or button
      />
       {!preview && (
        <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload-input')?.click()} className="w-full">
          <ImageIcon className="mr-2 h-4 w-4" /> Sélectionner une image
        </Button>
      )}
    </div>
  );
}
