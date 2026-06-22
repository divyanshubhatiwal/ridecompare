import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../providers/compare_provider.dart';

class PreferencesScreen extends ConsumerWidget {
  const PreferencesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prefsAsync = ref.watch(preferencesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ride Preferences'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new),
          onPressed: () => context.pop(),
        ),
      ),
      body: prefsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('Could not load preferences')),
        data: (prefs) => ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const _SectionHeader('Sort Preference'),
            _RadioTile(
              title: 'Cheapest First',
              subtitle: 'Always show the lowest-cost option first',
              value: 'cheapest',
              groupValue: prefs?.preferredSort ?? 'cheapest',
              onChanged: (_) {},
            ),
            _RadioTile(
              title: 'Fastest First',
              subtitle: 'Always show the quickest pickup first',
              value: 'fastest',
              groupValue: prefs?.preferredSort ?? 'cheapest',
              onChanged: (_) {},
            ),
            const SizedBox(height: 16),
            const _SectionHeader('Surge Pricing'),
            _SwitchTile(
              icon: Icons.local_fire_department,
              title: 'Avoid Surge',
              subtitle: 'Hide providers with active surge pricing',
              value: prefs?.avoidSurge ?? false,
              onChanged: (_) {},
            ),
            const SizedBox(height: 16),
            const _SectionHeader('Special Modes'),
            _SwitchTile(
              icon: Icons.flight_rounded,
              title: 'Airport Mode',
              subtitle: 'Optimise for airport routes (larger vehicles, fixed fares)',
              value: prefs?.airportMode ?? false,
              onChanged: (_) {},
            ),
            const SizedBox(height: 16),
            const _SectionHeader('Notifications'),
            _SwitchTile(
              icon: Icons.notifications_outlined,
              title: 'Push Notifications',
              subtitle: 'Allow RideCompare to send alerts',
              value: prefs?.notificationsEnabled ?? true,
              onChanged: (_) {},
            ),
            _SwitchTile(
              icon: Icons.price_change_outlined,
              title: 'Price Alerts',
              subtitle: 'Notify when fare drops below your threshold',
              value: prefs?.priceAlertEnabled ?? true,
              onChanged: (_) {},
            ),
            _SwitchTile(
              icon: Icons.trending_down,
              title: 'Surge End Alerts',
              subtitle: 'Notify when surge pricing ends',
              value: prefs?.surgeAlertEnabled ?? true,
              onChanged: (_) {},
            ),
          ],
        ),
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
      child: Text(title,
          style: TextStyle(
              color: AppColors.textSecondary, fontSize: 12,
              fontWeight: FontWeight.w600, letterSpacing: 0.8)),
    );
  }
}

class _RadioTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final String value;
  final String groupValue;
  final ValueChanged<String?> onChanged;

  const _RadioTile({
    required this.title,
    required this.subtitle,
    required this.value,
    required this.groupValue,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
            color: value == groupValue
                ? AppColors.primary.withOpacity(0.4)
                : AppColors.darkBorder),
      ),
      child: RadioListTile<String>(
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
        subtitle: Text(subtitle, style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
        value: value,
        groupValue: groupValue,
        onChanged: onChanged,
        activeColor: AppColors.primary,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}

class _SwitchTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _SwitchTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
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
      child: SwitchListTile(
        secondary: Icon(icon, color: AppColors.primary, size: 22),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
        subtitle: Text(subtitle, style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
        value: value,
        onChanged: onChanged,
        activeColor: AppColors.primary,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
