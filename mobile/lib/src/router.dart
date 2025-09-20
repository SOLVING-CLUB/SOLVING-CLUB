import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'ui/auth_screen.dart';
import 'ui/dashboard_screen.dart';
import 'ui/projects_screen.dart';
import 'ui/project_detail_screen.dart';
import 'ui/hours_screen.dart';
import 'ui/learnings_screen.dart';
import 'ui/profile_screen.dart';

GoRouter buildRouter() {
  return GoRouter(
    initialLocation: '/gate',
    routes: [
      GoRoute(
        path: '/gate',
        builder: (context, state) => const _Gate(),
      ),
      GoRoute(
        path: '/auth',
        builder: (context, state) => const AuthScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DashboardScreen(),
      ),
      GoRoute(
        path: '/projects',
        builder: (context, state) => const ProjectsScreen(),
      ),
      GoRoute(
        path: '/projects/:id',
        builder: (context, state) => ProjectDetailScreen(
          projectId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/hours',
        builder: (context, state) => const HoursScreen(),
      ),
      GoRoute(
        path: '/learnings',
        builder: (context, state) => const LearningsScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
    ],
  );
}

class _Gate extends StatefulWidget {
  const _Gate();
  @override
  State<_Gate> createState() => _GateState();
}

class _GateState extends State<_Gate> {
  @override
  void initState() {
    super.initState();
    final session = Supabase.instance.client.auth.currentSession;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (session == null) {
        GoRouter.of(context).go('/auth');
      } else {
        GoRouter.of(context).go('/dashboard');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F), // Black background
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: const Color(0xFF1A1A1A),
                borderRadius: BorderRadius.circular(25),
                border: Border.all(color: const Color(0xFF262626)),
              ),
              child: const Icon(
                Icons.rocket_launch,
                color: Color(0xFF3B82F6),
                size: 50,
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'Solving Club',
              style: TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Project Management Made Simple',
              style: TextStyle(
                color: Color(0xFFA3A3A3),
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 48),
            const CircularProgressIndicator(
              color: Color(0xFF3B82F6),
              strokeWidth: 3,
            ),
            const SizedBox(height: 16),
            const Text(
              'Loading...',
              style: TextStyle(
                color: Color(0xFF737373),
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}


