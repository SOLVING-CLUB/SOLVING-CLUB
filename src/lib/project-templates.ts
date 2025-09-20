export interface ProjectTemplate {
	id: string;
	name: string;
	description: string;
	category: 'web-development' | 'mobile-app' | 'design' | 'consulting' | 'other';
	estimatedDuration: string;
	complexity: 'simple' | 'medium' | 'complex';
	features: string[];
	technologies: string[];
	defaultStatus: 'planning' | 'active' | 'completed' | 'on-hold';
	clientFields: {
		required: string[];
		optional: string[];
	};
	projectStructure: {
		phases: Array<{
			name: string;
			description: string;
			estimatedDays: number;
			deliverables: string[];
		}>;
	};
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
	{
		id: 'web-app-basic',
		name: 'Basic Web Application',
		description: 'A simple web application with frontend and backend',
		category: 'web-development',
		estimatedDuration: '2-4 weeks',
		complexity: 'simple',
		features: [
			'User authentication',
			'CRUD operations',
			'Responsive design',
			'Basic admin panel'
		],
		technologies: ['React', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
		defaultStatus: 'planning',
		clientFields: {
			required: ['name', 'email'],
			optional: ['company', 'phone', 'notes']
		},
		projectStructure: {
			phases: [
				{
					name: 'Planning & Design',
					description: 'Requirements gathering, wireframing, and project setup',
					estimatedDays: 3,
					deliverables: ['Project brief', 'Wireframes', 'Technical specification']
				},
				{
					name: 'Development',
					description: 'Core development and feature implementation',
					estimatedDays: 10,
					deliverables: ['MVP', 'Core features', 'Database setup']
				},
				{
					name: 'Testing & Deployment',
					description: 'Quality assurance and production deployment',
					estimatedDays: 4,
					deliverables: ['Tested application', 'Production deployment', 'Documentation']
				}
			]
		}
	},
	{
		id: 'ecommerce-platform',
		name: 'E-commerce Platform',
		description: 'Full-featured e-commerce solution with payment integration',
		category: 'web-development',
		estimatedDuration: '6-12 weeks',
		complexity: 'complex',
		features: [
			'Product catalog',
			'Shopping cart',
			'Payment processing',
			'Order management',
			'Admin dashboard',
			'User accounts',
			'Inventory tracking'
		],
		technologies: ['Next.js', 'Stripe', 'PostgreSQL', 'Redis', 'AWS'],
		defaultStatus: 'planning',
		clientFields: {
			required: ['name', 'email', 'company'],
			optional: ['phone', 'notes', 'business_type']
		},
		projectStructure: {
			phases: [
				{
					name: 'Discovery & Planning',
					description: 'Business analysis, requirements, and architecture design',
					estimatedDays: 7,
					deliverables: ['Business requirements', 'Technical architecture', 'Project timeline']
				},
				{
					name: 'Core Development',
					description: 'Backend API, database design, and core functionality',
					estimatedDays: 20,
					deliverables: ['API endpoints', 'Database schema', 'Core business logic']
				},
				{
					name: 'Frontend Development',
					description: 'User interface and user experience implementation',
					estimatedDays: 15,
					deliverables: ['User interface', 'Admin panel', 'Mobile responsiveness']
				},
				{
					name: 'Integration & Testing',
					description: 'Payment integration, testing, and optimization',
					estimatedDays: 10,
					deliverables: ['Payment integration', 'Performance optimization', 'Security testing']
				},
				{
					name: 'Deployment & Launch',
					description: 'Production deployment and go-live support',
					estimatedDays: 5,
					deliverables: ['Production deployment', 'Launch support', 'Training materials']
				}
			]
		}
	},
	{
		id: 'mobile-app-react-native',
		name: 'React Native Mobile App',
		description: 'Cross-platform mobile application using React Native',
		category: 'mobile-app',
		estimatedDuration: '4-8 weeks',
		complexity: 'medium',
		features: [
			'Cross-platform compatibility',
			'Push notifications',
			'Offline functionality',
			'User authentication',
			'Real-time updates'
		],
		technologies: ['React Native', 'Expo', 'Firebase', 'Redux', 'TypeScript'],
		defaultStatus: 'planning',
		clientFields: {
			required: ['name', 'email'],
			optional: ['company', 'phone', 'notes', 'target_platforms']
		},
		projectStructure: {
			phases: [
				{
					name: 'Design & Planning',
					description: 'UI/UX design, app architecture, and platform setup',
					estimatedDays: 5,
					deliverables: ['App design', 'Technical architecture', 'Development environment']
				},
				{
					name: 'Core Development',
					description: 'Main app functionality and navigation',
					estimatedDays: 12,
					deliverables: ['Core features', 'Navigation', 'State management']
				},
				{
					name: 'Integration & Testing',
					description: 'API integration, testing, and optimization',
					estimatedDays: 8,
					deliverables: ['API integration', 'Testing', 'Performance optimization']
				},
				{
					name: 'Deployment',
					description: 'App store preparation and deployment',
					estimatedDays: 3,
					deliverables: ['App store submission', 'Beta testing', 'Release']
				}
			]
		}
	},
	{
		id: 'brand-identity',
		name: 'Brand Identity & Design',
		description: 'Complete brand identity design package',
		category: 'design',
		estimatedDuration: '2-3 weeks',
		complexity: 'simple',
		features: [
			'Logo design',
			'Brand guidelines',
			'Business card design',
			'Letterhead design',
			'Social media templates'
		],
		technologies: ['Adobe Creative Suite', 'Figma', 'Illustrator', 'Photoshop'],
		defaultStatus: 'planning',
		clientFields: {
			required: ['name', 'email', 'company'],
			optional: ['phone', 'notes', 'industry', 'brand_values']
		},
		projectStructure: {
			phases: [
				{
					name: 'Discovery & Research',
					description: 'Brand analysis, competitor research, and creative brief',
					estimatedDays: 3,
					deliverables: ['Brand analysis', 'Competitor research', 'Creative brief']
				},
				{
					name: 'Concept Development',
					description: 'Logo concepts, color palette, and typography exploration',
					estimatedDays: 5,
					deliverables: ['Logo concepts', 'Color palette', 'Typography options']
				},
				{
					name: 'Design & Refinement',
					description: 'Final design development and brand guidelines creation',
					estimatedDays: 4,
					deliverables: ['Final logo', 'Brand guidelines', 'Stationery designs']
				}
			]
		}
	},
	{
		id: 'consulting-project',
		name: 'Technical Consulting',
		description: 'Technical consulting and advisory services',
		category: 'consulting',
		estimatedDuration: '1-4 weeks',
		complexity: 'medium',
		features: [
			'Technical assessment',
			'Architecture review',
			'Performance optimization',
			'Security audit',
			'Implementation guidance'
		],
		technologies: ['Various', 'Cloud platforms', 'DevOps tools', 'Monitoring tools'],
		defaultStatus: 'planning',
		clientFields: {
			required: ['name', 'email', 'company'],
			optional: ['phone', 'notes', 'current_tech_stack', 'challenges']
		},
		projectStructure: {
			phases: [
				{
					name: 'Assessment',
					description: 'Current state analysis and requirements gathering',
					estimatedDays: 2,
					deliverables: ['Current state report', 'Requirements document']
				},
				{
					name: 'Analysis & Recommendations',
					description: 'Technical analysis and solution recommendations',
					estimatedDays: 3,
					deliverables: ['Technical analysis', 'Recommendations report']
				},
				{
					name: 'Implementation Plan',
					description: 'Detailed implementation roadmap and next steps',
					estimatedDays: 2,
					deliverables: ['Implementation plan', 'Timeline', 'Resource requirements']
				}
			]
		}
	}
];

export function getTemplateById(id: string): ProjectTemplate | undefined {
	return PROJECT_TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByCategory(category: ProjectTemplate['category']): ProjectTemplate[] {
	return PROJECT_TEMPLATES.filter(template => template.category === category);
}

export function createProjectFromTemplate(template: ProjectTemplate, customData: Partial<{
	name: string;
	description: string;
	client_name?: string;
	client_email?: string;
	client_company?: string;
	client_phone?: string;
	client_notes?: string;
}>): {
	name: string;
	description: string;
	status: ProjectTemplate['defaultStatus'];
	client_name?: string;
	client_email?: string;
	client_company?: string;
	client_phone?: string;
	client_notes?: string;
} {
	return {
		name: customData.name || template.name,
		description: customData.description || template.description,
		status: template.defaultStatus,
		client_name: customData.client_name,
		client_email: customData.client_email,
		client_company: customData.client_company,
		client_phone: customData.client_phone,
		client_notes: customData.client_notes,
	};
}
