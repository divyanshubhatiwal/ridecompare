import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/ride_estimate.dart';

class ProviderCard extends StatelessWidget {
  final RideEstimate estimate;
  final VoidCallback? onTap;

  const ProviderCard({super.key, required this.estimate, this.onTap});

  @override
  Widget build(BuildContext context) {
    final hasBestValue = estimate.badges.contains('best_value');
    final isCheapest = estimate.badges.contains('cheapest');
    final isFastest = estimate.badges.contains('fastest');

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppColors.darkCard,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: hasBestValue
                ? AppColors.bestValue.withOpacity(0.5)
                : isCheapest
                    ? AppColors.cheapest.withOpacity(0.3)
                    : isFastest
                        ? AppColors.fastest.withOpacity(0.3)
                        : AppColors.darkBorder,
            width: hasBestValue ? 1.5 : 1,
          ),
          boxShadow: hasBestValue
              ? [BoxShadow(color: AppColors.bestValue.withOpacity(0.08), blurRadius: 12)]
              : null,
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
                children: [
                  _ProviderLogo(estimate: estimate),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              estimate.categoryDisplay,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(width: 8),
                            if (estimate.isSurging) _SurgeIndicator(estimate.surgeMultiplier),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          estimate.providerDisplayName,
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        estimate.fareDisplay,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(Icons.schedule, size: 12, color: AppColors.textSecondary),
                          const SizedBox(width: 4),
                          Text(
                            '${estimate.etaMinutes} mins',
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
              if (estimate.badges.isNotEmpty || estimate.isSurging) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    ...estimate.badges.map((b) => _Badge(badge: b)),
                    const Spacer(),
                    _BookButton(estimate: estimate),
                  ],
                ),
              ] else ...[
                const SizedBox(height: 10),
                Align(
                  alignment: Alignment.centerRight,
                  child: _BookButton(estimate: estimate),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _ProviderLogo extends StatelessWidget {
  final RideEstimate estimate;
  const _ProviderLogo({required this.estimate});

  Color get _providerColor {
    switch (estimate.provider) {
      case 'uber': return const Color(0xFF000000);
      case 'ola': return const Color(0xFF00AB42);
      case 'rapido': return const Color(0xFFFFCC00);
      case 'namma_yatri': return const Color(0xFF3D5A80);
      default: return AppColors.primary;
    }
  }

  String get _initial => estimate.providerDisplayName.substring(0, 1).toUpperCase();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: _providerColor.withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _providerColor.withOpacity(0.3)),
      ),
      child: Center(
        child: Text(
          _initial,
          style: TextStyle(
            color: _providerColor == Colors.black ? AppColors.textPrimary : _providerColor,
            fontWeight: FontWeight.w800,
            fontSize: 20,
          ),
        ),
      ),
    );
  }
}

class _SurgeIndicator extends StatelessWidget {
  final double multiplier;
  const _SurgeIndicator(this.multiplier);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.surge.withOpacity(0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppColors.surge.withOpacity(0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.local_fire_department, color: AppColors.surge, size: 10),
          const SizedBox(width: 3),
          Text(
            '${multiplier}x',
            style: const TextStyle(
              color: AppColors.surge,
              fontSize: 10,
              fontWeight: FontWeight.w600,
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

  Color get _color {
    switch (badge) {
      case 'cheapest': return AppColors.cheapest;
      case 'fastest': return AppColors.fastest;
      case 'best_value': return AppColors.bestValue;
      default: return AppColors.textSecondary;
    }
  }

  String get _label {
    switch (badge) {
      case 'cheapest': return 'CHEAPEST';
      case 'fastest': return 'FASTEST';
      case 'best_value': return 'BEST VALUE';
      default: return badge.toUpperCase();
    }
  }

  IconData get _icon {
    switch (badge) {
      case 'cheapest': return Icons.local_offer;
      case 'fastest': return Icons.flash_on;
      case 'best_value': return Icons.star;
      default: return Icons.check;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 6),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: _color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: _color.withOpacity(0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_icon, color: _color, size: 10),
          const SizedBox(width: 4),
          Text(
            _label,
            style: TextStyle(
              color: _color,
              fontSize: 9,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _BookButton extends StatelessWidget {
  final RideEstimate estimate;
  const _BookButton({required this.estimate});

  Future<void> _launch() async {
    final uri = Uri.parse(estimate.deeplinkUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 34,
      child: ElevatedButton(
        onPressed: estimate.available ? _launch : null,
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        ),
        child: const Text('BOOK'),
      ),
    );
  }
}
