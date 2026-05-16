import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Search, 
  Download, 
  LogOut, 
  MoreVertical,
  Edit,
  Trash,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  UserCheck,
  UserX,
  UserPlus,
  Sun,
  Moon,
  Sparkles,
  PieChart as PieChartIcon,
  Phone
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { leadService } from '../services/leadService';
import { Lead, LeadStatus, LeadSource } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  where, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { geminiService } from '../services/geminiService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { LeadDialog } from './LeadDialog';
import { useDebounce } from 'use-debounce';
import { toast } from 'sonner';

export const Dashboard: React.FC = () => {
  const { profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  // Real-time synchronization
  useEffect(() => {
    const q = query(
      collection(db, 'leads'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allLeads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      
      // Update local state if no active filtering/searching that requires complex server logic
      if (!searchTerm && statusFilter === 'all' && sourceFilter === 'all') {
        setLeads(allLeads.slice(0, 10));
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [searchTerm, statusFilter, sourceFilter]);

  const fetchLeads = async (reset = false) => {
    setLoading(true);
    try {
      const result = await leadService.getLeads({
        status: statusFilter,
        source: sourceFilter,
        search: debouncedSearch,
        lastDoc: reset ? null : lastDoc,
        pageSize: 10,
        sortOrder
      });
      if (result) {
        setLeads(result.leads);
        setLastDoc(result.lastDoc);
        if (reset) setHistory([]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Performance degradation: Connection failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(true);
  }, [statusFilter, sourceFilter, debouncedSearch, sortOrder]);

  const handleNextPage = () => {
    if (lastDoc) {
      setHistory([...history, lastDoc]);
      fetchLeads();
    }
  };

  const handlePrevPage = () => {
    if (history.length > 0) {
      const newHistory = [...history];
      newHistory.pop();
      const prevDoc = newHistory[newHistory.length - 1] || null;
      setHistory(newHistory);
      fetchLeads(prevDoc === null);
    }
  };

  const handleCreateOrUpdate = async (data: any) => {
    try {
      if (editingLead) {
        await leadService.updateLead(editingLead.id!, data);
        toast.success('Entity synchronization successful');
      } else {
        await leadService.createLead(data);
        toast.success('Entity initialization successful');
      }
      setIsDialogOpen(false);
      fetchLeads(true);
    } catch (error) {
      toast.error('Operation failure: Data integrity violation');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Initiate entity elimination? This action is irreversible.')) {
      try {
        await leadService.deleteLead(id);
        toast.success('Entity elimination confirmed');
        fetchLeads(true);
      } catch (error) {
        toast.error('Elimination failed: Insufficient clearance');
      }
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Source', 'Notes', 'Created At'];
    const rows = leads.map(l => [
      l.name,
      l.email,
      l.phone,
      l.status,
      l.source,
      l.notes || '',
      new Date(l.createdAt?.seconds * 1000).toLocaleString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nexus_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data extraction complete');
  };

  const handleAIAnalysis = async (lead: Lead) => {
    if (!lead.id) return;
    setAnalyzingId(lead.id);
    try {
      const insight = await geminiService.analyzeLead(lead);
      // Update local state temporarily to show result
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, smartInsight: insight } : l));
      toast.success('Intelligence analysis complete');
    } catch (error) {
      toast.error('AI Protocol failure');
    } finally {
      setAnalyzingId(null);
    }
  };

  const stats = useMemo(() => {
    const distribution = [
      { name: 'New', value: leads.filter(l => l.status === 'New').length, color: '#6366f1' },
      { name: 'Contacted', value: leads.filter(l => l.status === 'Contacted').length, color: '#8b5cf6' },
      { name: 'Qualified', value: leads.filter(l => l.status === 'Qualified').length, color: '#10b981' },
      { name: 'Lost', value: leads.filter(l => l.status === 'Lost').length, color: '#ef4444' },
    ].filter(d => d.value > 0);

    return {
      total: leads.length,
      new: leads.filter(l => l.status === 'New').length,
      qualified: leads.filter(l => l.status === 'Qualified').length,
      lost: leads.filter(l => l.status === 'Lost').length,
      distribution
    };
  }, [leads]);

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'New': return <Badge variant="secondary" className="rounded-md font-bold text-[10px] uppercase">New</Badge>;
      case 'Contacted': return <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 rounded-md font-bold text-[10px] uppercase">Contacted</Badge>;
      case 'Qualified': return <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 rounded-md font-bold text-[10px] uppercase">Qualified</Badge>;
      case 'Lost': return <Badge variant="destructive" className="rounded-md font-bold text-[10px] uppercase">Lost</Badge>;
      default: return <Badge className="rounded-md font-bold text-[10px] uppercase">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 font-sans selection:bg-primary/30 selection:text-primary-foreground relative overflow-hidden">
      {/* High-Tech Background & Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-[0.03] grayscale brightness-50 mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      
      {/* Aesthetic Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[140px]" />
      </div>

      <nav className="sticky top-0 z-50 px-6 py-6 transition-all">
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-7xl mx-auto bg-card/60 backdrop-blur-2xl border border-border/50 rounded-[2.5rem] p-3 pl-8 shadow-2xl shadow-primary/5 flex items-center justify-between"
        >
          <div className="flex items-center gap-5 group">
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="w-14 h-14 bg-primary text-primary-foreground rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-primary/30 relative overflow-hidden active:scale-95"
            >
               <TrendingUp className="w-7 h-7 relative z-10" />
               <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter leading-none italic">SmartLeads <span className="text-primary italic">Nexus</span></span>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 mt-1">Management Terminal v2.4</span>
            </div>
          </div>

          <div className="flex items-center gap-4 pr-2">
            <div className="hidden md:flex flex-col items-end mr-4">
               <span className="text-[10px] font-black text-foreground uppercase tracking-widest leading-none">System Status</span>
               <div className="flex items-center gap-2 mt-1">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Operational</span>
               </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme} 
              className="rounded-2xl w-12 h-12 text-muted-foreground hover:text-primary transition-all hover:bg-primary/5 active:scale-90"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="ghost" 
                onClick={() => logout()}
                className="rounded-2xl h-12 px-5 text-muted-foreground hover:text-red-500 transition-all font-black text-[10px] uppercase tracking-widest hover:bg-red-500/5 group"
              >
                <LogOut className="w-4 h-4 mr-3 group-hover:-translate-x-1 transition-transform" />
                Terminate
              </Button>
            </motion.div>

            <div className="w-[1px] h-8 bg-border/50 mx-2" />

            <div className="flex items-center gap-3 pl-2 py-1 pr-1 bg-secondary/30 rounded-2xl border border-border/50">
              <div className="flex flex-col items-end text-[9px] font-black uppercase tracking-widest mr-1">
                <span className="text-foreground/80">{profile?.name?.split(' ')[0]}</span>
                <span className="text-[8px] text-muted-foreground/40">Level 4 Access</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary border-2 border-background shadow-lg overflow-hidden group/avatar relative">
               <div className="w-full h-full flex items-center justify-center text-[12px] font-black text-primary-foreground">
                  {profile?.name?.[0].toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-8 z-10 transition-all">
        {/* Bento Stats Grid */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 flex-1">
            {[
              { label: 'Pipeline', value: stats.total, icon: Users, color: 'text-primary', bg: 'bg-primary/5', trend: 'Record Count' },
              { label: 'New Entities', value: stats.new, icon: UserPlus, color: 'text-indigo-500', bg: 'bg-indigo-500/5', progress: true, trend: 'Active Leads' },
              { label: 'Conversion', value: `${Math.round((stats.qualified / (stats.total || 1)) * 100)}%`, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/5', trend: `${stats.qualified} Qualified` },
              { label: 'Risk factor', value: stats.lost, icon: UserX, color: 'text-red-500', bg: 'bg-red-500/5', trend: 'Lost Potential' }
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              >
                <Card className="rounded-[2rem] border-border shadow-md overflow-hidden bg-card hover:shadow-2xl transition-all duration-500 group border-border/50">
                  <CardHeader className={`flex flex-row items-center justify-between space-y-0 p-5 pb-3 ${stat.bg} border-b border-border/30`}>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</span>
                    <stat.icon className={`h-4 w-4 ${stat.color} opacity-70 group-hover:scale-125 group-hover:rotate-6 transition-all duration-500`} />
                  </CardHeader>
                  <CardContent className="pt-6 pb-8">
                    <div className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter">{stat.value}</div>
                    {stat.progress ? (
                      <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden border border-border/50">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(stats.new / (stats.total || 1)) * 100}%` }}
                          transition={{ duration: 1.5, delay: 0.5, ease: "circOut" }}
                          className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-3">
                        <Sparkles className={`w-3 h-3 ${stat.color} opacity-40`} />
                        <p className={`text-[10px] ${stat.color} font-bold uppercase tracking-widest opacity-80`}>{stat.trend}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-[350px]"
          >
            <Card className="rounded-[2.5rem] border-border shadow-2xl bg-card overflow-hidden h-full flex flex-col">
              <CardHeader className="p-6 pb-2">
                 <div className="flex items-center gap-3">
                   <PieChartIcon className="w-4 h-4 text-primary" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Nexus Distribution</span>
                 </div>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center p-0">
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                          border: 'none', 
                          borderRadius: '12px',
                          fontSize: '10px',
                          color: '#fff'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <div className="p-6 pt-0 border-t border-border/10">
                 <div className="grid grid-cols-2 gap-4 mt-6">
                    {stats.distribution.map((d) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/80">{d.name}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Filters & Actions Bento Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-card/40 backdrop-blur-xl p-5 sm:p-6 rounded-[2.5rem] border border-border shadow-2xl flex flex-col lg:flex-row gap-6 justify-between items-stretch lg:items-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center flex-1 z-10">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Query database..." 
                className="pl-12 h-14 border-border/50 rounded-[1.25rem] bg-background/50 text-sm focus:ring-primary/20 focus:border-primary transition-all shadow-inner focus:bg-background" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 sm:flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-14 border-border/50 rounded-[1.25rem] bg-background text-[10px] font-bold uppercase tracking-[0.15em] sm:w-[150px] focus:ring-primary/20 shadow-sm hover:bg-secondary/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-[1.25rem] border-border shadow-2xl p-2 bg-card/95 backdrop-blur-lg">
                  <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">All Statuses</SelectItem>
                  <SelectItem value="New" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">New</SelectItem>
                  <SelectItem value="Contacted" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">Contacted</SelectItem>
                  <SelectItem value="Qualified" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">Qualified</SelectItem>
                  <SelectItem value="Lost" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">Lost</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="h-14 border-border/50 rounded-[1.25rem] bg-background text-[10px] font-bold uppercase tracking-[0.15em] sm:w-[150px] focus:ring-primary/20 shadow-sm hover:bg-secondary/50">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent className="rounded-[1.25rem] border-border shadow-2xl p-2 bg-card/95 backdrop-blur-lg">
                  <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">All Sources</SelectItem>
                  <SelectItem value="Website" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">Website</SelectItem>
                  <SelectItem value="Instagram" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">Instagram</SelectItem>
                  <SelectItem value="LinkedIn" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">LinkedIn</SelectItem>
                  <SelectItem value="Facebook" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">Facebook</SelectItem>
                  <SelectItem value="Cold Call" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">Cold Call</SelectItem>
                  <SelectItem value="Referral" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 z-10">
            <Select value={sortOrder} onValueChange={(v: "desc" | "asc") => setSortOrder(v)}>
              <SelectTrigger className="flex-1 lg:w-[140px] h-14 border-border/50 rounded-[1.25rem] bg-background text-[10px] font-bold uppercase tracking-[0.15em] hidden sm:flex focus:ring-primary/20 shadow-sm hover:bg-secondary/50">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent className="rounded-[1.25rem] border-border shadow-2xl p-2 bg-card/95 backdrop-blur-lg">
                <SelectItem value="desc" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">Latest Entries</SelectItem>
                <SelectItem value="asc" className="text-[10px] font-bold uppercase tracking-widest rounded-lg">Oldest Entries</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToCSV} 
              className="h-14 rounded-[1.25rem] border-border/50 px-6 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground hover:bg-secondary transition-all active:scale-95 shadow-sm group/btn"
            >
              <Download className="w-4 h-4 sm:mr-3 group-hover/btn:translate-y-0.5 transition-transform" />
              <span className="hidden sm:inline">CSV Export</span>
            </Button>
            <Button 
              size="sm" 
              onClick={() => { setEditingLead(null); setIsDialogOpen(true); }} 
              className="h-14 flex-1 lg:flex-none rounded-[1.25rem] bg-primary hover:primary/90 px-8 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground shadow-[0_10px_30px_rgba(var(--primary),0.2)] transition-all active:scale-95 group/add"
            >
              <Plus className="w-4 h-4 mr-3 group-hover/add:rotate-90 transition-transform duration-500" />
              Initialize Entity
            </Button>
          </div>
        </motion.div>

        {/* Table Bento Container */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="bg-card/50 backdrop-blur-sm rounded-[3rem] border border-border shadow-2xl overflow-hidden group transition-all duration-500 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
          
          <div className="p-8 border-b border-border flex justify-between items-center bg-secondary/30 relative">
            <div className="flex items-center gap-4">
              <div className="w-3 h-8 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
              <div>
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">Entity Registry Interface</span>
                <p className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-[0.1em] mt-0.5 italic">Synchronized at {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
            <div className="hidden xs:flex items-center gap-5">
               <div className="flex -space-x-2">
                 {Array.from({ length: 3 }).map((_, i) => (
                   <div key={i} className="w-7 h-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[8px] font-bold" style={{ zIndex: 3-i }}>{['JD', 'MS', 'AK'][i]}</div>
                 ))}
               </div>
               <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                 Active Agents
               </span>
            </div>
          </div>
          
          <div className="overflow-x-auto relative">
            <Table>
              <TableHeader className="bg-secondary/40 backdrop-blur-md">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 py-6 px-10 h-auto">Entity Persona</TableHead>
                  <TableHead className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 h-auto">Communications</TableHead>
                  <TableHead className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 h-auto">Status Matrix</TableHead>
                  <TableHead className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 h-auto text-center">Nexus Intel</TableHead>
                  <TableHead className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 h-auto text-right pr-10">Registration</TableHead>
                  <TableHead className="w-[100px] h-auto pr-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`} className="border-border/30">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j} className="py-8 px-10"><div className="h-6 bg-secondary/60 animate-pulse rounded-xl" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-96 text-center">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-6 py-16"
                      >
                        <div className="w-24 h-24 rounded-[2rem] bg-secondary flex items-center justify-center border border-border shadow-inner relative">
                          <Users className="w-10 h-10 text-muted-foreground/20" />
                          <div className="absolute top-0 right-0 w-3 h-3 bg-red-400 rounded-full animate-ping" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-lg font-black text-foreground tracking-tight">NULL ENTITIES DETECTED</p>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.1em]">Adjust synchronization parameters or initialize a record.</p>
                        </div>
                        <Button 
                          onClick={() => { setEditingLead(null); setIsDialogOpen(true); }}
                          variant="outline" 
                          className="rounded-2xl border-primary/30 text-primary hover:bg-primary/5 h-12 uppercase text-[10px] font-black tracking-widest px-8"
                        >
                          Initialize New record
                        </Button>
                      </motion.div>
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead, index) => (
                    <motion.tr
                      layout
                      key={lead.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                      transition={{ delay: index * 0.05, duration: 0.5, ease: "easeOut" }}
                      className="hover:bg-primary/[0.02] border-border/30 group/row transition-all duration-500 text-sm"
                    >
                      <TableCell className="font-bold text-foreground py-7 px-10 leading-tight">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-2xl bg-secondary group-hover/row:bg-primary/10 flex items-center justify-center text-[10px] font-black text-muted-foreground group-hover/row:text-primary transition-all duration-500">
                             {lead.name.split(' ').map(n => n[0]).join('')}
                           </div>
                           <div className="flex flex-col">
                             <span className="text-[13px] font-bold tracking-tight">{lead.name}</span>
                             <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-[0.05em] opacity-60">{lead.source}</span>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-medium tracking-tight">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                             <span className="text-[11px]">{lead.email}</span>
                          </div>
                          <div className="flex items-center gap-2 opacity-60">
                             <Phone className="w-2.5 h-2.5" />
                             <span className="text-[10px]">{lead.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{getStatusBadge(lead.status)}</TableCell>
                      <TableCell className="text-center">
                        {lead.smartInsight ? (
                          <div className="max-w-[200px] text-[9px] text-left mx-auto bg-secondary/50 p-2 rounded-lg border border-primary/10 italic text-muted-foreground line-clamp-2 hover:line-clamp-none transition-all">
                            {lead.smartInsight}
                          </div>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={analyzingId === lead.id}
                            onClick={() => handleAIAnalysis(lead)}
                            className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 group/ai"
                          >
                            {analyzingId === lead.id ? (
                              <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            ) : (
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-3 h-3 group-hover/ai:animate-pulse" />
                                Extract Intel
                              </div>
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-[10px] font-black uppercase text-right pr-10 whitespace-nowrap opacity-60 group-hover/row:opacity-90 transition-opacity">
                        {lead.createdAt?.seconds 
                          ? new Date(lead.createdAt.seconds * 1000).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'PENDING'}
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-11 w-11 hover:bg-background border border-transparent hover:border-border transition-all rounded-[0.8rem] group-hover/row:shadow-md">
                              <MoreVertical className="w-5 h-5 text-muted-foreground opacity-40 group-hover/row:opacity-100 transition-opacity" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-[1.25rem] border-border p-2 bg-card shadow-[0_20px_50px_rgba(0,0,0,0.2)] min-w-[180px] backdrop-blur-xl">
                            <DropdownMenuItem onClick={() => { setEditingLead(lead); setIsDialogOpen(true); }} className="rounded-xl cursor-pointer p-3.5 focus:bg-primary/10 focus:text-primary mb-1">
                              <Edit className="w-4 h-4 mr-3 opacity-60" /> <span className="font-bold uppercase text-[10px] tracking-[0.2em]">Synchronize</span>
                            </DropdownMenuItem>
                            {profile?.role === 'Admin' && (
                              <DropdownMenuItem className="text-red-500 rounded-xl cursor-pointer p-3.5 focus:bg-red-500/10 focus:text-red-500" onClick={() => handleDelete(lead.id!)}>
                                <Trash className="w-4 h-4 mr-3 opacity-60" /> <span className="font-bold uppercase text-[10px] tracking-[0.2em]">Eliminate</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </motion.div>

        {/* Confidence Footer Card */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="bg-card/40 backdrop-blur-lg p-7 rounded-[3rem] border border-border shadow-md flex flex-col sm:flex-row items-center justify-between gap-8 relative overflow-hidden"
        >
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          
          <div className="flex items-center gap-5 self-start sm:self-auto">
             <div className="w-14 h-14 bg-primary/10 rounded-[1.25rem] flex items-center justify-center border border-primary/20 shadow-inner group">
               <TrendingUp className="w-7 h-7 text-primary group-hover:scale-110 transition-transform" />
             </div>
             <div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 block -mb-0.5">Integrity Metric</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-foreground tracking-tighter">98.4<span className="text-primary">%</span></span>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">+2.1% OPTIMAL</span>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={history.length === 0 || loading}
              onClick={handlePrevPage}
              className="flex-1 sm:flex-none rounded-[1.25rem] border-border bg-background/50 text-[10px] font-black uppercase tracking-[0.25em] h-14 px-10 hover:bg-secondary transition-all active:scale-95 shadow-sm border-border/50"
            >
              <ChevronLeft className="w-4 h-4 mr-3" />
              Prev
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={!lastDoc || loading || leads.length < 10}
              onClick={handleNextPage}
              className="flex-1 sm:flex-none rounded-[1.25rem] border-border bg-background/50 text-[10px] font-black uppercase tracking-[0.25em] h-14 px-10 hover:bg-secondary transition-all active:scale-95 shadow-sm border-border/50"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-3" />
            </Button>
          </div>
        </motion.div>
      </main>

      {/* Decorative Brand Footer */}
      <footer className="p-12 mt-12 mb-8 flex flex-col items-center gap-6 opacity-30 hover:opacity-100 transition-all duration-700">
        <div className="flex items-center gap-5">
           <div className="w-16 h-[1px] bg-gradient-to-l from-foreground/40 to-transparent" />
           <div className="w-4 h-4 bg-foreground rounded-full animate-pulse border-4 border-background" />
           <div className="w-16 h-[1px] bg-gradient-to-r from-foreground/40 to-transparent" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-black tracking-[0.8em] uppercase text-foreground/80 mr-[-0.8em]">Aura Systems Nexus</span>
          <p className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-[0.3em]">Advanced Pipeline Intelligence v2.4.0</p>
        </div>
        <div className="text-[8px] text-muted-foreground/40 uppercase tracking-widest font-medium">
          SECURE PROTOCOL ENABLED // {new Date().getFullYear()}
        </div>
      </footer>

      <LeadDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateOrUpdate}
        initialData={editingLead || undefined}
      />
    </div>
  );
};
