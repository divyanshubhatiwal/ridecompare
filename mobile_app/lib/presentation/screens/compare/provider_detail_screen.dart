import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/ride_estimate.dart';
import '../../widgets/cards/provider_card.dart';

class ProviderDetailScreen extends StatelessWidget {
  final Map<String, dynamic> data;
  const ProviderDetailScreen({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    final estimate = RideEstimate.fromJson(data);

    return Scaffold(
      appBar: AppBar(
        title: Text(estimate.categoryDisplay),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _HeroCard(estimate: estimate),
            const SizedBox(height: 24),
            const Text('Ride Details',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            _DetailRow(icon: Icons.local_taxi, label: 'Provider', value: estimate.providerDisplayName),
            _DetailRow(icon: Icons.category, label: 'Category', value: estimate.categoryDisplay),
            _DetailRow(icon: Icons.chair, label: 'Comfort', value: estimate.comfortLevel.toUpperCase()),
            _DetailRow(icon: Icons.directions_car, label: 'Vehicle', value: estimate.vehicleType.toUpperCase()),
            _DetailRow(icon: Icons.schedule, label: 'ETA', value: '${estimate.etaMinutes} minutes'),
            _DetailRow(
              icon: Icons.currency_rupee,
              label: 'Estimated Fare',
              value: estimate.fareDisplay,
              valueColor: Colors.white,
            ),
            if (estimate.isSurging)
              _DetailRow(
                icon: Icons.local_fire_department,
                label: 'Surge',
                value: '${estimate.surgeMultiplier}x active',
                valueColor: AppColors.surge,
              ),
            const SizedBox(height: 32),
            if (estimate.badges.isNotEmpty) ...[
              const Text('Recognition',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                children: estimate.badges.map((b) => _Badge(badge: b)).toList(),
              ),
              const SizedBox(height: 32),
            ],
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () async {
                  final uri = Uri.parse(estimate.deeplinkUrl);
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  }
                },
                icon: const Icon(Icons.open_in_new),
                label: Text('Book on ${estimate.providerDisplayName}'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => context.pop(),
                child: const Text('Back to Results'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  final RideEstimate estimate;
  const _HeroCard({required this.estimate});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary.withOpacity(0.2), AppColors.darkCard],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.15),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: Text(
                estimate.providerDisplayName[0],
                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: AppColors.primary),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(estimate.categoryDisplay,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                Text(estimate.providerDisplayName,
                    style: TextStyle(color: AppColors.textSecondary)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(estimate.fareDisplay,
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
              Text('${estimate.etaMinutes} min',
                  style: TextStyle(color: AppColors.textSecondary)),
            ],
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Icon(icon, color: AppColors.textSecondary, size: 18),
          const SizedBox(width: 12),
          Text(label, style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
          const Spacer(),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w500,
              fontSize: 14,
              color: valueColor,
            ),
          ),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final String badge;
  const _Badge({required this.badge});

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;
    switch (badge) {
      case 'cheapest':
        color = AppColors.cheapest;
        label = 'Cheapest Option';
      case 'fastest':
        color = AppColors.fastest;
        label = 'Fastest Option';
      default:
        color = AppColors.bestValue;
        label = 'Best Value';
    }
    return Chip(
      label: Text(label),
      backgroundColor: color.withOpacity(0.12),
      side: BorderSide(color: color.withOpacity(0.4)),
      labelStyle: TextStyle(color: color, fontWeight: FontWeight.w600),
    );
  }
}
