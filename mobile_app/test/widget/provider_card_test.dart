import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ridecompare/presentation/widgets/cards/provider_card.dart';
import 'package:ridecompare/data/models/ride_estimate.dart';
import 'package:ridecompare/core/theme/app_theme.dart';

const _cheapestEstimate = RideEstimate(
  provider: 'ola',
  providerDisplayName: 'Ola',
  category: 'mini',
  categoryDisplay: 'Ola Mini',
  etaMinutes: 8,
  fareMin: 198,
  fareMax: 220,
  fareDisplay: '₹198–₹220',
  currency: 'INR',
  surgeMultiplier: 1.0,
  isSurging: false,
  deeplinkUrl: 'olacabs://app',
  available: true,
  comfortLevel: 'economy',
  vehicleType: 'mini',
  logoUrl: '',
  badges: ['cheapest'],
);

Widget _wrap(Widget child) => MaterialApp(
      theme: AppTheme.dark(),
      home: Scaffold(body: child),
    );

void main() {
  testWidgets('ProviderCard shows fare and ETA', (tester) async {
    await tester.pumpWidget(_wrap(ProviderCard(estimate: _cheapestEstimate)));
    expect(find.text('₹198–₹220'), findsOneWidget);
    expect(find.text('8 mins'), findsOneWidget);
    expect(find.text('Ola Mini'), findsOneWidget);
  });

  testWidgets('ProviderCard shows CHEAPEST badge', (tester) async {
    await tester.pumpWidget(_wrap(ProviderCard(estimate: _cheapestEstimate)));
    expect(find.text('CHEAPEST'), findsOneWidget);
  });

  testWidgets('ProviderCard shows BOOK button', (tester) async {
    await tester.pumpWidget(_wrap(ProviderCard(estimate: _cheapestEstimate)));
    expect(find.text('BOOK'), findsOneWidget);
  });

  testWidgets('ProviderCard shows surge indicator', (tester) async {
    const surgeEstimate = RideEstimate(
      provider: 'uber',
      providerDisplayName: 'Uber',
      category: 'UberAuto',
      categoryDisplay: 'Uber Auto',
      etaMinutes: 6,
      fareMin: 215,
      fareMax: 240,
      fareDisplay: '₹215–₹240',
      currency: 'INR',
      surgeMultiplier: 1.2,
      isSurging: true,
      deeplinkUrl: 'uber://',
      available: true,
      comfortLevel: 'economy',
      vehicleType: 'auto',
      logoUrl: '',
      badges: [],
    );
    await tester.pumpWidget(_wrap(ProviderCard(estimate: surgeEstimate)));
    expect(find.text('1.2x'), findsOneWidget);
  });
}
