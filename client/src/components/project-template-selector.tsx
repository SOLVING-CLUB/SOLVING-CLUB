

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PROJECT_TEMPLATES, ProjectTemplate, createProjectFromTemplate } from "@/lib/project-templates";
import { 
	Check, 
	Clock, 
	Code, 
	Palette, 
	Briefcase, 
	Settings,
	Star,
	Users,
	Calendar,
	Zap
} from "lucide-react";

interface ProjectTemplateSelectorProps {
	isOpen: boolean;
	onClose: () => void;
	onSelectTemplate: (template: ProjectTemplate, customData: { name: string; description: string; status: 'planning' | 'active' | 'completed' | 'on-hold'; client_name?: string; client_email?: string; client_company?: string; client_phone?: string; client_notes?: string }) => void;
}

const categoryIcons = {
	'web-development': Code,
	'mobile-app': Settings,
	'design': Palette,
	'consulting': Briefcase,
	'other': Star
};

const complexityColors = {
	simple: 'bg-green-100 text-green-800',
	medium: 'bg-yellow-100 text-yellow-800',
	complex: 'bg-red-100 text-red-800'
};

export function ProjectTemplateSelector({ isOpen, onClose, onSelectTemplate }: ProjectTemplateSelectorProps) {
	const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
	const [customData, setCustomData] = useState({
		name: '',
		description: '',
		client_name: '',
		client_email: '',
		client_company: '',
		client_phone: '',
		client_notes: ''
	});
	const [step, setStep] = useState<'select' | 'customize'>('select');

	const handleTemplateSelect = (template: ProjectTemplate) => {
		setSelectedTemplate(template);
		setCustomData(prev => ({
			...prev,
			name: template.name,
			description: template.description
		}));
		setStep('customize');
	};

	const handleCreateProject = () => {
		if (!selectedTemplate) return;
		
		const projectData = createProjectFromTemplate(selectedTemplate, customData);
		onSelectTemplate(selectedTemplate, projectData);
		onClose();
		setStep('select');
		setSelectedTemplate(null);
		setCustomData({
			name: '',
			description: '',
			client_name: '',
			client_email: '',
			client_company: '',
			client_phone: '',
			client_notes: ''
		});
	};

	const handleBack = () => {
		setStep('select');
		setSelectedTemplate(null);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Choose Project Template</DialogTitle>
					<DialogDescription>
						Select a template to quickly start your project with pre-configured settings and phases.
					</DialogDescription>
				</DialogHeader>

				{step === 'select' && (
					<div className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{PROJECT_TEMPLATES.map((template) => {
								const IconComponent = categoryIcons[template.category];
								return (
									<Card 
										key={template.id} 
										className="cursor-pointer hover:shadow-md transition-shadow"
										onClick={() => handleTemplateSelect(template)}
									>
										<CardHeader className="pb-3">
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-2">
													<IconComponent className="h-5 w-5 text-blue-600" />
													<CardTitle className="text-lg">{template.name}</CardTitle>
												</div>
												<Badge className={complexityColors[template.complexity]}>
													{template.complexity}
												</Badge>
											</div>
											<CardDescription className="text-sm">
												{template.description}
											</CardDescription>
										</CardHeader>
										<CardContent className="pt-0">
											<div className="space-y-3">
												<div className="flex items-center text-sm text-gray-600">
													<Clock className="h-4 w-4 mr-2" />
													{template.estimatedDuration}
												</div>
												
												<div className="space-y-2">
													<div className="text-sm font-medium">Key Features:</div>
													<div className="flex flex-wrap gap-1">
														{template.features.slice(0, 3).map((feature, index) => (
															<Badge key={index} variant="secondary" className="text-xs">
																{feature}
															</Badge>
														))}
														{template.features.length > 3 && (
															<Badge variant="outline" className="text-xs">
																+{template.features.length - 3} more
															</Badge>
														)}
													</div>
												</div>

												<div className="space-y-2">
													<div className="text-sm font-medium">Technologies:</div>
													<div className="flex flex-wrap gap-1">
														{template.technologies.slice(0, 3).map((tech, index) => (
															<Badge key={index} variant="outline" className="text-xs">
																{tech}
															</Badge>
														))}
														{template.technologies.length > 3 && (
															<Badge variant="outline" className="text-xs">
																+{template.technologies.length - 3} more
															</Badge>
														)}
													</div>
												</div>

												<div className="flex items-center justify-between text-sm">
													<div className="flex items-center text-gray-600">
														<Users className="h-4 w-4 mr-1" />
														{template.projectStructure.phases.length} phases
													</div>
													<div className="flex items-center text-gray-600">
														<Calendar className="h-4 w-4 mr-1" />
														{template.projectStructure.phases.reduce((total, phase) => total + phase.estimatedDays, 0)} days
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>

						<div className="text-center">
							<Button variant="outline" onClick={onClose}>
								Cancel
							</Button>
						</div>
					</div>
				)}

				{step === 'customize' && selectedTemplate && (
					<div className="space-y-6">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-lg font-semibold">Customize Project</h3>
								<p className="text-sm text-gray-600">Based on: {selectedTemplate.name}</p>
							</div>
							<Button variant="outline" onClick={handleBack}>
								Back to Templates
							</Button>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-4">
								<div>
									<Label htmlFor="name">Project Name *</Label>
									<Input
										id="name"
										value={customData.name}
										onChange={(e) => setCustomData(prev => ({ ...prev, name: e.target.value }))}
										placeholder="Enter project name"
									/>
								</div>

								<div>
									<Label htmlFor="description">Description</Label>
									<Textarea
										id="description"
										value={customData.description}
										onChange={(e) => setCustomData(prev => ({ ...prev, description: e.target.value }))}
										placeholder="Enter project description"
										rows={3}
									/>
								</div>

								<div>
									<Label htmlFor="client_name">Client Name</Label>
									<Input
										id="client_name"
										value={customData.client_name}
										onChange={(e) => setCustomData(prev => ({ ...prev, client_name: e.target.value }))}
										placeholder="Enter client name"
									/>
								</div>

								<div>
									<Label htmlFor="client_email">Client Email</Label>
									<Input
										id="client_email"
										type="email"
										value={customData.client_email}
										onChange={(e) => setCustomData(prev => ({ ...prev, client_email: e.target.value }))}
										placeholder="Enter client email"
									/>
								</div>
							</div>

							<div className="space-y-4">
								<div>
									<Label htmlFor="client_company">Client Company</Label>
									<Input
										id="client_company"
										value={customData.client_company}
										onChange={(e) => setCustomData(prev => ({ ...prev, client_company: e.target.value }))}
										placeholder="Enter company name"
									/>
								</div>

								<div>
									<Label htmlFor="client_phone">Client Phone</Label>
									<Input
										id="client_phone"
										value={customData.client_phone}
										onChange={(e) => setCustomData(prev => ({ ...prev, client_phone: e.target.value }))}
										placeholder="Enter phone number"
									/>
								</div>

								<div>
									<Label htmlFor="client_notes">Client Notes</Label>
									<Textarea
										id="client_notes"
										value={customData.client_notes}
										onChange={(e) => setCustomData(prev => ({ ...prev, client_notes: e.target.value }))}
										placeholder="Additional notes about the client"
										rows={3}
									/>
								</div>
							</div>
						</div>

						{/* Template Preview */}
						<div className="bg-gray-50 p-4 rounded-lg">
							<h4 className="font-medium mb-3">Project Structure Preview</h4>
							<div className="space-y-2">
								{selectedTemplate.projectStructure.phases.map((phase, index) => (
									<div key={index} className="flex items-center justify-between text-sm">
										<div className="flex items-center">
											<div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600 mr-3">
												{index + 1}
											</div>
											<div>
												<div className="font-medium">{phase.name}</div>
												<div className="text-gray-600">{phase.description}</div>
											</div>
										</div>
										<div className="text-gray-500">{phase.estimatedDays} days</div>
									</div>
								))}
							</div>
						</div>

						<div className="flex justify-end space-x-3">
							<Button variant="outline" onClick={onClose}>
								Cancel
							</Button>
							<Button 
								onClick={handleCreateProject}
								disabled={!customData.name.trim()}
							>
								<Zap className="h-4 w-4 mr-2" />
								Create Project
							</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
