import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderOpen,
  FileText,
  Plus,
  Upload,
  ChevronRight,
  MoreVertical,
  Trash2,
  Download,
  Eye,
  Search,
  Grid,
  List as ListIcon,
  HardDrive,
  FileCode,
  FileImage,
  Loader2,
  ArrowLeft,
  FolderPlus,
  Image as ImageIcon,
  FileUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { filesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Folder {
  _id: string;
  name: string;
  parent_id: string | null;
  is_system: boolean;
  created_at: string;
}

interface FileItem {
  _id: string;
  name: string;
  url: string;
  public_id: string;
  folder_id: string | null;
  file_type: 'image' | 'pdf';
  size: number;
  created_at: string;
}

export default function FileManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentFolderId, setCurrentFolderId] = useState<string | 'root'>('root');
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Queries
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders', currentFolderId],
    queryFn: () => filesApi.getFolders(currentFolderId === 'root' ? undefined : currentFolderId).then(res => res.data),
    refetchInterval: 60000,
  });

  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['files', currentFolderId],
    queryFn: () => filesApi.getFiles(currentFolderId === 'root' ? undefined : currentFolderId).then(res => res.data),
    refetchInterval: 60000,
  });

  // Mutations
  const createFolderMutation = useMutation({
    mutationFn: (name: string) => filesApi.createFolder({ name, parent_id: currentFolderId === 'root' ? undefined : currentFolderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', currentFolderId] });
      setIsNewFolderDialogOpen(false);
      setNewFolderName('');
      toast({ title: 'Folder created successfully' });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: (id: string) => filesApi.deleteFile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', currentFolderId] });
      toast({ title: 'File deleted successfully', variant: 'destructive' });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (currentFolderId !== 'root') {
      formData.append('folder_id', currentFolderId);
    }

    try {
      await filesApi.uploadFile(formData);
      queryClient.invalidateQueries({ queryKey: ['files', currentFolderId] });
      toast({ title: 'File uploaded successfully' });
    } catch (error: any) {
      toast({ 
        title: 'Upload failed', 
        description: error.response?.data?.error || 'Something went wrong',
        variant: 'destructive' 
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const navigateToFolder = (folder: Folder) => {
    setCurrentFolderId(folder._id);
    setFolderPath(prev => [...prev, { id: folder._id, name: folder.name }]);
  };

  const navigateBack = (index: number) => {
    if (index === -1) {
      setCurrentFolderId('root');
      setFolderPath([]);
    } else {
      const newPath = folderPath.slice(0, index + 1);
      setFolderPath(newPath);
      setCurrentFolderId(newPath[newPath.length - 1].id);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFolders = folders.filter((f: Folder) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredFiles = files.filter((f: FileItem) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">File Management</h1>
          <p className="text-slate-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-widest mt-1">Manage your business assets and documents</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-11 rounded-xl gap-2 font-bold uppercase text-[10px] tracking-widest border-zinc-200 dark:border-zinc-800">
                <FolderPlus className="w-4 h-4 text-primary" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-black uppercase tracking-tight">Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Input 
                  placeholder="Folder Name" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="rounded-xl h-12"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewFolderDialogOpen(false)} className="rounded-xl">Cancel</Button>
                <Button 
                  onClick={() => createFolderMutation.mutate(newFolderName)}
                  disabled={!newFolderName || createFolderMutation.isPending}
                  className="rounded-xl px-8"
                >
                  {createFolderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="relative">
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <Button className="h-11 rounded-xl gap-2 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 text-white">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
              Upload File
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation & Toolbar */}
      <Card className="border-none shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <button onClick={() => navigateBack(-1)} className="flex items-center gap-1.5 hover:text-primary transition-colors font-bold uppercase text-[10px] tracking-widest">
                  <HardDrive className="w-3.5 h-3.5" />
                  Root
                </button>
              </BreadcrumbItem>
              {folderPath.map((folder, index) => (
                <div key={folder.id} className="flex items-center gap-2">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <button onClick={() => navigateBack(index)} className="hover:text-primary transition-colors font-bold uppercase text-[10px] tracking-widest">
                      {folder.name}
                    </button>
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <Input 
                placeholder="Search files..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-none text-[11px]"
              />
            </div>
            <div className="flex p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="icon" 
                onClick={() => setViewMode('grid')}
                className="h-7 w-7 rounded-md p-0"
              >
                <Grid className="w-3.5 h-3.5" />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="icon" 
                onClick={() => setViewMode('list')}
                className="h-7 w-7 rounded-md p-0"
              >
                <ListIcon className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        {foldersLoading || filesLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 animate-pulse">Accessing Cloud Files...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {filteredFolders.length === 0 && filteredFiles.length === 0 ? (
               <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl"
              >
                <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mb-6">
                  <FolderOpen className="w-10 h-10 text-zinc-300" />
                </div>
                <h3 className="text-xl font-bold dark:text-white">This folder is empty</h3>
                <p className="text-slate-500 text-sm mt-2">Upload some files or create a subfolder.</p>
              </motion.div>
            ) : viewMode === 'grid' ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
              >
                {/* Folders */}
                {filteredFolders.map((folder: Folder) => (
                  <motion.div
                    key={folder._id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex flex-col items-center p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-primary/50 transition-all cursor-pointer shadow-sm relative"
                    onClick={() => navigateToFolder(folder)}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors",
                      folder.is_system ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" : "bg-primary/10 text-primary"
                    )}>
                      <FolderOpen className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 text-center truncate w-full uppercase tracking-tight">
                      {folder.name}
                    </span>
                    {folder.is_system && (
                      <div className="absolute top-2 right-2">
                        <span className="text-[7px] font-black uppercase bg-amber-500 text-white px-1 py-0.5 rounded shadow-sm">System</span>
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Files */}
                {filteredFiles.map((file: FileItem) => (
                  <motion.div
                    key={file._id}
                    whileHover={{ scale: 1.02 }}
                    className="group flex flex-col p-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-primary/50 transition-all shadow-sm relative overflow-hidden h-full"
                  >
                    <div className="aspect-square rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center overflow-hidden mb-2 border border-zinc-100 dark:border-zinc-800">
                      {file.file_type === 'image' ? (
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-10 h-10 text-zinc-300" />
                      )}
                      
                      {/* Hover Actions */}
                      <div className="absolute inset-x-2 bottom-[4.5rem] flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-md rounded-lg py-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-white hover:bg-white/20"
                          onClick={() => window.open(file.url, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-white hover:bg-white/20"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = file.url;
                            link.download = file.name;
                            link.click();
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-rose-400 hover:bg-rose-500/20"
                          onClick={() => deleteFileMutation.mutate(file._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="px-1 flex flex-col min-h-[3rem]">
                      <span className="text-[10px] font-bold text-slate-800 dark:text-zinc-200 truncate w-full uppercase" title={file.name}>
                        {file.name}
                      </span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter">{file.file_type} • {formatFileSize(file.size)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200 dark:ring-zinc-800 overflow-hidden shadow-sm"
              >
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                    <tr>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-zinc-400">Name</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-zinc-400">Type</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-zinc-400">Size</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-zinc-400">Date Added</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredFolders.map((folder: Folder) => (
                      <tr key={folder._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 cursor-pointer" onClick={() => navigateToFolder(folder)}>
                        <td className="px-6 py-4 flex items-center gap-3">
                          <FolderOpen className={cn("w-4 h-4", folder.is_system ? "text-amber-500" : "text-primary")} />
                          <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{folder.name}</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-tighter">Folder</td>
                        <td className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-tighter">—</td>
                        <td className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-tighter">
                          {format(new Date(folder.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-right">—</td>
                      </tr>
                    ))}
                    {filteredFiles.map((file: FileItem) => (
                      <tr key={file._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-6 py-4 flex items-center gap-3">
                          {file.file_type === 'image' ? <ImageIcon className="w-4 h-4 text-zinc-400" /> : <FileText className="w-4 h-4 text-zinc-400" />}
                          <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[200px]">{file.name}</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-tighter">{file.file_type}</td>
                        <td className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-tighter">{formatFileSize(file.size)}</td>
                        <td className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-tighter">
                          {format(new Date(file.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(file.url, '_blank')}>
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => deleteFileMutation.mutate(file._id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
