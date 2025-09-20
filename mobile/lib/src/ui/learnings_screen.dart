import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'components/app_bar.dart';
import 'components/bottom_nav_bar.dart';

class LearningsScreen extends ConsumerStatefulWidget {
  const LearningsScreen({super.key});

  @override
  ConsumerState<LearningsScreen> createState() => _LearningsScreenState();
}

class _LearningsScreenState extends ConsumerState<LearningsScreen> {
  bool loading = true;
  List<Map<String, dynamic>> learnings = [];
  String searchQuery = '';
  String selectedCategory = 'all';

  final List<String> categories = [
    'all',
    'programming',
    'design',
    'business',
    'marketing',
    'other',
  ];

  @override
  void initState() {
    super.initState();
    _loadLearnings();
  }

  Future<void> _loadLearnings() async {
    try {
      final supabase = Supabase.instance.client;
      final user = supabase.auth.currentUser;
      
      if (user == null) return;

      var query = supabase
          .from('learnings')
          .select('*')
          .eq('user_id', user.id);

      if (selectedCategory != 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (searchQuery.isNotEmpty) {
        query = query.ilike('title', '%$searchQuery%');
      }

      final response = await query.order('created_at', ascending: false);

      setState(() {
        learnings = List<Map<String, dynamic>>.from(response);
        loading = false;
      });
    } catch (e) {
      setState(() {
        loading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading learnings: $e')),
        );
      }
    }
  }

  Future<void> _addLearning() async {
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();
    final urlController = TextEditingController();
    String selectedCategory = 'programming';

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Add Learning'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(
                    labelText: 'Title',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: descriptionController,
                  decoration: const InputDecoration(
                    labelText: 'Description',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 3,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: urlController,
                  decoration: const InputDecoration(
                    labelText: 'URL (optional)',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.url,
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: selectedCategory,
                  decoration: const InputDecoration(
                    labelText: 'Category',
                    border: OutlineInputBorder(),
                  ),
                  items: categories.where((cat) => cat != 'all').map((category) {
                    String label;
                    switch (category) {
                      case 'programming':
                        label = 'Programming';
                        break;
                      case 'design':
                        label = 'Design';
                        break;
                      case 'business':
                        label = 'Business';
                        break;
                      case 'marketing':
                        label = 'Marketing';
                        break;
                      case 'other':
                        label = 'Other';
                        break;
                      default:
                        label = category;
                    }
                    return DropdownMenuItem(
                      value: category,
                      child: Text(label),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setDialogState(() {
                      selectedCategory = value!;
                    });
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                if (titleController.text.trim().isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Title is required')),
                  );
                  return;
                }
                Navigator.of(context).pop(true);
              },
              child: const Text('Add'),
            ),
          ],
        ),
      ),
    );

    if (result == true) {
      await _saveLearning(
        titleController.text.trim(),
        descriptionController.text.trim(),
        urlController.text.trim(),
        selectedCategory,
      );
    }
  }

  Future<void> _saveLearning(String title, String description, String url, String category) async {
    try {
      final supabase = Supabase.instance.client;
      final user = supabase.auth.currentUser;
      
      if (user == null) return;

      await supabase.from('learnings').insert({
        'user_id': user.id,
        'title': title,
        'description': description.isNotEmpty ? description : null,
        'url': url.isNotEmpty ? url : null,
        'category': category,
      });

      await _loadLearnings();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Learning added successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error adding learning: $e')),
        );
      }
    }
  }

  Future<void> _deleteLearning(String id) async {
    try {
      final supabase = Supabase.instance.client;
      await supabase.from('learnings').delete().eq('id', id);
      await _loadLearnings();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Learning deleted')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error deleting learning: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F), // Black background
      appBar: CustomAppBar(
        title: 'Learnings',
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: Colors.white),
            onPressed: _addLearning,
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchAndFilter(),
          Expanded(
            child: loading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: Colors.white,
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _loadLearnings,
                    color: const Color(0xFF0F0F0F),
                    backgroundColor: const Color(0xFF1A1A1A),
                    child: learnings.isEmpty
                        ? _buildEmptyState()
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: learnings.length,
                            itemBuilder: (context, index) {
                              final learning = learnings[index];
                              return _buildLearningCard(learning);
                            },
                          ),
                  ),
          ),
        ],
      ),
      bottomNavigationBar: const CustomBottomNavBar(currentIndex: 3),
    );
  }

  Widget _buildSearchAndFilter() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          TextField(
            decoration: InputDecoration(
              hintText: 'Search learnings...',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 12,
              ),
            ),
            onChanged: (value) {
              setState(() {
                searchQuery = value;
              });
              _loadLearnings();
            },
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: categories.map((category) {
                final isSelected = selectedCategory == category;
                String label;
                switch (category) {
                  case 'all':
                    label = 'All';
                    break;
                  case 'programming':
                    label = 'Programming';
                    break;
                  case 'design':
                    label = 'Design';
                    break;
                  case 'business':
                    label = 'Business';
                    break;
                  case 'marketing':
                    label = 'Marketing';
                    break;
                  case 'other':
                    label = 'Other';
                    break;
                  default:
                    label = category;
                }
                
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(label),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        selectedCategory = category;
                      });
                      _loadLearnings();
                    },
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.book,
            size: 64,
            color: Theme.of(context).primaryColor.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'No learnings yet',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: Theme.of(context).textTheme.titleLarge?.color?.withOpacity(0.6),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Start building your knowledge base',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.6),
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _addLearning,
            icon: const Icon(Icons.add),
            label: const Text('Add Learning'),
          ),
        ],
      ),
    );
  }

  Widget _buildLearningCard(Map<String, dynamic> learning) {
    final category = learning['category'] ?? 'other';
    final url = learning['url'];
    final createdAt = DateTime.parse(learning['created_at']);
    
    Color categoryColor;
    IconData categoryIcon;
    String categoryLabel;
    
    switch (category) {
      case 'programming':
        categoryColor = Colors.blue;
        categoryIcon = Icons.code;
        categoryLabel = 'Programming';
        break;
      case 'design':
        categoryColor = Colors.purple;
        categoryIcon = Icons.palette;
        categoryLabel = 'Design';
        break;
      case 'business':
        categoryColor = Colors.green;
        categoryIcon = Icons.business;
        categoryLabel = 'Business';
        break;
      case 'marketing':
        categoryColor = Colors.orange;
        categoryIcon = Icons.trending_up;
        categoryLabel = 'Marketing';
        break;
      default:
        categoryColor = Colors.grey;
        categoryIcon = Icons.book;
        categoryLabel = 'Other';
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(categoryIcon, color: categoryColor, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      categoryLabel,
                      style: TextStyle(
                        color: categoryColor,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                PopupMenuButton(
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(Icons.delete, color: Colors.red),
                          SizedBox(width: 8),
                          Text('Delete'),
                        ],
                      ),
                    ),
                  ],
                  onSelected: (value) {
                    if (value == 'delete') {
                      _deleteLearning(learning['id']);
                    }
                  },
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              learning['title'],
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            if (learning['description'] != null) ...[
              const SizedBox(height: 8),
              Text(
                learning['description'],
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.8),
                ),
              ),
            ],
            if (url != null) ...[
              const SizedBox(height: 12),
              InkWell(
                onTap: () {
                  // Open URL
                },
                child: Row(
                  children: [
                    Icon(Icons.link, size: 16, color: Colors.blue[600]),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        url,
                        style: TextStyle(
                          color: Colors.blue[600],
                          decoration: TextDecoration.underline,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.access_time, size: 14, color: Colors.grey[600]),
                const SizedBox(width: 4),
                Text(
                  _formatTimeAgo(createdAt),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatTimeAgo(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}
