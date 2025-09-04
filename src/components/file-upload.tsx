"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, File, X, Download } from "lucide-react";
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
	user: {
		full_name: string;
	};
}

export default function FileUpload({ projectId, onFileUploaded }: FileUploadProps) {
	const [files, setFiles] = useState<ProjectFile[]>([]);
	const [uploading, setUploading] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const supabase = getSupabaseBrowserClient();

	useEffect(() => {
		loadFiles();
	}, [projectId]);

	async function loadFiles() {
		try {
			const { data, error } = await supabase
				.from("project_files")
				.select(`
					*,
					user:profiles(full_name)
				`)
				.eq("project_id", projectId)
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Error loading files:", error);
				return;
			}

			setFiles(data || []);
		} catch (error) {
			console.error("Unexpected error loading files:", error);
		}
	}

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

			// Save file metadata to database
			const { error: dbError } = await supabase
				.from('project_files')
				.insert({
					project_id: projectId,
					user_id: user.id,
					filename: file.name,
					file_path: filePath,
					file_size: file.size,
					file_type: file.type
				});

			if (dbError) {
				toast.error("Failed to save file metadata");
				return;
			}

			toast.success("File uploaded successfully");
			loadFiles(); // Reload files after upload
			onFileUploaded?.();
		} catch (error) {
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
		} catch (error) {
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
			{files.length > 0 && (
				<Card>
					<CardContent className="p-4">
						<h4 className="font-semibold mb-4">Project Files</h4>
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
											<span>Uploaded by {file.user.full_name}</span>
											<span>•</span>
											<span>{new Date(file.created_at).toLocaleDateString()}</span>
										</div>
									</div>
									<Button 
										variant="outline" 
										size="sm"
										onClick={() => downloadFile(file)}
									>
										<Download className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
