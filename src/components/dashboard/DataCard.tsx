
"use client";

import Image from 'next/image';
import { CombinedInfoItem } from '@/lib/firestore'; 
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit3, MapPin, Mail, Facebook, Instagram, Coins, Package, Tag, FileText, CalendarDays, AlertTriangle, Phone, DollarSign } from 'lucide-react'; 
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns'; 
import { fr } from 'date-fns/locale';
import type { Timestamp } from 'firebase/firestore';

interface DataCardProps {
  item: CombinedInfoItem; 
  onEdit: (item: CombinedInfoItem) => void; 
  onDelete: (itemId: string) => void; 
  isMainInfoCard?: boolean; 
}

function formatFirebaseTimestamp(timestamp: Timestamp | any): string {
  if (!timestamp) return 'N/A';
  if (timestamp && typeof timestamp.toDate === 'function') {
    return format(timestamp.toDate(), 'dd/MM/yyyy', { locale: fr }); 
  }
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Date invalide';
    return format(date, 'dd/MM/yyyy', { locale: fr }); 
  } catch (e) {
    return 'Date invalide';
  }
}

function formatFirebaseTimestampWithTime(timestamp: Timestamp | any): string {
  if (!timestamp) return 'N/A';
  if (timestamp && typeof timestamp.toDate === 'function') {
    return format(timestamp.toDate(), 'dd/MM/yyyy HH:mm', { locale: fr });
  }
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Date invalide';
    return format(date, 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch (e) {
    return 'Date invalide';
  }
}


export default function DataCard({ item, onEdit, onDelete, isMainInfoCard = false }: DataCardProps) {
  const mainProduct = item.products && item.products.length > 0 ? item.products[0] : null;
  const displayTitle = item.address || item.email || 'Informations de l\'entreprise'; 

  return (
    <Card className="w-full overflow-hidden shadow-lg transition-all hover:shadow-xl">
      <CardHeader className="bg-muted/30 p-4">
        {item.imageUrl && (
          <div className="relative mb-4 h-64 w-full overflow-hidden rounded-md">
            <Image src={item.imageUrl} alt={mainProduct?.name || 'Image de l\'entreprise'} layout="fill" objectFit="cover" data-ai-hint="company office building" />
          </div>
        )}
        <CardTitle className="text-2xl font-semibold text-primary">{displayTitle}</CardTitle>
        {item.products.length > 0 && <Badge variant="secondary" className="mt-1 w-fit">{item.products.length} produit(s) listé(s)</Badge>}
        
        <CardDescription className="flex items-center text-sm text-muted-foreground mt-2">
            <CalendarDays className="mr-1.5 h-4 w-4" />
            Mis à jour (auto) : {formatFirebaseTimestampWithTime(item.lastUpdateDate)}
        </CardDescription>
        {item.dernierMisAJour && (
            <CardDescription className="flex items-center text-sm text-muted-foreground mt-1">
                <CalendarDays className="mr-1.5 h-4 w-4" />
                Dernier mis à jour (manuel) : {formatFirebaseTimestamp(item.dernierMisAJour)}
            </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {item.address && (
            <div className="flex items-start space-x-2 text-sm">
            <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <span>{item.address}</span>
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            {item.email && (
                <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <a href={`mailto:${item.email}`} >{item.email}</a>
                </div>
            )}
            {item.telephones && (
                <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span>{item.telephones}</span>
                </div>
            )}
        </div>
        {item.taux !== undefined && item.taux !== null && (
            <div className="flex items-center space-x-2 text-sm">
            <Coins className="h-4 w-4 text-primary shrink-0" /> 
            <span>Taux : {item.taux} FC</span> 
            </div>
        )}
        {(item.socialMedia?.facebook || item.socialMedia?.instagram) && (
          <div className="flex items-center space-x-3 text-sm pt-2">
            {item.socialMedia.facebook && (
              <a href={item.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center text-primary hover:text-accent transition-colors">
                <Facebook className="h-5 w-5 mr-1" /> Facebook
              </a>
            )}
            {item.socialMedia.instagram && (
              <a href={item.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center text-primary hover:text-accent transition-colors">
                <Instagram className="h-5 w-5 mr-1" /> Instagram
              </a>
            )}
          </div>
        )}

        {item.products.length > 0 && (
            <Accordion type="single" collapsible className="w-full pt-2" defaultValue="products">
            <AccordionItem value="products">
                <AccordionTrigger className="text-base font-medium hover:no-underline">
                    Voir les produits ({item.products.length})
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                {item.products.map((product, index) => (
                    <div key={product.id || index} className="p-3 border rounded-md bg-background shadow-sm">
                    <h4 className="font-semibold text-primary flex items-center"><Package className="mr-2 h-5 w-5" />{product.name}</h4>
                    <div className="text-sm text-muted-foreground mt-1 mb-2 space-y-1">
                        <p className="flex items-center"><Tag className="mr-2 h-4 w-4 text-accent" />Catégorie : {product.category}</p>
                        <p className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-accent" />Prix : {typeof product.price === 'number' ? product.price.toFixed(2) : 'N/A'} FC</p>
                    </div>
                    <p className="text-xs flex items-start"><FileText className="mr-2 h-3 w-3 mt-0.5 text-accent shrink-0" />Description : {product.description}</p>
                    </div>
                ))}
                </AccordionContent>
            </AccordionItem>
            </Accordion>
        )}
         {item.products.length === 0 && (
            <p className="text-sm text-muted-foreground pt-2">Aucun produit listé pour cette entreprise pour le moment.</p>
        )}

      </CardContent>
      <CardFooter className="p-4 bg-muted/30 flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
          <Edit3 className="mr-2 h-4 w-4" /> Modifier Infos & Produits
        </Button>
        {isMainInfoCard && (item.products.length > 0 || item.imageUrl) && (
          <Button variant="destructive" size="sm" onClick={() => onDelete(item.id!)}>
            <AlertTriangle className="mr-2 h-4 w-4" /> Effacer Produits & Image
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
