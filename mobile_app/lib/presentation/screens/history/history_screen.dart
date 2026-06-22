import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../providers/compare_provider.dart';
import '../../../data/models/user.dart';

class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(rideHistoryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ride History'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(rideHistoryProvider.notifier).refresh(),
          ),
        ],
      ),
      body: historyAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Text('Error: $err', style: TextStyle(color: AppColors.error)),
        ),
        data: (items) {
          if (items.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.history, size: 64, color: AppColors.textSecondary),
                  const SizedBox(height: 16),
                  const Text('No ride history yet',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text('Your compared rides will appear here',
                      style: TextStyle(color: AppColors.textSecondary)),
                ],
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            itemBuilder: (_, i) => _HistoryCard(item: items[i]),
          );
        },
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  final RideHistoryItem item;
  const _HistoryCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.directions_car, color: AppColors.primary, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.destinationAddress,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    Text(
                      'From: ${item.pickupAddress}',
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
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Icon(Icons.access_time, size: 12, color: AppColors.textSecondary),
              const SizedBox(width: 4),
              Text(item.searchedAt.substring(0, 10),
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 11)),
              const SizedBox(width: 12),
              Icon(Icons.compare_arrows, size: 12, color: AppColors.textSecondary),
              const SizedBox(width: 4),
              Text('${item.resultCount} options',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 11)),
              if (item.cheapestProvider != null) ...[
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.cheapest.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    item.cheapestProvider!.toUpperCase(),
                    style: const TextStyle(
                        color: AppColors.cheapest, fontSize: 9, fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
