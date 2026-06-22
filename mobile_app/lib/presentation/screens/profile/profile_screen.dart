import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(authNotifierProvider);
    final user = userAsync.valueOrNull;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Avatar section
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 44,
                  backgroundColor: AppColors.primary.withOpacity(0.15),
                  child: Text(
                    user?.fullName.substring(0, 1).toUpperCase() ?? '?',
                    style: const TextStyle(
                        fontSize: 36, fontWeight: FontWeight.w700, color: AppColors.primary),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  user?.fullName ?? 'Loading...',
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
                ),
                Text(
                  user?.email ?? '',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          const _SectionHeader('Settings'),
          _SettingsTile(
            icon: Icons.tune_rounded,
            title: 'Ride Preferences',
            onTap: () => context.push('/preferences'),
          ),
          _SettingsTile(
            icon: Icons.place_outlined,
            title: 'Saved Places',
            onTap: () => context.go('/places'),
          ),
          _SettingsTile(
            icon: Icons.notifications_outlined,
            title: 'Price Alerts',
            onTap: () => context.go('/alerts'),
          ),
          Consumer(builder: (context, ref, _) {
            final mode = ref.watch(themeModeProvider);
            return _SettingsTile(
              icon: Icons.dark_mode_outlined,
              title: 'Dark Mode',
              trailing: Switch(
                value: mode == ThemeMode.dark,
                onChanged: (_) => ref.read(themeModeProvider.notifier).toggle(),
                activeColor: AppColors.primary,
              ),
            );
          }),

          const SizedBox(height: 16),
          const _SectionHeader('Account'),
          _SettingsTile(
            icon: Icons.history,
            title: 'Ride History',
            onTap: () => context.go('/history'),
          ),
          _SettingsTile(
            icon: Icons.help_outline_rounded,
            title: 'Help & Support',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.privacy_tip_outlined,
            title: 'Privacy Policy',
            onTap: () {},
          ),

          const SizedBox(height: 24),
          OutlinedButton.icon(
            onPressed: () async {
              await ref.read(authNotifierProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
            icon: const Icon(Icons.logout, color: AppColors.error),
            label: const Text('Sign Out', style: TextStyle(color: AppColors.error)),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppColors.error),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        title,
        style: TextStyle(
          color: AppColors.textSecondary,
          fontSize: 12,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback? onTap;
  final Widget? trailing;

  const _SettingsTile({
    required this.icon,
    required this.title,
    this.onTap,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary, size: 22),
        title: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        trailing: trailing ?? const Icon(Icons.chevron_right, color: AppColors.textSecondary),
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
