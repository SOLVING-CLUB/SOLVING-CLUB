import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'components/app_bar.dart';
import 'components/bottom_nav_bar.dart';
import 'components/card.dart';

class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({super.key});
  @override
  State<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> {
  bool loading = true;
  List<Map<String, dynamic>> projects = [];
  String search = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final supabase = Supabase.instance.client;
    final user = supabase.auth.currentUser;
    if (user == null) return;

    // Owned
    final owned = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id)
        .order('updated_at', ascending: false);

    // Member (non-owner)
    final memberRows = await supabase
        .from('project_members')
        .select('project_id, projects(*)')
        .eq('user_id', user.id)
        .neq('role', 'owner');

    final memberProjects = (memberRows as List?)
            ?.map((e) => (e['projects'] as Map<String, dynamic>?))
            .whereType<Map<String, dynamic>>()
            .toList() ??
        [];

    final all = [...(owned as List), ...memberProjects];
    final unique = {
      for (final p in all) p['id'] as String: p as Map<String, dynamic>
    };

    setState(() {
      projects = unique.values.toList();
      loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final filtered = projects.where((p) {
      final q = search.toLowerCase();
      if (q.isEmpty) return true;
      return (p['name'] ?? '').toString().toLowerCase().contains(q) ||
          (p['description'] ?? '').toString().toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F), // Black background
      appBar: CustomAppBar(
        title: 'Projects',
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: loading ? null : _load,
          )
        ],
      ),
      body: loading
          ? const Center(
              child: CircularProgressIndicator(
                color: Colors.white,
              ),
            )
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: TextField(
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Search projects...',
                      hintStyle: const TextStyle(color: Color(0xFF737373)),
                      prefixIcon: const Icon(Icons.search, color: Color(0xFF737373)),
                      filled: true,
                      fillColor: const Color(0xFF1A1A1A),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFF262626)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFF262626)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFF0F0F0F)),
                      ),
                    ),
                    onChanged: (v) => setState(() => search = v),
                  ),
                ),
                Expanded(
                  child: GridView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 1,
                      childAspectRatio: 2.2,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final p = filtered[index];
                      return _ProjectCard(
                        name: p['name'] ?? '',
                        description: p['description'] ?? '',
                        status: p['status'] ?? 'planning',
                        updatedAt: DateTime.tryParse(p['updated_at'] ?? '') ?? DateTime.now(),
                        onTap: () => GoRouter.of(context).go('/projects/${p['id']}'),
                      );
                    },
                  ),
                ),
              ],
            ),
      bottomNavigationBar: const CustomBottomNavBar(currentIndex: 1),
    );
  }
}

class _ProjectCard extends StatelessWidget {
  final String name;
  final String description;
  final String status;
  final DateTime updatedAt;
  final VoidCallback onTap;
  const _ProjectCard({
    required this.name,
    required this.description,
    required this.status,
    required this.updatedAt,
    required this.onTap,
  });

  Color _statusColor() {
    switch (status) {
      case 'active':
        return const Color(0xFF10B981); // Green
      case 'completed':
        return const Color(0xFF3B82F6); // Blue
      case 'on-hold':
        return const Color(0xFF737373); // Grey
      default:
        return const Color(0xFFF59E0B); // Amber
    }
  }

  @override
  Widget build(BuildContext context) {
    return CustomCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _statusColor().withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  status.toUpperCase(),
                  style: TextStyle(
                    color: _statusColor(),
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (description.isNotEmpty)
            Text(
              description,
              style: const TextStyle(
                color: Color(0xFFA3A3A3),
                fontSize: 14,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.calendar_month, size: 16, color: Color(0xFF737373)),
              const SizedBox(width: 4),
              Text(
                '${updatedAt.toLocal().toString().split(' ').first}',
                style: const TextStyle(
                  color: Color(0xFF737373),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}


