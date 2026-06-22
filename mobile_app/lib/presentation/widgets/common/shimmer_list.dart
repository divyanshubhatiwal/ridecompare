import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/theme/app_theme.dart';

class ShimmerList extends StatelessWidget {
  const ShimmerList({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Shimmer.fromColors(
        baseColor: AppColors.darkCard,
        highlightColor: AppColors.darkBorder,
        child: Column(
          children: List.generate(5, (_) => const _ShimmerCard()),
        ),
      ),
    );
  }
}

class _ShimmerCard extends StatelessWidget {
  const _ShimmerCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Container(width: 48, height: 48, decoration: BoxDecoration(
            color: Colors.white, borderRadius: BorderRadius.circular(12))),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(height: 14, width: 120, color: Colors.white),
                const SizedBox(height: 6),
                Container(height: 12, width: 80, color: Colors.white),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(height: 20, width: 60, color: Colors.white),
              const SizedBox(height: 6),
              Container(height: 12, width: 50, color: Colors.white),
            ],
          ),
        ],
      ),
    );
  }
}
