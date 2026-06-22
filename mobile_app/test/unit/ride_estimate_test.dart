import 'package:flutter_test/flutter_test.dart';
import 'package:ridecompare/data/models/ride_estimate.dart';

void main() {
  group('RideEstimate', () {
    test('fromJson parses correctly', () {
      final json = {
        'provider': 'uber',
        'provider_display_name': 'Uber',
        'category': 'UberGo',
        'category_display': 'Uber Go',
        'eta_minutes': 7,
        'fare_min': 150.0,
        'fare_max': 180.0,
        'fare_display': '₹150–₹180',
        'currency': 'INR',
        'surge_multiplier': 1.0,
        'is_surging': false,
        'deeplink_url': 'uber://?action=setPickup',
        'available': true,
        'comfort_level': 'economy',
        'vehicle_type': 'mini',
        'logo_url': 'https://cdn.example.com/uber.png',
        'badges': ['cheapest'],
      };

      final estimate = RideEstimate.fromJson(json);
      expect(estimate.provider, 'uber');
      expect(estimate.fareMin, 150.0);
      expect(estimate.etaMinutes, 7);
      expect(estimate.badges, contains('cheapest'));
      expect(estimate.isSurging, false);
    });

    test('surge estimate detected correctly', () {
      final json = {
        'provider': 'ola',
        'provider_display_name': 'Ola',
        'category': 'mini',
        'category_display': 'Ola Mini',
        'eta_minutes': 8,
        'fare_min': 198.0,
        'fare_max': 220.0,
        'fare_display': '₹198–₹220',
        'currency': 'INR',
        'surge_multiplier': 1.3,
        'is_surging': true,
        'deeplink_url': 'olacabs://app',
        'available': true,
        'comfort_level': 'economy',
        'vehicle_type': 'mini',
        'logo_url': '',
        'badges': [],
      };

      final estimate = RideEstimate.fromJson(json);
      expect(estimate.isSurging, true);
      expect(estimate.surgeMultiplier, 1.3);
    });

    test('toJson and fromJson roundtrip', () {
      const e = RideEstimate(
        provider: 'rapido',
        providerDisplayName: 'Rapido',
        category: 'bike',
        categoryDisplay: 'Rapido Bike',
        etaMinutes: 4,
        fareMin: 110,
        fareMax: 120,
        fareDisplay: '₹110–₹120',
        currency: 'INR',
        surgeMultiplier: 1.0,
        isSurging: false,
        deeplinkUrl: 'in.rapido.passenger://book',
        available: true,
        comfortLevel: 'economy',
        vehicleType: 'bike',
        logoUrl: '',
        badges: ['fastest'],
      );

      final json = e.toJson();
      final restored = RideEstimate.fromJson(json);
      expect(restored.provider, e.provider);
      expect(restored.fareMin, e.fareMin);
      expect(restored.badges, e.badges);
    });
  });
}
