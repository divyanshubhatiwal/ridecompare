import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/common/rc_text_field.dart';
import '../../widgets/common/rc_button.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(authNotifierProvider.notifier).login(
          _emailCtrl.text.trim(),
          _passwordCtrl.text,
        );
    final error = ref.read(authNotifierProvider).error;
    if (!mounted) return;
    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString()), backgroundColor: AppColors.error),
      );
    } else {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(authNotifierProvider).isLoading;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 40),
                _Logo(),
                const SizedBox(height: 40),
                const Text(
                  'Welcome back',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Text(
                  'Sign in to compare rides',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 16),
                ),
                const SizedBox(height: 36),
                RcTextField(
                  controller: _emailCtrl,
                  label: 'Email',
                  hint: 'you@example.com',
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) => (v?.isEmpty ?? true) ? 'Enter your email' : null,
                ),
                const SizedBox(height: 16),
                RcTextField(
                  controller: _passwordCtrl,
                  label: 'Password',
                  hint: '••••••••',
                  obscureText: _obscure,
                  validator: (v) => (v?.isEmpty ?? true) ? 'Enter your password' : null,
                  suffix: IconButton(
                    icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility,
                        color: AppColors.textSecondary),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: RcButton(
                    onPressed: isLoading ? null : _login,
                    isLoading: isLoading,
                    label: 'Sign In',
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text("Don't have an account? ",
                        style: TextStyle(color: AppColors.textSecondary)),
                    GestureDetector(
                      onTap: () => context.go('/register'),
                      child: const Text(
                        'Sign Up',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Logo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.primary, AppColors.accent],
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Icon(Icons.compare_arrows_rounded, color: Colors.white, size: 26),
      ),
      const SizedBox(width: 12),
      const Text('RideCompare',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
    ]);
  }
}
