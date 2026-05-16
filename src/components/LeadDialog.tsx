import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { Plus } from 'lucide-react';
import { Lead, LeadStatus, LeadSource } from '../types';

const leadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  status: z.enum(['New', 'Contacted', 'Qualified', 'Lost']),
  source: z.enum(['Website', 'Instagram', 'Referral']),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: LeadFormValues) => void;
  initialData?: Lead | null;
}

export const LeadDialog: React.FC<LeadDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      email: '',
      status: 'New',
      source: 'Website',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        email: initialData.email,
        status: initialData.status,
        source: initialData.source,
      });
    } else {
      reset({
        name: '',
        email: '',
        status: 'New',
        source: 'Website',
      });
    }
  }, [initialData, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] border-border bg-card/95 backdrop-blur-2xl shadow-3xl p-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-transparent via-primary to-transparent" />
        
        <div className="p-8 pb-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                 <Plus className="w-4 h-4 text-primary" />
               </div>
               {initialData ? 'Synchronize Entity' : 'Initialize Nexus Record'}
            </DialogTitle>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1 pl-11">
               Protocol: {initialData ? 'Modification' : 'Creation'} Sequence
            </p>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-8 pb-10 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1">Full Name Persona</Label>
            <Input id="name" {...register('name')} className="h-14 rounded-2xl border-border/50 bg-secondary/30 focus:bg-background transition-all focus:ring-primary/20 text-sm font-medium" placeholder="Identity entry..." />
            {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider pl-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1">Communication Node (Email)</Label>
            <Input id="email" type="email" {...register('email')} className="h-14 rounded-2xl border-border/50 bg-secondary/30 focus:bg-background transition-all focus:ring-primary/20 text-sm font-medium" placeholder="Node address..." />
            {errors.email && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider pl-1">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1">Status Matrix</Label>
              <Select
                onValueChange={(v) => setValue('status', v as LeadStatus)}
                defaultValue={initialData?.status || 'New'}
              >
                <SelectTrigger className="h-14 rounded-2xl border-border/50 bg-secondary/30 text-[10px] font-black uppercase tracking-widest focus:ring-primary/20">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border shadow-2xl p-2 bg-card/95 backdrop-blur-lg">
                  <SelectItem value="New" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">New</SelectItem>
                  <SelectItem value="Contacted" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">Contacted</SelectItem>
                  <SelectItem value="Qualified" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">Qualified</SelectItem>
                  <SelectItem value="Lost" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1">Acquisition Origin</Label>
              <Select
                onValueChange={(v) => setValue('source', v as LeadSource)}
                defaultValue={initialData?.source || 'Website'}
              >
                <SelectTrigger className="h-14 rounded-2xl border-border/50 bg-secondary/30 text-[10px] font-black uppercase tracking-widest focus:ring-primary/20">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border shadow-2xl p-2 bg-card/95 backdrop-blur-lg">
                  <SelectItem value="Website" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">Website</SelectItem>
                  <SelectItem value="Instagram" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">Instagram</SelectItem>
                  <SelectItem value="Referral" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full h-16 bg-primary hover:primary/90 text-primary-foreground rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
              {initialData ? 'Execute Update' : 'Initialize Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
