import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { X, ExternalLink, Calendar, User, Users, Tag, FileText, MessageSquare, CheckCircle2, Clock, AlertCircle, Video, Image as ImageIcon } from 'lucide-react';
import type { ProjectTask, CustomProperty } from '@/lib/types/project-tasks';
import { format } from 'date-fns';
import { useState, useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { MediaViewer } from './MediaViewer';

interface TaskDetailViewProps {
  task: ProjectTask | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  customProperties: CustomProperty[];
  members: Array<{
    id: string;
    user_id: string;
    user: {
      full_name?: string;
      avatar_url?: string;
    };
  }>;
}

const supabase = getSupabaseClient();

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'in-progress':
      return <Clock className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'P1':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'P2':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'P3':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'P4':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

export function TaskDetailView({ 
  task, 
  isOpen, 
  onClose, 
  onEdit,
  customProperties,
  members 
}: TaskDetailViewProps) {
  const [viewingMedia, setViewingMedia] = useState<{ url: string; type: 'image' | 'video'; fileName?: string } | null>(null);

  if (!task) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'PPpp');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'PPp');
    } catch {
      return dateString;
    }
  };

  const getAssigneeName = () => {
    if (task.assignee?.full_name) return task.assignee.full_name;
    if (task.assigned_to) {
      const member = members.find(m => m.user_id === task.assigned_to);
      return member?.user.full_name || 'Unknown';
    }
    return 'Unassigned';
  };

  const getCreatorName = () => {
    if (task.creator?.full_name) return task.creator.full_name;
    return 'Unknown';
  };

  const renderCustomPropertyValue = (prop: CustomProperty, value: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground italic">Not set</span>;
    }

    switch (prop.property_type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            {value ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200">
                Yes
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                No
              </Badge>
            )}
          </div>
        );
      case 'tags':
        const tags = Array.isArray(value) ? value : [value];
        return (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: string, idx: number) => (
              <Badge key={idx} variant="secondary">{tag}</Badge>
            ))}
          </div>
        );
      case 'dropdown':
        return <Badge variant="outline">{String(value)}</Badge>;
      case 'date':
        return <span>{formatDate(String(value))}</span>;
      case 'url':
        return (
          <a
            href={String(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            {String(value)}
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      case 'media':
        const mediaFiles = Array.isArray(value) ? value : (value ? [value] : []);
        
        // Helper function to get media URL
        const getMediaUrlAsync = async (mediaItem: any): Promise<string> => {
          try {
            if (typeof mediaItem === 'string') return mediaItem;
            if (mediaItem.file_url || mediaItem.url) return mediaItem.file_url || mediaItem.url;
            
            if (mediaItem.file_path) {
              const { data: signedData, error: signedError } = await supabase.storage
                .from('project-files')
                .createSignedUrl(mediaItem.file_path, 3600);
              
              if (!signedError && signedData?.signedUrl) {
                return signedData.signedUrl;
              }
              
              if (mediaItem.file_type?.startsWith('image/')) {
                const { data: blobData } = await supabase.storage
                  .from('project-files')
                  .download(mediaItem.file_path);
                
                if (blobData) {
                  return URL.createObjectURL(blobData);
                }
              }
            }
            return '';
          } catch (err) {
            console.error('Error getting media URL:', err);
            return '';
          }
        };
        
        const getMediaType = (mediaItem: any): 'image' | 'video' => {
          if (typeof mediaItem === 'string') {
            const ext = mediaItem.split('.').pop()?.toLowerCase();
            return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '') ? 'image' : 'video';
          }
          return mediaItem.file_type?.startsWith('image/') ? 'image' : 'video';
        };
        
        const getMediaFileName = (mediaItem: any): string => {
          if (typeof mediaItem === 'string') return 'Media';
          return mediaItem.file_name || mediaItem.name || 'Media';
        };
        
        // Component to render media preview
        const MediaPreview = ({ mediaItem, idx }: { mediaItem: any; idx: number }) => {
          const [mediaUrl, setMediaUrl] = useState<string>('');
          const [loading, setLoading] = useState(true);
          const [error, setError] = useState(false);
          const blobUrlRef = useRef<string | null>(null);
          
          useEffect(() => {
            let mounted = true;
            const loadUrl = async () => {
              try {
                setLoading(true);
                setError(false);
                const url = await getMediaUrlAsync(mediaItem);
                if (mounted) {
                  if (url && url.trim()) {
                    if (url.startsWith('blob:')) {
                      blobUrlRef.current = url;
                    }
                    setMediaUrl(url);
                  } else {
                    setError(true);
                  }
                  setLoading(false);
                }
              } catch (err) {
                if (mounted) {
                  setError(true);
                  setLoading(false);
                }
              }
            };
            loadUrl();
            return () => {
              mounted = false;
              if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current);
                blobUrlRef.current = null;
              }
            };
          }, [mediaItem]);
          
          const mediaType = getMediaType(mediaItem);
          const fileName = getMediaFileName(mediaItem);
          
          if (loading) {
            return (
              <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            );
          }
          
          if (error || !mediaUrl) {
            return (
              <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                <FileText className="h-8 w-8" />
              </div>
            );
          }
          
          return (
            <div className="relative group">
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  let urlToView = mediaUrl;
                  if (!urlToView || !urlToView.trim()) {
                    if (mediaItem?.file_path) {
                      urlToView = await getMediaUrlAsync(mediaItem);
                    }
                  }
                  if (urlToView && urlToView.trim()) {
                    setViewingMedia({ url: urlToView, type: mediaType, fileName });
                  }
                }}
                className="relative w-full rounded-lg border overflow-hidden hover:opacity-90 transition-opacity cursor-pointer bg-muted"
              >
                {mediaType === 'image' ? (
                  <img
                    src={mediaUrl}
                    alt={fileName}
                    className="w-full h-auto max-h-[70vh] object-contain"
                    onError={() => setError(true)}
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center">
                    <Video className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white px-3 py-1 rounded text-sm">
                    Click to view full screen
                  </div>
                </div>
              </button>
              <p className="text-xs text-muted-foreground mt-1 truncate">{fileName}</p>
            </div>
          );
        };
        
        return (
          <div className="space-y-4">
            {mediaFiles.map((mediaItem: any, idx: number) => (
              <MediaPreview key={idx} mediaItem={mediaItem} idx={idx} />
            ))}
          </div>
        );
      case 'number':
        return <span className="font-mono">{Number(value).toLocaleString()}</span>;
      default:
        return <span className="break-words">{String(value)}</span>;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent 
          className="!max-w-[100vw] !max-h-[100vh] !w-[100vw] !h-[100vh] overflow-y-auto p-0 m-0 rounded-none"
          style={{
            maxWidth: '100vw',
            width: '100vw',
            maxHeight: '100vh',
            height: '100vh',
            margin: 0,
          }}
        >
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <DialogTitle className="text-2xl font-bold pr-4">
                  {task.title}
                </DialogTitle>
                <Badge className={getStatusColor(task.status)}>
                  {getStatusIcon(task.status)}
                  <span className="ml-1 capitalize">{task.status.replace('-', ' ')}</span>
                </Badge>
                <Badge className={getPriorityColor(task.priority_label || task.priority)}>
                  {task.priority_label || task.priority}
                </Badge>
                {task.task_number && (
                  <Badge variant="outline" className="font-mono">
                    #{task.task_number}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                Edit
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6">
          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                {task.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Main Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assigned To */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Assigned To
              </h3>
              <div className="flex items-center gap-2">
                {task.assignee?.avatar_url || members.find(m => m.user_id === task.assigned_to)?.user.avatar_url ? (
                  <Avatar className="h-6 w-6">
                    <AvatarImage 
                      src={task.assignee?.avatar_url || members.find(m => m.user_id === task.assigned_to)?.user.avatar_url} 
                    />
                    <AvatarFallback>
                      {getAssigneeName()[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                ) : null}
                <span className="text-sm">{getAssigneeName()}</span>
              </div>
            </div>

            {/* Assigned Team */}
            {task.assigned_team && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assigned Team
                </h3>
                <span className="text-sm">{task.assigned_team}</span>
              </div>
            )}

            {/* Due Date */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </h3>
              <span className="text-sm">{formatDateTime(task.due_date)}</span>
            </div>

            {/* Created By */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Created By
              </h3>
              <div className="flex items-center gap-2">
                {task.creator?.avatar_url ? (
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={task.creator.avatar_url} />
                    <AvatarFallback>
                      {getCreatorName()[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                ) : null}
                <span className="text-sm">{getCreatorName()}</span>
              </div>
            </div>

            {/* Created At */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Created At</h3>
              <span className="text-sm">{formatDateTime(task.created_at)}</span>
            </div>

            {/* Updated At */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Last Updated</h3>
              <span className="text-sm">{formatDateTime(task.updated_at)}</span>
            </div>

            {/* Completed At */}
            {task.completed_at && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Completed At</h3>
                <span className="text-sm">{formatDateTime(task.completed_at)}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2">Labels</h3>
                <div className="flex flex-wrap gap-2">
                  {task.labels.map((label, idx) => (
                    <Badge key={idx} variant="outline">{label}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Supporting Links */}
          {task.supporting_links && task.supporting_links.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Supporting Links
                </h3>
                <div className="space-y-2">
                  {task.supporting_links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1 break-all"
                    >
                      {link}
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Custom Properties */}
          {customProperties.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-4">Custom Properties</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customProperties.map((prop) => {
                    const value = task.custom_properties?.[prop.property_name];
                    const isMedia = prop.property_type === 'media';
                    return (
                      <div key={prop.id} className={isMedia ? 'md:col-span-2' : ''}>
                        <h4 className="text-xs font-medium text-muted-foreground mb-2">
                          {prop.property_name}
                          {prop.is_required && <span className="text-red-500 ml-1">*</span>}
                        </h4>
                        <div className={isMedia ? 'text-sm' : 'text-sm'}>
                          {renderCustomPropertyValue(prop, value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Comments */}
          {task.comments && task.comments.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments ({task.comments.length})
                </h3>
                <div className="space-y-4">
                  {task.comments.map((comment) => (
                    <div key={comment.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {comment.user?.avatar_url ? (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={comment.user.avatar_url} />
                            <AvatarFallback>
                              {comment.user.full_name?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                        ) : null}
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {comment.user?.full_name || 'Unknown'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateTime(comment.created_at)}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                        {comment.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        </DialogContent>
      </Dialog>
      
      {/* Media Viewer for full-screen image/video viewing */}
      <MediaViewer
        isOpen={!!viewingMedia}
        onClose={() => setViewingMedia(null)}
        mediaUrl={viewingMedia?.url || ''}
        mediaType={viewingMedia?.type || 'image'}
        fileName={viewingMedia?.fileName}
      />
    </>
  );
}

