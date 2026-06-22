import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/compare_provider.dart';
import '../../widgets/common/place_search_bar.dart';
import '../../../data/models/user.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(authNotifierProvider);

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(child: _Header(userAsync: userAsync)),
            SliverToBoxAdapter(child: _SearchSection()),
            SliverToBoxAdapter(child: _QuickActions()),
            SliverToBoxAdapter(child: _RecentRides()),
          ],
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final AsyncValue<User?> userAsync;
  const _Header({required this.userAsync});

  @override
  Widget build(BuildContext context) {
    final name = userAsync.valueOrNull?.fullName.split(' ').first ?? 'there';
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _greeting(),
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                ),
                const SizedBox(height: 2),
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => context.go('/profile'),
            child: CircleAvatar(
              radius: 22,
              backgroundColor: AppColors.primary.withOpacity(0.15),
              child: const Icon(Icons.person, color: AppColors.primary, size: 24),
            ),
          ),
        ],
      ),
    );
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  }
}

class _SearchSection extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),
          GestureDetector(
            onTap: () => context.push('/map-route'),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.darkCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.darkBorder),
              ),
              child: Column(
                children: [
                  _LocationRow(
                    icon: Icons.my_location_rounded,
                    iconColor: AppColors.primary,
                    hint: 'Where are you?',
                    isPickup: true,
                  ),
                  const Padding(
                    padding: EdgeInsets.only(left: 12),
                    child: Divider(color: AppColors.darkBorder, height: 16),
                  ),
                  _LocationRow(
                    icon: Icons.location_on_rounded,
                    iconColor: AppColors.surge,
                    hint: 'Where to?',
                    isPickup: false,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => context.push('/map-route'),
              icon: const Icon(Icons.search_rounded),
              label: const Text('Find Rides'),
            ),
          ),
        ],
      ),
    );
  }
}

class _LocationRow extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String hint;
  final bool isPickup;

  const _LocationRow({
    required this.icon,
    required this.iconColor,
    required this.hint,
    required this.isPickup,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: iconColor, size: 20),
        const SizedBox(width: 12),
        Text(hint, style: TextStyle(color: AppColors.textSecondary, fontSize: 15)),
      ],
    );
  }
}

class _QuickActions extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Quick Actions',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
          const SizedBox(height: 12),
          Row(
            children: [
              _QuickActionCard(
                icon: Icons.home_rounded,
                label: 'Home',
                color: AppColors.primary,
                onTap: () {},
              ),
              const SizedBox(width: 12),
              _QuickActionCard(
                icon: Icons.work_rounded,
                label: 'Work',
                color: AppColors.accent,
                onTap: () {},
              ),
              const SizedBox(width: 12),
              _QuickActionCard(
                icon: Icons.flight_rounded,
                label: 'Airport',
                color: AppColors.warning,
                onTap: () {},
              ),
              const SizedBox(width: 12),
              _QuickActionCard(
                icon: Icons.more_horiz_rounded,
                label: 'More',
                color: AppColors.textSecondary,
                onTap: () => context.go('/places'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withOpacity(0.2)),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 22),
              const SizedBox(height: 6),
              Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ),
    );
  }
}

class _RecentRides extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(rideHistoryProvider);

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Recent Rides',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
              TextButton(
                onPressed: () => context.go('/history'),
                child: const Text('See All', style: TextStyle(color: AppColors.primary)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          historyAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (_, __) => Center(
              child: Text('Could not load history',
                  style: TextStyle(color: AppColors.textSecondary)),
            ),
            data: (items) {
              if (items.isEmpty) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(
                      'No rides yet. Compare your first ride!',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  ),
                );
              }
              return Column(
                children: items.take(3).map((item) => _RecentRideCard(item: item)).toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _RecentRideCard extends StatelessWidget {
  final dynamic item;
  const _RecentRideCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.directions_car, color: AppColors.primary, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.destinationAddress,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
                ),
                const SizedBox(height: 2),
                Text(
                  item.pickupAddress,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                ),
              ],
            ),
          ),
          if (item.cheapestFare != null)
            Text(
              '₹${item.cheapestFare!.toInt()}',
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
            ),
        ],
      ),
    );
  }
}
