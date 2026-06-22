import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class PlaceSearchBar extends StatelessWidget {
  final String hint;
  final VoidCallback? onTap;
  final String? value;

  const PlaceSearchBar({super.key, required this.hint, this.onTap, this.value});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.darkCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.darkBorder),
        ),
        child: Row(
          children: [
            const Icon(Icons.search, color: AppColors.textSecondary, size: 20),
            const SizedBox(width: 10),
            Text(
              value ?? hint,
              style: TextStyle(
                color: value != null ? null : AppColors.textSecondary,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
