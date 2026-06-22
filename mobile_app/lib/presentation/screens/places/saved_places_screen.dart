import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../providers/compare_provider.dart';
import '../../../data/models/user.dart';

class SavedPlacesScreen extends ConsumerWidget {
  const SavedPlacesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final placesAsync = ref.watch(savedPlacesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Saved Places'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_location_outlined),
            onPressed: () => _showAddPlace(context),
          ),
        ],
      ),
      body: placesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => Center(
          child: Text('Could not load places',
              style: TextStyle(color: AppColors.textSecondary)),
        ),
        data: (places) {
          if (places.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.place_outlined, size: 64, color: AppColors.textSecondary),
                  const SizedBox(height: 16),
                  const Text('No saved places',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text('Save home, work, or favourite spots',
                      style: TextStyle(color: AppColors.textSecondary)),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () => _showAddPlace(context),
                    icon: const Icon(Icons.add),
                    label: const Text('Add Place'),
                  ),
                ],
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: places.length,
            itemBuilder: (_, i) => _PlaceCard(place: places[i]),
          );
        },
      ),
    );
  }

  void _showAddPlace(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkSurface,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      isScrollControlled: true,
      builder: (_) => const _AddPlaceSheet(),
    );
  }
}

class _PlaceCard extends StatelessWidget {
  final SavedPlace place;
  const _PlaceCard({required this.place});

  IconData get _icon {
    switch (place.icon) {
      case 'home': return Icons.home_rounded;
      case 'work': return Icons.work_rounded;
      default: return Icons.star_rounded;
    }
  }

  Color get _color {
    switch (place.icon) {
      case 'home': return AppColors.primary;
      case 'work': return AppColors.accent;
      default: return AppColors.warning;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: _color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(_icon, color: _color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(place.label,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                const SizedBox(height: 2),
                Text(place.address,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              ],
            ),
          ),
          if (place.isFavorite)
            const Icon(Icons.favorite, color: AppColors.surge, size: 16),
        ],
      ),
    );
  }
}

class _AddPlaceSheet extends StatefulWidget {
  const _AddPlaceSheet();

  @override
  State<_AddPlaceSheet> createState() => _AddPlaceSheetState();
}

class _AddPlaceSheetState extends State<_AddPlaceSheet> {
  final _labelCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  String _icon = 'star';

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20, right: 20, top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Add Place', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          TextFormField(controller: _labelCtrl, decoration: const InputDecoration(labelText: 'Label (e.g. Home)')),
          const SizedBox(height: 12),
          TextFormField(controller: _addressCtrl, decoration: const InputDecoration(labelText: 'Address')),
          const SizedBox(height: 16),
          Row(
            children: [
              _IconBtn(icon: Icons.home_rounded, label: 'Home', value: 'home', current: _icon,
                  onTap: () => setState(() => _icon = 'home')),
              const SizedBox(width: 10),
              _IconBtn(icon: Icons.work_rounded, label: 'Work', value: 'work', current: _icon,
                  onTap: () => setState(() => _icon = 'work')),
              const SizedBox(width: 10),
              _IconBtn(icon: Icons.star_rounded, label: 'Other', value: 'star', current: _icon,
                  onTap: () => setState(() => _icon = 'star')),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Save Place'),
            ),
          ),
        ],
      ),
    );
  }
}

class _IconBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final String current;
  final VoidCallback onTap;

  const _IconBtn({required this.icon, required this.label, required this.value,
      required this.current, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final active = current == value;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: active ? AppColors.primary.withOpacity(0.15) : AppColors.darkCard,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: active ? AppColors.primary : AppColors.darkBorder),
        ),
        child: Column(children: [
          Icon(icon, color: active ? AppColors.primary : AppColors.textSecondary, size: 20),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(
              color: active ? AppColors.primary : AppColors.textSecondary, fontSize: 11)),
        ]),
      ),
    );
  }
}
