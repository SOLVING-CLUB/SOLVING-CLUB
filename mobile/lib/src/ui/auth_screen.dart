import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'components/app_bar.dart';
import 'components/card.dart';
import 'components/button.dart';
import 'components/input.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});
  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final emailCtrl = TextEditingController();
  final passwordCtrl = TextEditingController();
  final confirmPasswordCtrl = TextEditingController();
  final nameCtrl = TextEditingController();
  bool loading = false;
  String? errorText;
  bool isSignUp = false;
  bool showPassword = false;
  bool showConfirmPassword = false;

  Future<void> _submit() async {
    setState(() { loading = true; errorText = null; });
    try {
      final email = emailCtrl.text.trim();
      final password = passwordCtrl.text.trim();
      final name = nameCtrl.text.trim();
      
      if (email.isEmpty || password.isEmpty) {
        setState(() { errorText = 'Email and password are required'; });
        return;
      }
      
      if (isSignUp) {
        if (name.isEmpty) {
          setState(() { errorText = 'Name is required for sign up'; });
          return;
        }
        if (password.length < 6) {
          setState(() { errorText = 'Password must be at least 6 characters'; });
          return;
        }
        if (password != confirmPasswordCtrl.text.trim()) {
          setState(() { errorText = 'Passwords do not match'; });
          return;
        }
      }
      
      final auth = Supabase.instance.client.auth;
      if (isSignUp) {
        await auth.signUp(
          email: email, 
          password: password,
          data: {'full_name': name},
        );
      } else {
        await auth.signInWithPassword(email: email, password: password);
      }
    } on AuthException catch (e) {
      setState(() { errorText = e.message; });
    } finally {
      if (mounted) setState(() { loading = false; });
    }
  }

  @override
  void initState() {
    super.initState();
    Supabase.instance.client.auth.onAuthStateChange.listen((event) {
      if (event.session != null && mounted) {
        GoRouter.of(context).go('/dashboard');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F), // Black background
      appBar: CustomAppBar(
        title: isSignUp ? 'Create Account' : 'Sign In',
        showBackButton: false,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              _buildHeader(),
              const SizedBox(height: 40),
              _buildAuthCard(),
              const SizedBox(height: 24),
              _buildToggleAuth(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A1A),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFF262626)),
          ),
          child: const Icon(
            Icons.rocket_launch,
            color: Color(0xFF3B82F6),
            size: 40,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          isSignUp ? 'Create your account' : 'Welcome back',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          isSignUp 
              ? 'Join Solving Club and start managing your projects'
              : 'Sign in to continue to your dashboard',
          style: const TextStyle(
            color: Color(0xFFA3A3A3),
            fontSize: 16,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildAuthCard() {
    return CustomCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (isSignUp) ...[
            CustomInput(
              label: 'Full Name',
              controller: nameCtrl,
              hintText: 'Enter your full name',
              prefixIcon: const Icon(Icons.person_outline, color: Color(0xFF737373)),
            ),
            const SizedBox(height: 16),
          ],
          CustomInput(
            label: 'Email',
            controller: emailCtrl,
            hintText: 'Enter your email',
            keyboardType: TextInputType.emailAddress,
            prefixIcon: const Icon(Icons.email_outlined, color: Color(0xFF737373)),
          ),
          const SizedBox(height: 16),
          CustomInput(
            label: 'Password',
            controller: passwordCtrl,
            hintText: 'Enter your password',
            obscureText: !showPassword,
            suffixIcon: IconButton(
              icon: Icon(
                showPassword ? Icons.visibility_off : Icons.visibility,
                color: const Color(0xFF737373),
              ),
              onPressed: () => setState(() => showPassword = !showPassword),
            ),
            prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFF737373)),
          ),
          if (isSignUp) ...[
            const SizedBox(height: 16),
            CustomInput(
              label: 'Confirm Password',
              controller: confirmPasswordCtrl,
              hintText: 'Confirm your password',
              obscureText: !showConfirmPassword,
              suffixIcon: IconButton(
                icon: Icon(
                  showConfirmPassword ? Icons.visibility_off : Icons.visibility,
                  color: const Color(0xFF737373),
                ),
                onPressed: () => setState(() => showConfirmPassword = !showConfirmPassword),
              ),
              prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFF737373)),
            ),
          ],
          if (errorText != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: Color(0xFFEF4444), size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      errorText!,
                      style: const TextStyle(color: Color(0xFFEF4444), fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 24),
          CustomButton(
            text: isSignUp ? 'Create Account' : 'Sign In',
            onPressed: loading ? null : _submit,
            isLoading: loading,
            isFullWidth: true,
            icon: isSignUp ? Icons.person_add : Icons.login,
          ),
        ],
      ),
    );
  }

  Widget _buildToggleAuth() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          isSignUp ? 'Already have an account? ' : 'Don\'t have an account? ',
          style: const TextStyle(
            color: Color(0xFFA3A3A3),
            fontSize: 14,
          ),
        ),
        GestureDetector(
          onTap: () {
            setState(() {
              isSignUp = !isSignUp;
              errorText = null;
              // Clear form fields
              emailCtrl.clear();
              passwordCtrl.clear();
              nameCtrl.clear();
              confirmPasswordCtrl.clear();
            });
          },
          child: Text(
            isSignUp ? 'Sign In' : 'Sign Up',
            style: const TextStyle(
              color: Color(0xFF3B82F6),
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}



