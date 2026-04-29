import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../components/ui/use-toast';

const STATUS_COLORS = {
  pending: 'secondary',
  in_progress: 'default',
  completed: 'default',
  cancelled: 'destructive',
};

const PRIORITY_COLORS = {
  low: 'secondary',
  medium: 'default',
  high: 'destructive',
};

const STATUS_FLOW = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function ResearchRequestsView({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [users, setUsers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', requester_id: '', researcher_id: '',
    priority: 'medium', due_date: '', tags: '',
  });
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      const data = await api.getResearchRequests(params);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, filters, toast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    api.getUsers({ limit: 100 }).then(data => setUsers(data.items || [])).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '', description: '',
      requester_id: user?.id?.toString() || '',
      researcher_id: '', priority: 'medium', due_date: '', tags: '',
    });
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description || '',
      requester_id: item.requester_id?.toString() || '',
      researcher_id: item.researcher_id?.toString() || '',
      priority: item.priority,
      due_date: item.due_date || '',
      tags: item.tags || '',
    });
    setDialogOpen(true);
  };

  const openDetail = async (item) => {
    try {
      const data = await api.getResearchRequest(item.id);
      setSelected(data);
      setDetailOpen(true);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        requester_id: parseInt(form.requester_id) || null,
        researcher_id: form.researcher_id ? parseInt(form.researcher_id) : null,
      };
      if (editing) {
        await api.updateResearchRequest(editing.id, payload);
        toast({ title: 'Research request updated' });
      } else {
        await api.createResearchRequest(payload);
        toast({ title: 'Research request created' });
      }
      setDialogOpen(false);
      fetchItems();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this research request?')) return;
    try {
      await api.deleteResearchRequest(id);
      toast({ title: 'Deleted' });
      fetchItems();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.updateResearchRequestStatus(id, { status });
      toast({ title: `Status updated to ${status.replace(/_/g, ' ')}` });
      if (selected?.id === id) {
        const data = await api.getResearchRequest(id);
        setSelected(data);
      }
      fetchItems();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const researchers = users.filter(u => ['researcher', 'admin', 'analyst'].includes(u.role));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Research Requests</h1>
        <Button onClick={openCreate}>+ New Request</Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-3 flex-wrap">
            <Input
              placeholder="Search..."
              value={filters.search}
              onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
              className="w-56"
            />
            <Select value={filters.status} onValueChange={v => { setFilters(f => ({ ...f, status: v === 'all' ? '' : v })); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Research Requests ({total})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No research requests found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Researcher</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>#{item.id}</TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <Badge variant={PRIORITY_COLORS[item.priority] || 'secondary'}>{item.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[item.status] || 'secondary'}>
                        {item.status?.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.requester_name || '-'}</TableCell>
                    <TableCell>{item.researcher_name || <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                    <TableCell>{item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openDetail(item)}>View</Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(item)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>Del</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {total > 20 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <span className="py-1 px-2 text-sm">Page {page}</span>
              <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Research Request' : 'New Research Request'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Requester *</Label>
                <Select value={form.requester_id} onValueChange={v => setForm(f => ({ ...f, requester_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Researcher</Label>
                <Select value={form.researcher_id} onValueChange={v => setForm(f => ({ ...f, researcher_id: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {researchers.map(u => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Tags</Label>
              <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="comma-separated" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Research Request #{selected?.id}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selected.title}</h3>
                <div className="flex gap-2 mt-1">
                  <Badge variant={STATUS_COLORS[selected.status] || 'secondary'}>
                    {selected.status?.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant={PRIORITY_COLORS[selected.priority] || 'secondary'}>{selected.priority}</Badge>
                </div>
              </div>

              {selected.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm mt-1">{selected.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Requester</p>
                  <p>{selected.requester_name || '-'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Researcher</p>
                  <p>{selected.researcher_name || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Due Date</p>
                  <p>{selected.due_date ? new Date(selected.due_date).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Tags</p>
                  <p>{selected.tags || '-'}</p>
                </div>
              </div>

              {selected.findings && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Findings</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selected.findings}</p>
                </div>
              )}

              {selected.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selected.notes}</p>
                </div>
              )}

              {STATUS_FLOW[selected.status]?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Update Status</p>
                  <div className="flex gap-2">
                    {STATUS_FLOW[selected.status].map(s => (
                      <Button
                        key={s}
                        size="sm"
                        variant={s === 'cancelled' ? 'destructive' : 'default'}
                        onClick={() => handleStatusChange(selected.id, s)}
                      >
                        {s.replace(/_/g, ' ')}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
