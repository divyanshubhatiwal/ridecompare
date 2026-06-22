import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/common/rc_text_field.dart';
import '../../widgets/common/rc_button.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(authNotifierProvider.notifier).register(
          _emailCtrl.text.trim(),
          _nameCtrl.text.trim(),
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
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new),
          onPressed: () => context.go('/login'),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Create Account',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Text(
                  'Start comparing rides for free',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 16),
                ),
                const SizedBox(height: 36),
                RcTextField(
                  controller: _nameCtrl,
                  label: 'Full Name',
                  hint: 'Arjun Sharma',
                  validator: (v) => (v?.isEmpty ?? true) ? 'Enter your name' : null,
                ),
                const SizedBox(height: 16),
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
                  hint: 'Min. 8 characters',
                  obscureText: _obscure,
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Enter a password';
                    if (v.length < 8) return 'Minimum 8 characters';
                    return null;
                  },
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
                    onPressed: isLoading ? null : _register,
                    isLoading: isLoading,
                    label: 'Create Account',
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text("Already have an account? ",
                        style: TextStyle(color: AppColors.textSecondary)),
                    GestureDetector(
                      onTap: () => context.go('/login'),
                      child: const Text(
                        'Sign In',
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
