
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  serverTimestamp,
  writeBatch,
  getDoc,
  setDoc,
  deleteField,
  type FieldValue,
  getDocs,
  orderBy, 
} from 'firebase/firestore';
import { db } from './firebase';

// Interface for product data when creating/updating
export interface ProductData {
  name: string;
  category: string;
  description: string;
  price: number;
}

// Interface for ProductItem as stored in Firestore and used in CombinedInfoItem
export interface ProductItem extends ProductData {
  id: string; // Firestore document ID
  infoId: string; // Link to the parent InfoItem
}

// Interface for info data when creating/updating
export interface InfoData {
  address: string;
  email: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
  };
  imageUrl?: string | null; // Can be null if no image
  taux?: number;
  telephones?: string;
  dernierMisAJour?: Timestamp; 
}

// Interface for InfoItem as stored in Firestore
export interface InfoItem extends InfoData {
  id: string; // Firestore document ID (will be SINGLE_INFO_ID)
  createdAt: Timestamp | FieldValue;
  lastUpdateDate: Timestamp | FieldValue; 
}

// Combined structure for use in the frontend
export interface CombinedInfoItem extends InfoItem {
  products: ProductItem[];
}

// Type helper for data passed to upsert function
export interface InfoDataForUpsert extends Omit<InfoData, 'dernierMisAJour' | 'imageUrl'> {
  dernierMisAJour?: Timestamp | FieldValue; // Allow FieldValue for deletion
  imageUrl?: string | null | FieldValue; // Allow FieldValue for deletion or null
}


const INFOS_COLLECTION = 'infos';
const PRODUCTS_COLLECTION = 'produits';
export const SINGLE_INFO_ID = "main_company_info"; // Fixed ID for the single info document

// Get the single info item with its products
export const getSingleInfoWithProducts = async (): Promise<CombinedInfoItem | null> => {
  try {
    const infoDocRef = doc(db, INFOS_COLLECTION, SINGLE_INFO_ID);
    const infoDocSnap = await getDoc(infoDocRef);

    if (!infoDocSnap.exists()) {
      return null;
    }

    const infoItem = { id: infoDocSnap.id, ...infoDocSnap.data() } as InfoItem;

    const productsQuery = query(
      collection(db, PRODUCTS_COLLECTION),
      where('infoId', '==', SINGLE_INFO_ID)
    );
    const productsSnapshot = await getDocs(productsQuery);
    const products = productsSnapshot.docs.map(
      productDoc => ({ id: productDoc.id, ...productDoc.data() } as ProductItem)
    );

    return { ...infoItem, products };
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de l\'entreprise avec produits: ', error);
    throw new Error('Impossible de récupérer les informations de l\'entreprise avec les produits.');
  }
};

// Create or update the single info item and its products
export const upsertSingleInfoWithProducts = async (
  infoData: InfoDataForUpsert, 
  productsData: ProductData[]
): Promise<string> => {
  const batch = writeBatch(db);
  const infoDocRef = doc(db, INFOS_COLLECTION, SINGLE_INFO_ID);

  const infoDocSnap = await getDoc(infoDocRef);
  
  const finalInfoData: Partial<InfoItem> & { lastUpdateDate: FieldValue, createdAt?: FieldValue } = {
    ...infoData, 
    lastUpdateDate: serverTimestamp(),
  };

  if (!infoDocSnap.exists()) {
    finalInfoData.createdAt = serverTimestamp();
  }
  
  batch.set(infoDocRef, finalInfoData, { merge: true });

  // First, delete all existing products associated with this info item
  const oldProductsQuery = query(
    collection(db, PRODUCTS_COLLECTION),
    where('infoId', '==', SINGLE_INFO_ID)
  );
  const oldProductsSnapshot = await getDocs(oldProductsQuery);
  oldProductsSnapshot.forEach(productDoc => {
    batch.delete(productDoc.ref);
  });

  // Then, add all current products from productsData
  productsData.forEach(product => {
    const productDocRef = doc(collection(db, PRODUCTS_COLLECTION));
    // Explicitly construct the product payload to avoid spreading unwanted fields
    const productPayload = {
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price,
      infoId: SINGLE_INFO_ID,
    };
    batch.set(productDocRef, productPayload);
  });

  try {
    await batch.commit();
    return SINGLE_INFO_ID;
  } catch (error) {
    console.error('Erreur lors de la création/mise à jour des informations et produits: ', error);
    throw new Error('Impossible d\'enregistrer les informations de l\'entreprise et les produits.');
  }
};


// Deletes products and image for the single info item, but NOT the info item itself.
// Returns the imageUrl that was in Firestore if it existed, so it can be deleted from storage.
export const deleteProductsAndImageForSingleInfo = async (): Promise<string | undefined> => {
  let imageUrlToDelete: string | undefined;
  const batch = writeBatch(db);
  const infoDocRef = doc(db, INFOS_COLLECTION, SINGLE_INFO_ID);

  try {
    const infoDocSnap = await getDoc(infoDocRef);
    if (infoDocSnap.exists()) {
      const currentInfo = infoDocSnap.data() as InfoItem;
      imageUrlToDelete = currentInfo.imageUrl ?? undefined; // Ensure it's string | undefined
      
      batch.update(infoDocRef, {
        imageUrl: deleteField(), 
        lastUpdateDate: serverTimestamp(),
      });

      const productsQuery = query(
        collection(db, PRODUCTS_COLLECTION),
        where('infoId', '==', SINGLE_INFO_ID)
      );
      const productsSnapshot = await getDocs(productsQuery);
      productsSnapshot.forEach(productDoc => {
        batch.delete(productDoc.ref);
      });
      
      await batch.commit();
      return imageUrlToDelete;

    } else {
      console.warn(`Information principale avec id ${SINGLE_INFO_ID} non trouvée.`);
      return undefined;
    }
  } catch (error) {
    console.error('Erreur lors de l\'effacement des détails pour l\'information principale: ', error);
    throw new Error('Impossible d\'effacer les produits et l\'image pour les informations de l\'entreprise.');
  }
};
