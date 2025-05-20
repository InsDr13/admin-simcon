
"use client";

import { useEffect, useState, useCallback } from 'react';
import { 
  CombinedInfoItem, 
  ProductData,
  getSingleInfoWithProducts,
  upsertSingleInfoWithProducts,
  deleteProductsAndImageForSingleInfo,
  type InfoDataForUpsert 
} from '@/lib/firestore';
import { uploadImage, deleteImageByUrl } from '@/lib/storage';
import DataCard from '@/components/dashboard/DataCard';
import DataForm, { DataFormValues } from '@/components/dashboard/DataForm';
import { Button } from '@/components/ui/button';
import { RefreshCw, Settings, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle as EmptyStateCardTitle } from '@/components/ui/card';
import { Timestamp, deleteField, type FieldValue } from 'firebase/firestore';


export default function DashboardPage() {
  const { toast } = useToast();
  const [mainCompanyInfo, setMainCompanyInfo] = useState<CombinedInfoItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);


  const fetchMainInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const info = await getSingleInfoWithProducts(); 
      setMainCompanyInfo(info);
    } catch (error) {
      toast({ title: 'Erreur lors de la récupération des informations de l\'entreprise', description: (error as Error).message, variant: 'destructive' });
      setMainCompanyInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMainInfo();
  }, [fetchMainInfo]);

  const handleFormSubmit = async (formValues: DataFormValues, newFile: File | null) => {
    setIsSubmitting(true);

    // Destructure formValues, exclude products and imageUrl (as it's handled separately with newFile)
    const { products, imageUrl: formImageUrl, dernierMisAJour: formDernierMisAJour, taux: formTaux, telephones: formTelephones, socialMedia: formSocialMedia, ...infoPart } = formValues;
    
    // Base data for Firestore, this won't include imageUrl yet.
    const infoDataForFirestore: Omit<InfoDataForUpsert, 'imageUrl' | 'dernierMisAJour' | 'taux' | 'telephones' | 'socialMedia'> & { dernierMisAJour?: Timestamp | FieldValue, taux?: number | FieldValue, telephones?: string | FieldValue, socialMedia?: { facebook?: string | FieldValue, instagram?: string | FieldValue} } = {
      ...infoPart, // Contains address, email
    };
    
    // Handle dernierMisAJour
    if (formDernierMisAJour) {
      infoDataForFirestore.dernierMisAJour = Timestamp.fromDate(formDernierMisAJour);
    } else if (mainCompanyInfo?.dernierMisAJour) { // If it existed and now form value is null/undefined
      infoDataForFirestore.dernierMisAJour = deleteField();
    }

    // Handle taux
    if (formTaux === '' || formTaux === undefined || formTaux === null) {
      if (mainCompanyInfo?.taux !== undefined && mainCompanyInfo?.taux !== null) {
        infoDataForFirestore.taux = deleteField();
      }
    } else {
      infoDataForFirestore.taux = Number(formTaux);
    }
    
    // Handle telephones
    if (formTelephones === '' || formTelephones === undefined) {
        if (mainCompanyInfo?.telephones) {
            infoDataForFirestore.telephones = deleteField();
        }
    } else {
        infoDataForFirestore.telephones = formTelephones;
    }
    
    // Handle socialMedia
    infoDataForFirestore.socialMedia = {};
    if (formSocialMedia?.facebook && formSocialMedia.facebook.trim() !== '') {
        infoDataForFirestore.socialMedia.facebook = formSocialMedia.facebook;
    } else if (mainCompanyInfo?.socialMedia?.facebook) {
        infoDataForFirestore.socialMedia.facebook = deleteField();
    }

    if (formSocialMedia?.instagram && formSocialMedia.instagram.trim() !== '') {
        infoDataForFirestore.socialMedia.instagram = formSocialMedia.instagram;
    } else if (mainCompanyInfo?.socialMedia?.instagram) {
        infoDataForFirestore.socialMedia.instagram = deleteField();
    }

    if (Object.keys(infoDataForFirestore.socialMedia).length === 0) {
        // If socialMedia object is empty, decide if it should be deleted from Firestore
        if(mainCompanyInfo?.socialMedia && (mainCompanyInfo.socialMedia.facebook || mainCompanyInfo.socialMedia.instagram)) {
          (infoDataForFirestore as any).socialMedia = deleteField(); // Explicitly delete if it existed
        } else {
          delete infoDataForFirestore.socialMedia; // Don't send empty object if it never existed
        }
    }


    const productsData: ProductData[] = products.map(p => ({
        name: p.name,
        category: p.category,
        description: p.description,
        price: p.price,
        usage: p.usage,
    }));

    let finalImageUrlValue: string | FieldValue | null;

    if (newFile) { // A new file was selected in FileUpload.
        if (mainCompanyInfo?.imageUrl) { // If an old image existed, delete it from storage.
            try { await deleteImageByUrl(mainCompanyInfo.imageUrl); } catch (e) { console.warn("Erreur lors de la suppression de l'ancienne image pendant le téléversement de la nouvelle", e); }
        }
        finalImageUrlValue = await uploadImage(newFile); // Upload new one.
    } else { // No new file was selected in FileUpload.
        // formImageUrl comes from the form's 'imageUrl' field.
        // DataForm now sets this to 'null' if the user clears the image using FileUpload's 'X' button.
        if (formImageUrl && formImageUrl !== '') {
            // formImageUrl has a value. This means:
            // - An image existed initially (mainCompanyInfo.imageUrl was set).
            // - User did NOT click 'X' to clear it.
            // - User did NOT pick a new file.
            // So, keep the existing image URL.
            finalImageUrlValue = formImageUrl;
        } else { // formImageUrl is null or empty. This means:
                 // - User clicked 'X' to clear an existing/selected image.
                 // - OR, there was no image initially and none was selected.
            if (mainCompanyInfo?.imageUrl) {
                // An image *did* exist before this editing session, but formImageUrl is now null/empty.
                // This means it was explicitly cleared by the user.
                try { await deleteImageByUrl(mainCompanyInfo.imageUrl); } catch (e) { console.warn("Erreur lors de la suppression de l'image qui a été effacée dans le formulaire", e); }
                finalImageUrlValue = deleteField(); // Mark for deletion in Firestore.
            } else {
                // No image existed initially, and formImageUrl is null/empty (and no new file selected).
                // So, no image.
                finalImageUrlValue = null;
            }
        }
    }
      
    const finalInfoDataWithImage = { 
        ...infoDataForFirestore, 
        imageUrl: finalImageUrlValue 
    };

    try {
      await upsertSingleInfoWithProducts(finalInfoDataWithImage as InfoDataForUpsert, productsData);
      toast({ title: 'Succès', description: 'Informations de l\'entreprise mises à jour avec succès.' });
      
      fetchMainInfo(); 
      setIsFormOpen(false);
    } catch (error) {
      toast({ title: 'Erreur', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    setIsFormOpen(true);
  };

  const handleDeleteDetailsConfirm = async () => {
    setIsLoading(true); 
    try {
      const deletedItemImageUrl = await deleteProductsAndImageForSingleInfo();
      // The storage deletion is now handled by deleteProductsAndImageForSingleInfo IF an image URL was present
      // No need to call deleteImageByUrl here again if it's already done inside.
      // However, deleteProductsAndImageForSingleInfo was modified to RETURN the URL to be deleted by caller.
      // Let's ensure deleteProductsAndImageForSingleInfo does NOT delete from storage, only from Firestore field.
      if (deletedItemImageUrl) { // If Firestore function returned an image URL to delete
         try {
            await deleteImageByUrl(deletedItemImageUrl);
          } catch (deleteImageError) {
            console.warn("Impossible de supprimer l'image du stockage ou elle n'existait pas:", deleteImageError);
          }
      }
      toast({ title: 'Succès', description: 'Produits et image pour les informations de l\'entreprise effacés avec succès.' });
      fetchMainInfo(); 
    } catch (error) {
      toast({ title: 'Erreur lors de la suppression des détails', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setShowDeleteConfirmation(false); 
      setIsLoading(false);
    }
  };


  if (isLoading && !mainCompanyInfo) { 
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Informations de l'entreprise & Produits</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchMainInfo} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {!isLoading && !mainCompanyInfo ? (
        <Card className="text-center py-10 shadow">
            <CardHeader>
                <Settings className="mx-auto h-12 w-12 text-primary" />
                <EmptyStateCardTitle className="mt-2 text-xl font-semibold text-foreground">Informations de l'entreprise non configurées</EmptyStateCardTitle>
            </CardHeader>
            <CardContent>
                <p className="mt-1 text-sm text-muted-foreground">
                    Veuillez configurer les informations de votre entreprise et vos produits.
                </p>
                <div className="mt-6">
                    <Button onClick={() => setIsFormOpen(true) }>
                    <Settings className="mr-2 h-4 w-4" /> Configurer maintenant
                    </Button>
                </div>
            </CardContent>
        </Card>
      ) : mainCompanyInfo ? (
        <DataCard 
            item={mainCompanyInfo} 
            onEdit={handleEdit} 
            onDelete={() => setShowDeleteConfirmation(true)} 
            isMainInfoCard={true} 
        />
      ) : null}

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        // if (!open) setSelectedItem(null); // Clear selected item when dialog closes
        setIsFormOpen(open);
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{mainCompanyInfo?.address ? 'Modifier les informations de l\'entreprise' : 'Configurer les informations de l\'entreprise'}</DialogTitle>
            <DialogDescription>
              {mainCompanyInfo?.address ? 'Mettez à jour les détails de votre entreprise et gérez les produits.' : 'Remplissez le formulaire pour configurer les informations de votre entreprise et vos produits.'}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <DataForm
              key={mainCompanyInfo ? mainCompanyInfo.id : 'new-config'} 
              initialData={mainCompanyInfo} 
              onSubmitSuccess={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
              isSubmittingExternal={isSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirmation} onOpenChange={() => setShowDeleteConfirmation(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-6 w-6 text-destructive" />
                Êtes-vous sûr ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action effacera tous les produits et l'image principale associés aux informations de votre entreprise. 
              Les détails principaux de l'entreprise (adresse, e-mail, etc.) resteront mais pourront être modifiés. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirmation(false)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDetailsConfirm} className="bg-destructive hover:bg-destructive/90">
              Effacer Produits & Image
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
