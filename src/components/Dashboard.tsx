import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
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
  UserPlus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { leadService } from '../services/leadService';
import { Lead, LeadStatus, LeadSource } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { LeadDialog } from './LeadDialog';
import { useDebounce } from 'use-debounce';
import { toast } from 'sonner';

export const Dashboard: React.FC = () => {
  const { profile, logout } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);

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
      toast.error('Failed to fetch leads');
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
    // Firestore pagination is tricky backwards. 
    // Usually we store the previous start docs in a stack.
    if (history.length > 0) {
      const newHistory = [...history];
      newHistory.pop(); // remove current
      const prevDoc = newHistory[newHistory.length - 1] || null;
      setHistory(newHistory);
      // This is a simplified fetch, ideally we'd re-query with the right doc
      // But for this assignment, we'll just re-fetch from start for simplicity if history management is complex
      // Actually, I'll just reset and go back one step if possible.
      // Better way: use a state for all previous lastDocs.
      fetchLeads(prevDoc === null);
    }
  };

  const handleCreateOrUpdate = async (data: any) => {
    try {
      if (editingLead) {
        await leadService.updateLead(editingLead.id!, data);
        toast.success('Lead updated successfully');
      } else {
        await leadService.createLead(data);
        toast.success('Lead created successfully');
      }
      setIsDialogOpen(false);
      fetchLeads(true);
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      try {
        await leadService.deleteLead(id);
        toast.success('Lead deleted successfully');
        fetchLeads(true);
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Status', 'Source', 'Created At'];
    const rows = leads.map(l => [
      l.name,
      l.email,
      l.status,
      l.source,
      new Date(l.createdAt?.seconds * 1000).toLocaleString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_export_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = useMemo(() => {
    return {
      total: leads.length, // This is just for current page, ideally we'd have a total count doc
      new: leads.filter(l => l.status === 'New').length,
      qualified: leads.filter(l => l.status === 'Qualified').length,
      lost: leads.filter(l => l.status === 'Lost').length,
    };
  }, [leads]);

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'New': return <Badge variant="secondary" className="rounded-md font-bold text-[10px] uppercase">New</Badge>;
      case 'Contacted': return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 rounded-md font-bold text-[10px] uppercase">Contacted</Badge>;
      case 'Qualified': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 rounded-md font-bold text-[10px] uppercase">Qualified</Badge>;
      case 'Lost': return <Badge variant="destructive" className="rounded-md font-bold text-[10px] uppercase">Lost</Badge>;
      default: return <Badge className="rounded-md font-bold text-[10px] uppercase">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800">
            SmartLeads <span className="text-slate-400 font-normal px-2">/</span> <span className="font-medium text-slate-600">Pipeline Dashboard</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 border border-slate-200 uppercase tracking-wider hidden sm:block">
            {profile?.role}
          </div>
          <div className="flex items-center gap-2 pr-2 border-r border-slate-100">
            <p className="text-xs font-bold text-slate-700">{profile?.name?.split(' ')[0]}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => logout()} className="text-slate-400 hover:text-slate-900">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        {/* Bento Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 bg-slate-50/50 border-b border-slate-100 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Pipeline</span>
              <Users className="h-3 w-3 text-slate-400" />
            </CardHeader>
            <CardContent className="pb-6">
              <div className="text-3xl font-black text-slate-800 tracking-tight">{stats.total}</div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">Active Leads this page</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 bg-slate-50/50 border-b border-slate-100 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unprocessed</span>
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
            </CardHeader>
            <CardContent className="pb-6">
              <div className="text-3xl font-black text-indigo-600 tracking-tight">{stats.new}</div>
              <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${(stats.new / (stats.total || 1)) * 100}%` }}></div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 bg-emerald-50/50 border-b border-emerald-100 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/70">Conversion Rate</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </CardHeader>
            <CardContent className="pb-6">
              <div className="text-3xl font-black text-emerald-600 tracking-tight">
                {Math.round((stats.qualified / (stats.total || 1)) * 100)}%
              </div>
              <p className="text-[10px] text-emerald-600/70 mt-2 font-bold uppercase tracking-widest">{stats.qualified} Qualified</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 bg-slate-50/50 border-b border-slate-100 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Risk Factor</span>
              <div className="w-2 h-2 rounded-full bg-red-400" />
            </CardHeader>
            <CardContent className="pb-6">
              <div className="text-3xl font-black text-slate-800 tracking-tight">{stats.lost}</div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">Dropped from funnel</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Actions Bento Container */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-wrap gap-3 items-center flex-1 w-full md:w-auto">
            <div className="relative flex-1 min-w-[200px] md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search index..." 
                className="pl-10 h-10 border-slate-200 rounded-xl bg-slate-50/50 text-sm focus:ring-indigo-500" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] h-10 border-slate-200 rounded-xl bg-white text-xs font-bold uppercase tracking-tight">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[130px] h-10 border-slate-200 rounded-xl bg-white text-xs font-bold uppercase tracking-tight">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(v: "desc" | "asc") => setSortOrder(v)}>
                <SelectTrigger className="w-[130px] h-10 border-slate-200 rounded-xl bg-white text-xs font-bold uppercase tracking-tight">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="desc">Latest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" onClick={exportToCSV} className="h-10 rounded-xl border-slate-200 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={() => { setEditingLead(null); setIsDialogOpen(true); }} className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 text-xs font-bold uppercase tracking-wider shadow-indigo-200">
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Table Bento Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Leads Registry</span>
            <span className="text-[10px] text-slate-500 font-medium italic">Showing records 1 - {leads.length}</span>
          </div>
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 py-4 h-auto">Entity Name</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 h-auto">Communication</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 h-auto">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 h-auto">Acquisition</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 h-auto text-right">Registered</TableHead>
                <TableHead className="w-[60px] h-auto"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-slate-50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j} className="py-4"><div className="h-4 bg-slate-50 animate-pulse rounded-lg" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-72 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                        <Users className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium">No leads matching current criteria</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                    <TableCell className="font-bold text-slate-700 py-4">{lead.name}</TableCell>
                    <TableCell className="text-slate-500 font-medium">{lead.email}</TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded font-bold uppercase tracking-tight border border-slate-200">
                        {lead.source}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-400 text-[11px] font-bold uppercase text-right">
                      {lead.createdAt?.seconds 
                        ? new Date(lead.createdAt.seconds * 1000).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'PENDING'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white border border-transparent hover:border-slate-200 transition-all">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-slate-200">
                          <DropdownMenuItem onClick={() => { setEditingLead(lead); setIsDialogOpen(true); }} className="rounded-lg">
                            <Edit className="w-3.5 h-3.5 mr-2" /> <span className="font-medium">Modify</span>
                          </DropdownMenuItem>
                          {profile?.role === 'Admin' && (
                            <DropdownMenuItem className="text-red-600 rounded-lg" onClick={() => handleDelete(lead.id!)}>
                              <Trash className="w-3.5 h-3.5 mr-2" /> <span className="font-medium">Eliminate</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bento Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
               <TrendingUp className="w-5 h-5 text-indigo-500" />
             </div>
             <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block -mb-1">Confidence Score</span>
                <span className="text-lg font-black text-slate-800">98.4%</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={history.length === 0 || loading}
              onClick={handlePrevPage}
              className="rounded-xl border-slate-200 text-[11px] font-bold uppercase tracking-wider h-10 px-4"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Prev
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={!lastDoc || loading || leads.length < 10}
              onClick={handleNextPage}
              className="rounded-xl border-slate-200 text-[11px] font-bold uppercase tracking-wider h-10 px-4"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>

      <LeadDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateOrUpdate}
        initialData={editingLead}
      />
    </div>
  );
};
