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
      <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-800">
            {initialData ? 'Modify Lead Entity' : 'Initialize New Lead'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</Label>
            <Input id="name" {...register('name')} className="rounded-xl border-slate-200 bg-slate-50/50" />
            {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</Label>
            <Input id="email" type="email" {...register('email')} className="rounded-xl border-slate-200 bg-slate-50/50" />
            {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</Label>
              <Select
                onValueChange={(v) => setValue('status', v as LeadStatus)}
                defaultValue={initialData?.status || 'New'}
              >
                <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50/50">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Source</Label>
              <Select
                onValueChange={(v) => setValue('source', v as LeadSource)}
                defaultValue={initialData?.source || 'Website'}
              >
                <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50/50">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs h-11">
              {initialData ? 'Update Entity' : 'Create Entity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
