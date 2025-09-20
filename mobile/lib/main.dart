import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'src/router.dart';

// Hardcoded Supabase config per user request
const String supabaseUrl = 'https://knkybbflxkqexjdfcnvt.supabase.co';
const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtua3liYmZseGtxZXhqZGZjbnZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4OTY5NzMsImV4cCI6MjA3MjQ3Mjk3M30.qBiee1YD64YT5MMBQUjDPT4YW2WhRIFHqDb4bci1pvc';

Future<void> main() async {
	WidgetsFlutterBinding.ensureInitialized();
	await Supabase.initialize(url: supabaseUrl, anonKey: supabaseAnonKey);
	runApp(const ProviderScope(child: SolvingClubApp()));
}

class SolvingClubApp extends StatelessWidget {
	const SolvingClubApp({super.key});

	@override
	Widget build(BuildContext context) {
		return MaterialApp.router(
			debugShowCheckedModeBanner: false,
			title: 'Solving Club',
			theme: ThemeData(
				colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6C5CE7)),
				useMaterial3: true,
			),
			routerConfig: buildRouter(),
		);
	}
}
