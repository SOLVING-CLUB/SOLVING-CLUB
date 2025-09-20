import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'components/app_bar.dart';
import 'components/bottom_nav_bar.dart';
import 'components/card.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  bool loading = true;
  Map<String, dynamic> stats = {};
  List<Map<String, dynamic>> recentActivity = [];
  List<Map<String, dynamic>> upcomingEvents = [];

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    try {
      final supabase = Supabase.instance.client;
      final user = supabase.auth.currentUser;
      
      if (user == null) return;

      // Load stats in parallel
      final futures = await Future.wait([
        // Total hours from weekly hours
        supabase
            .from('weekly_hours')
            .select('monday_hours, tuesday_hours, wednesday_hours, thursday_hours, friday_hours, saturday_hours, sunday_hours')
            .eq('user_id', user.id),
        
        // Active projects
        supabase
            .from('projects')
            .select('id, status')
            .eq('owner_id', user.id)
            .inFilter('status', ['planning', 'active']),
        
        // Completed tasks
        supabase
            .from('project_tasks')
            .select('id, status')
            .eq('status', 'completed'),
        
        // Recent activity - get recent project messages and learning resources
        supabase
            .from('project_messages')
            .select('id, content, created_at, project_id, projects(name)')
            .order('created_at', ascending: false)
            .limit(3),
      ]);

      final hoursResult = futures[0] as List<dynamic>;
      final projectsResult = futures[1] as List<dynamic>;
      final tasksResult = futures[2] as List<dynamic>;
      final activityResult = futures[3] as List<dynamic>;

      // Calculate total hours from weekly hours
      double totalHours = 0;
      for (final entry in hoursResult) {
        totalHours += (entry['monday_hours'] ?? 0) +
                     (entry['tuesday_hours'] ?? 0) +
                     (entry['wednesday_hours'] ?? 0) +
                     (entry['thursday_hours'] ?? 0) +
                     (entry['friday_hours'] ?? 0) +
                     (entry['saturday_hours'] ?? 0) +
                     (entry['sunday_hours'] ?? 0);
      }

      setState(() {
        stats = {
          'totalHours': totalHours,
          'activeProjects': projectsResult.length,
          'completedTasks': tasksResult.length,
          'teamMembers': 0, // Placeholder
        };
        // Process recent activity data
        recentActivity = activityResult.map((activity) {
          final project = activity['projects'] as Map<String, dynamic>?;
          return {
            'id': activity['id'],
            'title': 'New message in ${project?['name'] ?? 'Project'}',
            'description': activity['content'],
            'created_at': activity['created_at'],
          };
        }).toList();
        upcomingEvents = []; // Placeholder
        loading = false;
      });
    } catch (e) {
      setState(() {
        loading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading dashboard: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F), // Black background
      appBar: const CustomAppBar(
        title: 'Dashboard',
        showBackButton: false,
        actions: [
          IconButton(
            icon: Icon(Icons.settings_outlined, color: Colors.white),
            onPressed: null,
          ),
        ],
      ),
      body: loading
          ? const Center(
              child: CircularProgressIndicator(
                color: Colors.white,
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadDashboardData,
              color: const Color(0xFF0F0F0F),
              backgroundColor: const Color(0xFF1A1A1A),
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildWelcomeSection(),
                    const SizedBox(height: 24),
                    _buildStatsGrid(),
                    const SizedBox(height: 24),
                    _buildQuickActions(),
                    const SizedBox(height: 24),
                    _buildRecentActivity(),
                    const SizedBox(height: 24),
                    _buildUpcomingEvents(),
                    const SizedBox(height: 80), // Bottom padding for nav bar
                  ],
                ),
              ),
            ),
      bottomNavigationBar: const CustomBottomNavBar(currentIndex: 0),
    );
  }

  Widget _buildWelcomeSection() {
    final user = Supabase.instance.client.auth.currentUser;
    final name = user?.userMetadata?['full_name'] ?? 'User';
    
    return CustomCard(
      backgroundColor: const Color(0xFF1A1A1A),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome back,',
            style: const TextStyle(
              color: Color(0xFFA3A3A3), // Light grey
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            name,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Here\'s what\'s happening with your projects.',
            style: const TextStyle(
              color: Color(0xFF737373), // Medium grey
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.5,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      children: [
        StatCard(
          title: 'Total Hours',
          value: '${stats['totalHours']?.toStringAsFixed(1) ?? '0'}h',
          icon: Icons.access_time,
          iconColor: const Color(0xFF3B82F6), // Blue
          subtitle: 'This month',
        ),
        StatCard(
          title: 'Active Projects',
          value: '${stats['activeProjects'] ?? 0}',
          icon: Icons.folder_open,
          iconColor: const Color(0xFF10B981), // Green
          subtitle: 'In progress',
        ),
        StatCard(
          title: 'Completed Tasks',
          value: '${stats['completedTasks'] ?? 0}',
          icon: Icons.check_circle,
          iconColor: const Color(0xFFF59E0B), // Orange
          subtitle: 'Done',
        ),
        StatCard(
          title: 'Team Members',
          value: '${stats['teamMembers'] ?? 0}',
          icon: Icons.people,
          iconColor: const Color(0xFF8B5CF6), // Purple
          subtitle: 'Collaborating',
        ),
      ],
    );
  }


  Widget _buildQuickActions() {
    final actions = [
      {
        'title': 'Log Hours',
        'icon': Icons.access_time,
        'color': const Color(0xFF3B82F6),
        'onTap': () => context.go('/hours'),
      },
      {
        'title': 'Add Learning',
        'icon': Icons.book,
        'color': const Color(0xFF10B981),
        'onTap': () => context.go('/learnings'),
      },
      {
        'title': 'New Project',
        'icon': Icons.add,
        'color': const Color(0xFFF59E0B),
        'onTap': () => context.go('/projects'),
      },
      {
        'title': 'Update Profile',
        'icon': Icons.person,
        'color': const Color(0xFF8B5CF6),
        'onTap': () => context.go('/profile'),
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Actions',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: 2.5,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          children: actions.map((action) => _buildActionCard(action)).toList(),
        ),
      ],
    );
  }

  Widget _buildActionCard(Map<String, dynamic> action) {
    return CustomCard(
      onTap: action['onTap'],
      child: Row(
        children: [
          Icon(
            action['icon'],
            color: action['color'],
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              action['title'],
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentActivity() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Recent Activity',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        if (recentActivity.isEmpty)
          CustomCard(
            child: Center(
              child: Text(
                'No recent activity',
                style: const TextStyle(
                  color: Color(0xFF737373),
                  fontSize: 14,
                ),
              ),
            ),
          )
        else
          ...recentActivity.map((activity) => _buildActivityItem(activity)),
      ],
    );
  }

  Widget _buildActivityItem(Map<String, dynamic> activity) {
    return CustomCard(
      child: Row(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: const Color(0xFF262626),
            child: const Icon(
              Icons.timeline,
              size: 16,
              color: Color(0xFF3B82F6),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  activity['title'] ?? 'Activity',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (activity['description'] != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    activity['description'],
                    style: const TextStyle(
                      color: Color(0xFFA3A3A3),
                      fontSize: 12,
                    ),
                  ),
                ],
              ],
            ),
          ),
          Text(
            _formatTimeAgo(activity['created_at']),
            style: const TextStyle(
              color: Color(0xFF737373),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUpcomingEvents() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Upcoming Events',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        CustomCard(
          child: Center(
            child: Text(
              'No upcoming events',
              style: const TextStyle(
                color: Color(0xFF737373),
                fontSize: 14,
              ),
            ),
          ),
        ),
      ],
    );
  }


  String _formatTimeAgo(String? timestamp) {
    if (timestamp == null) return '';
    final now = DateTime.now();
    final time = DateTime.parse(timestamp);
    final difference = now.difference(time);
    
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
