"use client";
import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
	Plus, 
	Search, 
	BookOpen, 
	ExternalLink, 
	Clock, 
	Star, 
	Tag,
	Eye
} from "lucide-react";

interface LearningResource {
	id: string;
	title: string;
	description: string;
	url: string;
	category: string;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	estimated_time: number; // in minutes
	tags: string[];
	rating: number;
	completed: boolean;
	created_at: string;
	updated_at: string;
}

export default function LearningsPage() {
	const supabase = getSupabaseBrowserClient();
	const [resources, setResources] = useState<LearningResource[]>([]);
	const [loading, setLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [newResource, setNewResource] = useState({
		title: "",
		description: "",
		url: "",
		category: "programming",
		difficulty: "beginner" as const,
		estimated_time: 30,
		tags: [] as string[],
		rating: 0
	});

	const categories = [
		{ value: "all", label: "All Categories" },
		{ value: "programming", label: "Programming" },
		{ value: "design", label: "Design" },
		{ value: "business", label: "Business" },
		{ value: "marketing", label: "Marketing" },
		{ value: "data-science", label: "Data Science" },
		{ value: "devops", label: "DevOps" },
		{ value: "other", label: "Other" }
	];

	useEffect(() => {
		loadResources();
	}, [loadResources]);

	const loadResources = useCallback(async () => {
		setLoading(true);
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			setLoading(false);
			return;
		}

		try {
			const { data, error } = await supabase
				.from("learning_resources")
				.select("*")
				.eq("user_id", user.id)
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Error loading resources:", error);
				toast.error("Failed to load learning resources");
				setLoading(false);
				return;
			}

			setResources(data || []);
		} catch (error) {
			console.error("Unexpected error:", error);
			toast.error("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	}, [supabase]);

	async function createResource() {
		if (!newResource.title.trim() || !newResource.url.trim()) {
			toast.error("Title and URL are required");
			return;
		}

		setLoading(true);
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			toast.error("You must be logged in");
			setLoading(false);
			return;
		}

		try {
			const { error } = await supabase
				.from("learning_resources")
				.insert({
					user_id: user.id,
					title: newResource.title,
					description: newResource.description,
					url: newResource.url,
					category: newResource.category,
					difficulty: newResource.difficulty,
					estimated_time: newResource.estimated_time,
					tags: newResource.tags,
					rating: newResource.rating,
					completed: false
				});

			if (error) {
				console.error("Error creating resource:", error);
				toast.error("Failed to create learning resource");
				setLoading(false);
				return;
			}

			toast.success("Learning resource created successfully");
			setNewResource({
				title: "",
				description: "",
				url: "",
				category: "programming",
				difficulty: "beginner",
				estimated_time: 30,
				tags: [],
				rating: 0
			});
			setIsCreateDialogOpen(false);
			loadResources();
		} catch (error) {
			console.error("Unexpected error:", error);
			toast.error("An unexpected error occurred");
			setLoading(false);
		}
	}

	async function toggleComplete(resourceId: string, completed: boolean) {
		try {
			const { error } = await supabase
				.from("learning_resources")
				.update({ completed: !completed })
				.eq("id", resourceId);

			if (error) {
				toast.error("Failed to update resource");
				return;
			}

			loadResources();
		} catch {
			toast.error("An unexpected error occurred");
		}
	}

	const filteredResources = resources.filter(resource => {
		const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
			resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
		
		const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory;
		
		return matchesSearch && matchesCategory;
	});

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
			case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
			case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
			default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
		}
	};

	const getCategoryColor = (category: string) => {
		switch (category) {
			case 'programming': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
			case 'design': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
			case 'business': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
			case 'marketing': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
			case 'data-science': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
			case 'devops': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
			default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
		}
	};

	return (
		<div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
			{/* Header */}
			<Card className="mb-6">
				<CardHeader className="pb-4">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<CardTitle className="flex items-center gap-2 text-2xl">
								<BookOpen className="h-6 w-6" />
								Learning & Resources
							</CardTitle>
							<CardDescription>Manage your learning resources, track progress, and organize your knowledge.</CardDescription>
						</div>
						<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
							<DialogTrigger asChild>
								<Button className="w-full sm:w-auto">
									<Plus className="h-4 w-4 mr-2" />
									Add Resource
								</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-md">
								<DialogHeader>
									<DialogTitle>Add Learning Resource</DialogTitle>
									<DialogDescription>
										Add a new learning resource to your collection.
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="resource-title">Title *</Label>
										<Input
											id="resource-title"
											placeholder="e.g. React Fundamentals Course"
											value={newResource.title}
											onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="resource-url">URL *</Label>
										<Input
											id="resource-url"
											placeholder="https://example.com/course"
											value={newResource.url}
											onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="resource-description">Description</Label>
										<Textarea
											id="resource-description"
											placeholder="Brief description of the resource..."
											value={newResource.description}
											onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
											rows={3}
										/>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="resource-category">Category</Label>
											<select
												id="resource-category"
												className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
												value={newResource.category}
												onChange={(e) => setNewResource(prev => ({ ...prev, category: e.target.value }))}
											>
												{categories.slice(1).map(cat => (
													<option key={cat.value} value={cat.value}>{cat.label}</option>
												))}
											</select>
										</div>
										<div className="space-y-2">
											<Label htmlFor="resource-difficulty">Difficulty</Label>
											<select
												id="resource-difficulty"
												className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
												value={newResource.difficulty}
												onChange={(e) => setNewResource(prev => ({ ...prev, difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced' }))}
											>
												<option value="beginner">Beginner</option>
												<option value="intermediate">Intermediate</option>
												<option value="advanced">Advanced</option>
											</select>
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="resource-time">Estimated Time (minutes)</Label>
										<Input
											id="resource-time"
											type="number"
											min="1"
											value={newResource.estimated_time}
											onChange={(e) => setNewResource(prev => ({ ...prev, estimated_time: parseInt(e.target.value) || 30 }))}
										/>
									</div>
								</div>
								<DialogFooter>
									<Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
										Cancel
									</Button>
									<Button onClick={createResource} disabled={loading}>
										{loading ? "Adding..." : "Add Resource"}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				</CardHeader>
			</Card>

			{/* Search and Filter */}
			<Card className="mb-6">
				<CardContent className="p-6">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
								<Input
									placeholder="Search resources..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>
						<div className="flex gap-4">
							<select
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								value={selectedCategory}
								onChange={(e) => setSelectedCategory(e.target.value)}
							>
								{categories.map(cat => (
									<option key={cat.value} value={cat.value}>{cat.label}</option>
								))}
							</select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Resources Grid */}
			{filteredResources.length === 0 ? (
				<Card>
					<CardContent className="p-12 text-center">
						<BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
						<h3 className="text-lg font-semibold mb-2">
							{searchTerm || selectedCategory !== "all" ? "No resources found" : "No learning resources yet"}
						</h3>
						<p className="text-muted-foreground mb-4">
							{searchTerm || selectedCategory !== "all" 
								? "Try adjusting your search or filter criteria"
								: "Add your first learning resource to get started"
							}
						</p>
						{!searchTerm && selectedCategory === "all" && (
							<Button onClick={() => setIsCreateDialogOpen(true)}>
								<Plus className="h-4 w-4 mr-2" />
								Add Your First Resource
							</Button>
						)}
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{filteredResources.map((resource) => (
						<Card key={resource.id} className="hover:shadow-lg transition-shadow duration-200">
							<CardHeader className="pb-4">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<CardTitle className="text-lg mb-2 line-clamp-2">{resource.title}</CardTitle>
										<div className="flex flex-wrap gap-2 mb-2">
											<Badge className={getCategoryColor(resource.category)}>
												{resource.category}
											</Badge>
											<Badge className={getDifficultyColor(resource.difficulty)}>
												{resource.difficulty}
											</Badge>
										</div>
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={() => toggleComplete(resource.id, resource.completed)}
										className={resource.completed ? "text-green-600" : ""}
									>
										{resource.completed ? "✓" : "○"}
									</Button>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								{resource.description && (
									<p className="text-sm text-muted-foreground line-clamp-3">
										{resource.description}
									</p>
								)}
								
								<div className="flex items-center justify-between text-sm text-muted-foreground">
									<div className="flex items-center gap-1">
										<Clock className="h-4 w-4" />
										{resource.estimated_time} min
									</div>
									{resource.rating > 0 && (
										<div className="flex items-center gap-1">
											<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
											{resource.rating}
										</div>
									)}
								</div>

								{resource.tags.length > 0 && (
									<div className="flex flex-wrap gap-1">
										{resource.tags.slice(0, 3).map((tag, index) => (
											<Badge key={index} variant="outline" className="text-xs">
												<Tag className="h-3 w-3 mr-1" />
												{tag}
											</Badge>
										))}
										{resource.tags.length > 3 && (
											<Badge variant="outline" className="text-xs">
												+{resource.tags.length - 3} more
											</Badge>
										)}
									</div>
								)}

								<div className="flex gap-2">
									<Button 
										variant="outline" 
										size="sm" 
										className="flex-1"
										onClick={() => window.open(resource.url, '_blank')}
									>
										<ExternalLink className="h-4 w-4 mr-2" />
										Open
									</Button>
									<Button variant="outline" size="sm">
										<Eye className="h-4 w-4" />
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
