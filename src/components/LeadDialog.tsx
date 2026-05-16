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
      <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {initialData ? 'Modify Lead Entity' : 'Initialize New Lead'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Full Name</Label>
            <Input id="name" {...register('name')} className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" />
            {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Email Address</Label>
            <Input id="email" type="email" {...register('email')} className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100" />
            {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Status</Label>
              <Select
                onValueChange={(v) => setValue('status', v as LeadStatus)}
                defaultValue={initialData?.status || 'New'}
              >
                <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 uppercase text-[10px] font-bold">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl dark:border-slate-800 dark:bg-slate-900">
                  <SelectItem value="New" className="text-[10px] font-bold uppercase">New</SelectItem>
                  <SelectItem value="Contacted" className="text-[10px] font-bold uppercase">Contacted</SelectItem>
                  <SelectItem value="Qualified" className="text-[10px] font-bold uppercase">Qualified</SelectItem>
                  <SelectItem value="Lost" className="text-[10px] font-bold uppercase">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Source</Label>
              <Select
                onValueChange={(v) => setValue('source', v as LeadSource)}
                defaultValue={initialData?.source || 'Website'}
              >
                <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 uppercase text-[10px] font-bold">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent className="rounded-xl dark:border-slate-800 dark:bg-slate-900">
                  <SelectItem value="Website" className="text-[10px] font-bold uppercase">Website</SelectItem>
                  <SelectItem value="Instagram" className="text-[10px] font-bold uppercase">Instagram</SelectItem>
                  <SelectItem value="Referral" className="text-[10px] font-bold uppercase">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] h-11 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all">
              {initialData ? 'Update Entity' : 'Create Entity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
