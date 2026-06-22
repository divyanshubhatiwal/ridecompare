import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../providers/compare_provider.dart';

class SortChips extends ConsumerWidget {
  const SortChips({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(sortModeProvider);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        children: [
          const Text('Sort by: ', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
          const SizedBox(width: 8),
          _SortChip(
            label: 'Cheapest',
            icon: Icons.local_offer,
            value: 'cheapest',
            current: current,
            color: AppColors.cheapest,
          ),
          const SizedBox(width: 8),
          _SortChip(
            label: 'Fastest',
            icon: Icons.flash_on,
            value: 'fastest',
            current: current,
            color: AppColors.fastest,
          ),
        ],
      ),
    );
  }
}

class _SortChip extends ConsumerWidget {
  final String label;
  final IconData icon;
  final String value;
  final String current;
  final Color color;

  const _SortChip({
    required this.label,
    required this.icon,
    required this.value,
    required this.current,
    required this.color,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final active = current == value;
    return GestureDetector(
      onTap: () => ref.read(sortModeProvider.notifier).state = value,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: active ? color.withOpacity(0.15) : AppColors.darkCard,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: active ? color.withOpacity(0.5) : AppColors.darkBorder,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, size: 13, color: active ? color : AppColors.textSecondary),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: active ? color : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
