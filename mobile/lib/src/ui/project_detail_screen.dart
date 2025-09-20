import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ProjectDetailScreen extends StatefulWidget {
  final String projectId;
  const ProjectDetailScreen({super.key, required this.projectId});

  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> with SingleTickerProviderStateMixin {
  bool loading = true;
  Map<String, dynamic>? project;
  late final TabController _tabs = TabController(length: 5, vsync: this);

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await Supabase.instance.client
        .from('projects')
        .select('*')
        .eq('id', widget.projectId)
        .maybeSingle();
    setState(() {
      project = data as Map<String, dynamic>?;
      loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(project?['name'] ?? 'Project'),
        bottom: TabBar(
          controller: _tabs,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Tasks'),
            Tab(text: 'Members'),
            Tab(text: 'Files'),
            Tab(text: 'Chat'),
          ],
        ),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabs,
              children: const [
                Center(child: Text('Overview')),
                Center(child: Text('Tasks')),
                Center(child: Text('Members')),
                Center(child: Text('Files')),
                Center(child: Text('Chat')),
              ],
            ),
    );
  }
}


