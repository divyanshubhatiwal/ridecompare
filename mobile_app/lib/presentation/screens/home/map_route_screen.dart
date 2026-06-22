import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/ride_estimate.dart';
import '../../providers/compare_provider.dart';

class MapRouteScreen extends ConsumerStatefulWidget {
  const MapRouteScreen({super.key});

  @override
  ConsumerState<MapRouteScreen> createState() => _MapRouteScreenState();
}

class _MapRouteScreenState extends ConsumerState<MapRouteScreen> {
  GoogleMapController? _mapController;
  LatLng? _pickup;
  LatLng? _destination;
  String _pickupAddress = '';
  String _destinationAddress = '';
  bool _isPickupMode = true;

  final Set<Marker> _markers = {};
  final Set<Polyline> _polylines = {};

  static const _initialPosition = CameraPosition(
    target: LatLng(12.9716, 77.5946), // Bangalore
    zoom: 13,
  );

  void _onMapTap(LatLng position) {
    setState(() {
      if (_isPickupMode) {
        _pickup = position;
        _pickupAddress = '${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}';
        _markers.removeWhere((m) => m.markerId.value == 'pickup');
        _markers.add(Marker(
          markerId: const MarkerId('pickup'),
          position: position,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
          infoWindow: const InfoWindow(title: 'Pickup'),
        ));
      } else {
        _destination = position;
        _destinationAddress = '${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}';
        _markers.removeWhere((m) => m.markerId.value == 'destination');
        _markers.add(Marker(
          markerId: const MarkerId('destination'),
          position: position,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
          infoWindow: const InfoWindow(title: 'Destination'),
        ));
      }

      if (_pickup != null && _destination != null) {
        _polylines.clear();
        _polylines.add(Polyline(
          polylineId: const PolylineId('route'),
          points: [_pickup!, _destination!],
          color: AppColors.primary,
          width: 4,
        ));
      }
    });
  }

  void _findRides() {
    if (_pickup == null || _destination == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select both pickup and destination')),
      );
      return;
    }

    final route = RouteData(
      pickupLat: _pickup!.latitude,
      pickupLng: _pickup!.longitude,
      pickupAddress: _pickupAddress,
      destinationLat: _destination!.latitude,
      destinationLng: _destination!.longitude,
      destinationAddress: _destinationAddress,
    );

    ref.read(selectedRouteProvider.notifier).state = route;
    context.push('/compare', extra: route.toJson());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Route'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new),
          onPressed: () => context.pop(),
        ),
      ),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: _initialPosition,
            onMapCreated: (c) => _mapController = c,
            onTap: _onMapTap,
            markers: _markers,
            polylines: _polylines,
            myLocationEnabled: true,
            myLocationButtonEnabled: true,
            zoomControlsEnabled: false,
            mapType: MapType.normal,
          ),
          // Mode selector
          Positioned(
            top: 16,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: AppColors.darkCard,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.darkBorder),
              ),
              child: Row(
                children: [
                  _ModeTab(
                    label: 'Set Pickup',
                    icon: Icons.my_location_rounded,
                    active: _isPickupMode,
                    color: AppColors.primary,
                    onTap: () => setState(() => _isPickupMode = true),
                  ),
                  _ModeTab(
                    label: 'Set Destination',
                    icon: Icons.location_on_rounded,
                    active: !_isPickupMode,
                    color: AppColors.surge,
                    onTap: () => setState(() => _isPickupMode = false),
                  ),
                ],
              ),
            ),
          ),
          // Bottom panel
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.darkSurface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                border: Border.all(color: AppColors.darkBorder),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _LocationSummary(
                    pickup: _pickupAddress.isEmpty ? 'Tap map to set pickup' : _pickupAddress,
                    destination: _destinationAddress.isEmpty ? 'Tap map to set destination' : _destinationAddress,
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: (_pickup != null && _destination != null) ? _findRides : null,
                      icon: const Icon(Icons.search_rounded),
                      label: const Text('Find Rides'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ModeTab extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool active;
  final Color color;
  final VoidCallback onTap;

  const _ModeTab({
    required this.label,
    required this.icon,
    required this.active,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: active ? color.withOpacity(0.15) : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: active ? color : AppColors.textSecondary, size: 18),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  color: active ? color : AppColors.textSecondary,
                  fontWeight: FontWeight.w500,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LocationSummary extends StatelessWidget {
  final String pickup;
  final String destination;

  const _LocationSummary({required this.pickup, required this.destination});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(children: [
          const Icon(Icons.circle, color: AppColors.primary, size: 10),
          const SizedBox(width: 12),
          Expanded(child: Text(pickup, maxLines: 1, overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 14))),
        ]),
        const SizedBox(height: 4),
        Row(children: [
          const Icon(Icons.location_on, color: AppColors.surge, size: 14),
          const SizedBox(width: 10),
          Expanded(child: Text(destination, maxLines: 1, overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 14))),
        ]),
      ],
    );
  }
}
