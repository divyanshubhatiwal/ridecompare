import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';

final alertsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  // TODO: connect to alerts datasource
  return [];
});

class AlertsScreen extends ConsumerWidget {
  const AlertsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Price Alerts'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showCreateAlert(context),
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.notifications_none, size: 64, color: AppColors.textSecondary),
            const SizedBox(height: 16),
            const Text('No active alerts',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Text(
              'Tap + to create a price or surge alert',
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => _showCreateAlert(context),
              icon: const Icon(Icons.add),
              label: const Text('Create Alert'),
            ),
          ],
        ),
      ),
    );
  }

  void _showCreateAlert(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.darkSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => const _CreateAlertSheet(),
    );
  }
}

class _CreateAlertSheet extends StatefulWidget {
  const _CreateAlertSheet();

  @override
  State<_CreateAlertSheet> createState() => _CreateAlertSheetState();
}

class _CreateAlertSheetState extends State<_CreateAlertSheet> {
  String _alertType = 'price_below';
  double _threshold = 200;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Create Alert',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text('Alert Type', style: TextStyle(fontWeight: FontWeight.w500)),
          const SizedBox(height: 8),
          Row(
            children: [
              _TypeChip(
                label: 'Price Below',
                icon: Icons.arrow_downward,
                active: _alertType == 'price_below',
                onTap: () => setState(() => _alertType = 'price_below'),
              ),
              const SizedBox(width: 10),
              _TypeChip(
                label: 'Surge Ended',
                icon: Icons.local_fire_department,
                active: _alertType == 'surge_ended',
                onTap: () => setState(() => _alertType = 'surge_ended'),
              ),
            ],
          ),
          if (_alertType == 'price_below') ...[
            const SizedBox(height: 16),
            Text('Alert when price drops below ₹${_threshold.toInt()}',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
            Slider(
              value: _threshold,
              min: 50,
              max: 1000,
              divisions: 19,
              activeColor: AppColors.primary,
              onChanged: (v) => setState(() => _threshold = v),
            ),
          ],
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Set Alert'),
            ),
          ),
        ],
      ),
    );
  }
}

class _TypeChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool active;
  final VoidCallback onTap;

  const _TypeChip({
    required this.label,
    required this.icon,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: active ? AppColors.primary.withOpacity(0.15) : AppColors.darkCard,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
              color: active ? AppColors.primary : AppColors.darkBorder),
        ),
        child: Row(children: [
          Icon(icon, size: 16, color: active ? AppColors.primary : AppColors.textSecondary),
          const SizedBox(width: 6),
          Text(label,
              style: TextStyle(
                  color: active ? AppColors.primary : AppColors.textSecondary,
                  fontWeight: FontWeight.w500)),
        ]),
      ),
    );
  }
}
