"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, File, Download, Trash2, Eye } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

interface FileUploadProps {
	projectId: string;
	onFileUploaded?: () => void;
}

interface ProjectFile {
	id: string;
	filename: string;
	file_path: string;
	file_size: number;
	file_type: string;
	created_at: string;
	user_id?: string;
	user?: {
		full_name?: string;
	};
}

export default function FileUpload({ projectId, onFileUploaded }: FileUploadProps) {
	const [files, setFiles] = useState<ProjectFile[]>([]);
	const [uploading, setUploading] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const supabase = getSupabaseBrowserClient();

	useEffect(() => {
		// defer to effect below that depends on loadFiles
	}, [projectId]);

	const loadFiles = useCallback(async () => {
		try {
			const { data: fileRows, error } = await supabase
				.from("project_files")
				.select("*")
				.eq("project_id", projectId)
				.order("created_at", { ascending: false });

			if (error && (error as unknown as { message?: string }).message) {
				console.error("Error loading files:", error);
				return;
			}

			const rows = (fileRows as Array<ProjectFile & { user_id: string }> | null) ?? [];
			if (rows.length === 0) {
				// Fallback: list directly from Storage when DB metadata is missing
				// Try canonical path: projects/<projectId>
				let listResult = await supabase.storage
					.from('project-files')
					.list(`projects/${projectId}`);
				let objects = listResult.data;
				let listError = listResult.error;
				// Fallback 1: <projectId>/projects (older uploads)
				if ((!objects || objects.length === 0) && !listError) {
					const alt1 = await supabase.storage
						.from('project-files')
						.list(`${projectId}/projects`);
					objects = alt1.data;
					listError = alt1.error;
				}
				// Fallback 2: <projectId> (files directly under project root)
				if ((!objects || objects.length === 0) && !listError) {
					const alt2 = await supabase.storage
						.from('project-files')
						.list(`${projectId}`);
					objects = alt2.data;
					listError = alt2.error;
				}
				if (!listError && Array.isArray(objects) && objects.length > 0) {
					const storageFiles: ProjectFile[] = objects
						.filter((o) => o && o.name)
						.map((o) => ({
							id: `${projectId}-${o.name}`,
							filename: o.name,
							file_path: `projects/${projectId}/${o.name}`,
							file_size: (o as unknown as { metadata?: { size?: number } }).metadata?.size || 0,
							file_type: '',
							created_at: (o as unknown as { created_at?: string }).created_at || new Date().toISOString(),
							user: { full_name: 'Unknown' },
						}));
					setFiles(storageFiles);
					return;
				}
				setFiles([]);
				return;
			}

			const uniqueUserIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)));
			let profilesMap: Record<string, { full_name?: string }> = {};
			if (uniqueUserIds.length > 0) {
				const { data: profiles, error: profilesError } = await supabase
					.from('profiles')
					.select('id, full_name')
					.in('id', uniqueUserIds);
				if (profilesError && (profilesError as unknown as { message?: string }).message) {
					console.warn('Warning: failed to load uploader profiles:', profilesError);
				} else {
					profilesMap = ((profiles ?? []) as Array<{ id: string; full_name?: string }>).reduce((map, p) => {
						map[p.id] = { full_name: p.full_name };
						return map;
					}, {} as Record<string, { full_name?: string }>);
				}
			}

			const enriched = rows.map((r) => ({
				...r,
				user: { full_name: profilesMap[r.user_id || '']?.full_name || 'Unknown' },
			}));
			setFiles(enriched);
		} catch (error) {
			console.error("Unexpected error loading files:", error);
		}
	}, [projectId, supabase]);

	useEffect(() => {
		loadFiles();
		const channel = supabase
			.channel(`project-files-${projectId}`)
			.on('postgres_changes', { event: '*', schema: 'public', table: 'project_files', filter: `project_id=eq.${projectId}` }, () => loadFiles())
			.subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [projectId, loadFiles]);

	const handleFileSelect = (selectedFiles: FileList | null) => {
		if (!selectedFiles) return;
		Array.from(selectedFiles).forEach(async (file) => {
			await uploadFile(file);
		});
	};

	const uploadFile = async (file: File) => {
		setUploading(true);
		
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				toast.error("You must be logged in to upload files");
				return;
			}

			// Create a unique file path
			const fileExt = file.name.split('.').pop();
			const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
			const filePath = `projects/${projectId}/${fileName}`;

			// Upload file to Supabase Storage
			const { error: uploadError } = await supabase.storage
				.from('project-files')
				.upload(filePath, file);
			if (uploadError) {
				toast.error("Failed to upload file");
				return;
			}

			if (uploadError) {
				toast.error("Failed to upload file");
				return;
			}

			// Save file metadata to database
			const { data: savedRow, error: dbError } = await supabase
				.from('project_files')
				.insert({
					project_id: projectId,
					user_id: user.id,
					filename: file.name,
					file_path: filePath,
					file_size: file.size,
					file_type: file.type
				})
				.select('*')
				.single();

			if (dbError) {
				toast.error("Failed to save file metadata");
				return;
			}

			toast.success("File uploaded successfully");
			// Optimistic update so users see the file immediately
			try {
				const { data: profile } = await supabase
					.from('profiles')
					.select('full_name')
					.eq('id', user.id)
					.single();
				setFiles((prev) => [
					{
						id: savedRow?.id || `${Date.now()}`,
						filename: file.name,
						file_path: filePath,
						file_size: file.size,
						file_type: file.type,
						created_at: new Date().toISOString(),
						user_id: user.id,
						user: { full_name: profile?.full_name || 'You' },
					},
					...prev,
				]);
			} catch {}
			loadFiles(); // Reload files after upload
			onFileUploaded?.();
		} catch {
			toast.error("An error occurred while uploading the file");
		} finally {
			setUploading(false);
		}
	};

	const downloadFile = async (file: ProjectFile) => {
		try {
			const { data, error } = await supabase.storage
				.from('project-files')
				.download(file.file_path);

			if (error) {
				toast.error("Failed to download file");
				return;
			}

			// Create download link
			const url = URL.createObjectURL(data);
			const a = document.createElement('a');
			a.href = url;
			a.download = file.filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch {
			toast.error("Failed to download file");
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	const previewFile = async (file: ProjectFile) => {
		try {
			const { data, error } = await supabase.storage
				.from('project-files')
				.download(file.file_path);
			if (error) {
				toast.error('Failed to preview file');
				return;
			}
			const url = URL.createObjectURL(data);
			window.open(url, '_blank');
			setTimeout(() => URL.revokeObjectURL(url), 60_000);
		} catch {
			toast.error('Failed to preview file');
		}
	};

	const deleteFile = async (file: ProjectFile) => {
		if (!confirm(`Delete ${file.filename}? This cannot be undone.`)) return;
		try {
			// Delete from storage first
			const { error: storageError } = await supabase.storage
				.from('project-files')
				.remove([file.file_path]);
			if (storageError) {
				toast.error('Failed to delete from storage');
				return;
			}
			// Delete metadata row
			const { error: dbError } = await supabase
				.from('project_files')
				.delete()
				.eq('id', file.id);
			if (dbError) {
				toast.error('Failed to delete file record');
				return;
			}
			toast.success('File deleted');
			loadFiles();
		} catch {
			toast.error('Failed to delete file');
		}
	};

	const getFileIcon = (fileType: string) => {
		if (fileType.startsWith('image/')) return '🖼️';
		if (fileType.startsWith('video/')) return '🎥';
		if (fileType.startsWith('audio/')) return '🎵';
		if (fileType.includes('pdf')) return '📄';
		if (fileType.includes('word')) return '📝';
		if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
		if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
		return '📁';
	};

	return (
		<div className="space-y-4">
			{/* Upload Area */}
			<Card 
				className={`border-2 border-dashed transition-colors ${
					dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
				}`}
				onDragOver={(e) => {
					e.preventDefault();
					setDragOver(true);
				}}
				onDragLeave={() => setDragOver(false)}
				onDrop={(e) => {
					e.preventDefault();
					setDragOver(false);
					handleFileSelect(e.dataTransfer.files);
				}}
			>
				<CardContent className="p-8 text-center">
					<Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
					<h3 className="text-lg font-semibold mb-2">Upload Files</h3>
					<p className="text-muted-foreground mb-4">
						Drag and drop files here, or click to select files
					</p>
					<Button 
						onClick={() => fileInputRef.current?.click()}
						disabled={uploading}
					>
						{uploading ? "Uploading..." : "Select Files"}
					</Button>
					<input
						ref={fileInputRef}
						type="file"
						multiple
						className="hidden"
						onChange={(e) => handleFileSelect(e.target.files)}
					/>
				</CardContent>
			</Card>

			{/* File List */}
			<Card>
				<CardContent className="p-4">
					<div className="flex items-center justify-between mb-4">
						<h4 className="font-semibold">Project Files</h4>
						<Button variant="outline" size="sm" onClick={loadFiles} disabled={uploading}>Refresh</Button>
					</div>
					{files.length === 0 ? (
						<p className="text-sm text-muted-foreground">No files yet.</p>
					) : (
						<div className="space-y-2">
							{files.map((file) => (
							<div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
								<span className="text-2xl">{getFileIcon(file.file_type)}</span>
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-1">
										<span className="font-medium">{file.filename}</span>
										<span className="text-xs text-muted-foreground">
											{formatFileSize(file.file_size)}
										</span>
									</div>
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
											<span>Uploaded by {file.user?.full_name || 'Unknown'}</span>
										<span>•</span>
										<span>{new Date(file.created_at).toLocaleDateString()}</span>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Button 
										variant="outline" 
										size="sm"
										onClick={() => previewFile(file)}
										title="Preview"
									>
										<Eye className="h-4 w-4" />
									</Button>
									<Button 
										variant="outline" 
										size="sm"
										onClick={() => downloadFile(file)}
										title="Download"
									>
										<Download className="h-4 w-4" />
									</Button>
									<Button 
										variant="outline" 
										size="sm"
										onClick={() => deleteFile(file)}
										title="Delete"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
