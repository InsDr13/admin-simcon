
"use client";

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import FileUpload from './FileUpload';
import { CombinedInfoItem } from '@/lib/firestore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, MapPin, Mail, Facebook, Instagram, DollarSign, Package, Tag, FileText, Image as ImageIcon, Coins, Phone, CalendarDays, CalendarIcon as ShadCalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Timestamp } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const categoryOptions = ["Industriel", "Performance", "Résistant", "Pro", "Polyvalent", "Standard"];

const productFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Le nom du produit est requis.').max(20, 'Le titre ne doit pas dépasser 20 caractères.'),
  category: z.string().min(1, 'La catégorie est requise.'),
  description: z.string().min(1, 'La description est requise.').max(60, 'La description ne doit pas dépasser 60 caractères.'),
  price: z.coerce.number().positive('Le prix doit être un nombre positif.'),
});

const dataFormSchema = z.object({
  address: z.string().min(1, 'L\'adresse est requise.'),
  email: z.string().email('Adresse e-mail invalide.'),
  socialMedia: z.object({
    facebook: z.string().url({message: "Veuillez entrer une URL Facebook valide."}).optional().or(z.literal('')),
    instagram: z.string().url({message: "Veuillez entrer une URL Instagram valide."}).optional().or(z.literal('')),
  }),
  imageUrl: z.string().optional().nullable(), 
  taux: z.coerce.number().min(0, 'Le taux ne peut pas être négatif.').optional().or(z.literal('')),
  telephones: z.string().optional().or(z.literal('')),
  dernierMisAJour: z.date().optional().nullable(),
  products: z.array(productFormSchema),
});

export type DataFormValues = z.infer<typeof dataFormSchema>;

interface DataFormProps {
  initialData?: CombinedInfoItem | null;
  onSubmitSuccess: (data: DataFormValues, file: File | null) => void;
  onCancel: () => void;
  isSubmittingExternal?: boolean;
}

const defaultEmptyInfo: DataFormValues = {
    address: '',
    email: '',
    socialMedia: { facebook: '', instagram: '' },
    products: [],
    imageUrl: null, 
    taux: undefined,
    telephones: '',
    dernierMisAJour: null,
};


export default function DataForm({ initialData, onSubmitSuccess, onCancel, isSubmittingExternal = false }: DataFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const formDefaultValues = initialData
    ? {
        address: initialData.address,
        email: initialData.email,
        socialMedia: {
          facebook: initialData.socialMedia?.facebook || '',
          instagram: initialData.socialMedia?.instagram || '',
        },
        products: initialData.products.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          price: p.price,
        })),
        imageUrl: initialData.imageUrl || null, 
        taux: initialData.taux ?? undefined,
        telephones: initialData.telephones || '',
        dernierMisAJour: initialData.dernierMisAJour ? (initialData.dernierMisAJour as Timestamp).toDate() : null,
      }
    : defaultEmptyInfo;

  const form = useForm<DataFormValues>({
    resolver: zodResolver(dataFormSchema),
    defaultValues: formDefaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'products',
  });

  useEffect(() => {
    form.reset(initialData
        ? {
            address: initialData.address,
            email: initialData.email,
            socialMedia: {
                facebook: initialData.socialMedia?.facebook || '',
                instagram: initialData.socialMedia?.instagram || '',
            },
            products: initialData.products.map(p => ({
                id: p.id,
                name: p.name,
                category: p.category,
                description: p.description,
                price: p.price,
            })),
            imageUrl: initialData.imageUrl || null,
            taux: initialData.taux ?? undefined,
            telephones: initialData.telephones || '',
            dernierMisAJour: initialData.dernierMisAJour ? (initialData.dernierMisAJour as Timestamp).toDate() : null,
            }
        : defaultEmptyInfo
    );
    setSelectedFile(null); 
  }, [initialData, form]);


  const processSubmit = async (values: DataFormValues) => {
    const finalSubmitValues = {
        ...values, 
        taux: values.taux === '' || values.taux === undefined || values.taux === null ? undefined : Number(values.taux),
    };
    onSubmitSuccess(finalSubmitValues, selectedFile); 
  };
  
  const isLoading = isSubmittingExternal;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(processSubmit)} className="space-y-8">
        <Card>
            <CardHeader><CardTitle className="flex items-center"><ImageIcon className="mr-2 h-5 w-5 text-primary" />Tableau de référence des prix</CardTitle></CardHeader>
            <CardContent>
                <FileUpload
                    key={form.getValues('imageUrl') || 'file-upload'}
                    onFileSelect={(file) => {
                        setSelectedFile(file);
                    }}
                    initialImageUrl={form.watch('imageUrl')} 
                    onImageCleared={() => {
                        form.setValue('imageUrl', null, { shouldDirty: true }); 
                        setSelectedFile(null); 
                    }}
                />
            </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Détails de l'entreprise</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" />Adresse</FormLabel>
                    <FormControl><Input placeholder="123 Rue Principale, Ville" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Email</FormLabel>
                        <FormControl><Input type="email" placeholder="contact@exemple.fr" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="telephones"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" />Téléphone</FormLabel>
                        <FormControl><Input type="tel" placeholder="+33 1 23 45 67 89" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="taux"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center"><Coins className="mr-2 h-4 w-4 text-muted-foreground" />Taux de change</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="ex: 5 ou 12.5" {...field}
                        onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        value={field.value ?? ''}
                        /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="dernierMisAJour"
                    render={({ field }) => (
                        <FormItem className="flex flex-col pt-2">
                        <FormLabel className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />Dernier mis à jour (manuel)</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "dd/MM/yyyy", { locale: fr })
                                ) : (
                                    <span>Choisissez une date</span>
                                )}
                                <ShadCalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => field.onChange(date || null)} 
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                                locale={fr}
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>
            <FormField
                control={form.control}
                name="socialMedia.facebook"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center"><Facebook className="mr-2 h-4 w-4 text-muted-foreground" />URL Facebook</FormLabel>
                    <FormControl><Input placeholder="https://facebook.com/votrepage" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="socialMedia.instagram"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center"><Instagram className="mr-2 h-4 w-4 text-muted-foreground" />URL Instagram</FormLabel>
                    <FormControl><Input placeholder="https://instagram.com/votreprofil" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Produits</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: '', category: categoryOptions[0], description: '', price: 0 })}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un produit
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun produit ajouté pour le moment. Cliquez sur "Ajouter un produit" pour commencer.</p>
            )}
            {fields.map((item, index) => (
              <div key={item.id} className="p-4 border rounded-md space-y-4 relative bg-card">
                <FormLabel className="text-lg font-semibold">Produit {index + 1}</FormLabel>
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                    aria-label="Supprimer ce produit"
                  >
                    <Trash2 className="h-4 w-4" />
                 </Button>
                <FormField
                  control={form.control}
                  name={`products.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Package className="mr-2 h-4 w-4 text-muted-foreground" />Nom (Titre)</FormLabel>
                      <FormControl><Input placeholder="Titre du produit (max 20 car.)" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`products.${index}.category`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Tag className="mr-2 h-4 w-4 text-muted-foreground" />Catégorie</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une catégorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoryOptions.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`products.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><FileText className="mr-2 h-4 w-4 text-muted-foreground" />Description</FormLabel>
                      <FormControl><Textarea placeholder="Description (max 60 car.)" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name={`products.${index}.price`}
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />Prix (FC)</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="99.99" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                 </div>
              </div>
            ))}
             {form.formState.errors.products && typeof form.formState.errors.products !== 'string' && !form.formState.errors.products.message && (
                <p className="text-sm font-medium text-destructive">
                  Veuillez corriger les erreurs dans les champs des produits.
                </p>
             )}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size={20} /> : (initialData?.address ? 'Enregistrer les modifications' : 'Enregistrer la configuration')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
