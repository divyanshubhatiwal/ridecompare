class RideEstimate {
  final String provider;
  final String providerDisplayName;
  final String category;
  final String categoryDisplay;
  final int etaMinutes;
  final double fareMin;
  final double fareMax;
  final String fareDisplay;
  final String currency;
  final double surgeMultiplier;
  final bool isSurging;
  final String deeplinkUrl;
  final bool available;
  final String comfortLevel;
  final String vehicleType;
  final String logoUrl;
  final List<String> badges;

  const RideEstimate({
    required this.provider,
    required this.providerDisplayName,
    required this.category,
    required this.categoryDisplay,
    required this.etaMinutes,
    required this.fareMin,
    required this.fareMax,
    required this.fareDisplay,
    required this.currency,
    required this.surgeMultiplier,
    required this.isSurging,
    required this.deeplinkUrl,
    required this.available,
    required this.comfortLevel,
    required this.vehicleType,
    required this.logoUrl,
    this.badges = const [],
  });

  factory RideEstimate.fromJson(Map<String, dynamic> j) => RideEstimate(
        provider: j['provider'] as String,
        providerDisplayName: j['provider_display_name'] as String,
        category: j['category'] as String,
        categoryDisplay: j['category_display'] as String,
        etaMinutes: j['eta_minutes'] as int,
        fareMin: (j['fare_min'] as num).toDouble(),
        fareMax: (j['fare_max'] as num).toDouble(),
        fareDisplay: j['fare_display'] as String,
        currency: j['currency'] as String? ?? 'INR',
        surgeMultiplier: (j['surge_multiplier'] as num).toDouble(),
        isSurging: j['is_surging'] as bool,
        deeplinkUrl: j['deeplink_url'] as String,
        available: j['available'] as bool? ?? true,
        comfortLevel: j['comfort_level'] as String? ?? 'standard',
        vehicleType: j['vehicle_type'] as String? ?? 'car',
        logoUrl: j['logo_url'] as String? ?? '',
        badges: (j['badges'] as List?)?.cast<String>() ?? [],
      );

  Map<String, dynamic> toJson() => {
        'provider': provider,
        'provider_display_name': providerDisplayName,
        'category': category,
        'category_display': categoryDisplay,
        'eta_minutes': etaMinutes,
        'fare_min': fareMin,
        'fare_max': fareMax,
        'fare_display': fareDisplay,
        'currency': currency,
        'surge_multiplier': surgeMultiplier,
        'is_surging': isSurging,
        'deeplink_url': deeplinkUrl,
        'available': available,
        'comfort_level': comfortLevel,
        'vehicle_type': vehicleType,
        'logo_url': logoUrl,
        'badges': badges,
      };
}

class CompareResponse {
  final int searchId;
  final List<RideEstimate> results;
  final String pickupAddress;
  final String destinationAddress;
  final double? distanceKm;
  final int totalProviders;
  final int availableProviders;

  const CompareResponse({
    required this.searchId,
    required this.results,
    required this.pickupAddress,
    required this.destinationAddress,
    this.distanceKm,
    required this.totalProviders,
    required this.availableProviders,
  });

  factory CompareResponse.fromJson(Map<String, dynamic> j) => CompareResponse(
        searchId: j['search_id'] as int,
        results: (j['results'] as List).map((e) => RideEstimate.fromJson(e as Map<String, dynamic>)).toList(),
        pickupAddress: j['pickup_address'] as String,
        destinationAddress: j['destination_address'] as String,
        distanceKm: j['distance_km'] != null ? (j['distance_km'] as num).toDouble() : null,
        totalProviders: j['total_providers'] as int,
        availableProviders: j['available_providers'] as int,
      );
}

class RouteData {
  final double pickupLat;
  final double pickupLng;
  final String pickupAddress;
  final double destinationLat;
  final double destinationLng;
  final String destinationAddress;

  const RouteData({
    required this.pickupLat,
    required this.pickupLng,
    required this.pickupAddress,
    required this.destinationLat,
    required this.destinationLng,
    required this.destinationAddress,
  });

  factory RouteData.fromJson(Map<String, dynamic> j) => RouteData(
        pickupLat: (j['pickup_lat'] as num).toDouble(),
        pickupLng: (j['pickup_lng'] as num).toDouble(),
        pickupAddress: j['pickup_address'] as String,
        destinationLat: (j['destination_lat'] as num).toDouble(),
        destinationLng: (j['destination_lng'] as num).toDouble(),
        destinationAddress: j['destination_address'] as String,
      );

  Map<String, dynamic> toJson() => {
        'pickup_lat': pickupLat,
        'pickup_lng': pickupLng,
        'pickup_address': pickupAddress,
        'destination_lat': destinationLat,
        'destination_lng': destinationLng,
        'destination_address': destinationAddress,
      };
}
