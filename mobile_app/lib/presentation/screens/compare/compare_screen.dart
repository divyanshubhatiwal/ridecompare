import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/ride_estimate.dart';
import '../../providers/compare_provider.dart';
import '../../widgets/cards/provider_card.dart';
import '../../widgets/common/sort_chips.dart';
import '../../widgets/common/shimmer_list.dart';

class CompareScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> routeData;
  const CompareScreen({super.key, required this.routeData});

  @override
  ConsumerState<CompareScreen> createState() => _CompareScreenState();
}

class _CompareScreenState extends ConsumerState<CompareScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final route = RouteData.fromJson(widget.routeData);
      ref.read(compareResultsProvider.notifier).compare(route);
    });
  }

  @override
  Widget build(BuildContext context) {
    final compareAsync = ref.watch(compareResultsProvider);
    final sortedResults = ref.watch(sortedResultsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Compare Rides'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune_rounded),
            onPressed: () => context.push('/preferences'),
          ),
        ],
      ),
      body: compareAsync.when(
        loading: () => const ShimmerList(),
        error: (err, _) => _ErrorState(message: err.toString()),
        data: (response) {
          if (response == null) return const _EmptyState();
          if (sortedResults.isEmpty) return const _NoRidesState();

          return Column(
            children: [
              _RouteHeader(response: response),
              const SortChips(),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () async {
                    final route = RouteData.fromJson(widget.routeData);
                    await ref.read(compareResultsProvider.notifier).compare(route);
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                    itemCount: sortedResults.length,
                    itemBuilder: (_, i) => ProviderCard(
                      estimate: sortedResults[i],
                      onTap: () => context.push(
                        '/provider-detail',
                        extra: sortedResults[i].toJson(),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _RouteHeader extends StatelessWidget {
  final CompareResponse response;
  const _RouteHeader({required this.response});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: Column(
        children: [
          Row(children: [
            const Icon(Icons.circle, color: AppColors.primary, size: 10),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                response.pickupAddress,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
              ),
            ),
          ]),
          const SizedBox(height: 6),
          Row(children: [
            const Icon(Icons.location_on, color: AppColors.surge, size: 14),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                response.destinationAddress,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
              ),
            ),
          ]),
          const Divider(color: AppColors.darkBorder, height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _InfoChip(
                icon: Icons.local_taxi,
                label: '${response.availableProviders} providers',
              ),
              _InfoChip(
                icon: Icons.route,
                label: response.distanceKm != null
                    ? '${response.distanceKm!.toStringAsFixed(1)} km'
                    : 'Route',
              ),
              _InfoChip(
                icon: Icons.compare_arrows,
                label: '${response.results.length} options',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Icon(icon, size: 14, color: AppColors.textSecondary),
      const SizedBox(width: 4),
      Text(label, style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
    ]);
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  const _ErrorState({required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: AppColors.error, size: 64),
            const SizedBox(height: 16),
            const Text('Something went wrong',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Text(message,
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.pop(),
              child: const Text('Go Back'),
            ),
          ],
        ),
      ),
    );
  }
}

class _NoRidesState extends StatelessWidget {
  const _NoRidesState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.search_off_rounded, size: 64, color: AppColors.textSecondary),
          const SizedBox(height: 16),
          const Text('No rides available',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text(
            'No providers are serving this route right now.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return const Center(child: CircularProgressIndicator());
  }
}
