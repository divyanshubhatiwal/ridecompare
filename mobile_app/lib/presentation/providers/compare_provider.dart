import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/remote/ride_remote_ds.dart';
import '../../data/models/ride_estimate.dart';
import '../../data/models/user.dart';

// The route the user selected on the map
final selectedRouteProvider = StateProvider<RouteData?>((ref) => null);

// The active compare results
final compareResultsProvider =
    AsyncNotifierProvider<CompareNotifier, CompareResponse?>(CompareNotifier.new);

class CompareNotifier extends AsyncNotifier<CompareResponse?> {
  @override
  Future<CompareResponse?> build() async => null;

  Future<void> compare(RouteData route) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final ds = ref.read(rideRemoteDsProvider);
      return await ds.compareRides(route);
    });
  }

  void reset() => state = const AsyncData(null);
}

// History
final rideHistoryProvider =
    AsyncNotifierProvider<RideHistoryNotifier, List<RideHistoryItem>>(RideHistoryNotifier.new);

class RideHistoryNotifier extends AsyncNotifier<List<RideHistoryItem>> {
  @override
  Future<List<RideHistoryItem>> build() async {
    final ds = ref.read(rideRemoteDsProvider);
    return ds.getHistory();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final ds = ref.read(rideRemoteDsProvider);
      return ds.getHistory();
    });
  }
}

// Saved places
final savedPlacesProvider =
    AsyncNotifierProvider<SavedPlacesNotifier, List<SavedPlace>>(SavedPlacesNotifier.new);

class SavedPlacesNotifier extends AsyncNotifier<List<SavedPlace>> {
  @override
  Future<List<SavedPlace>> build() async {
    final ds = ref.read(rideRemoteDsProvider);
    return ds.getSavedPlaces();
  }
}

// Preferences
final preferencesProvider =
    AsyncNotifierProvider<PreferencesNotifier, UserPreferences?>(PreferencesNotifier.new);

class PreferencesNotifier extends AsyncNotifier<UserPreferences?> {
  @override
  Future<UserPreferences?> build() async {
    try {
      final ds = ref.read(rideRemoteDsProvider);
      return await ds.getPreferences();
    } catch (_) {
      return null;
    }
  }
}

// Sort mode state
final sortModeProvider = StateProvider<String>((ref) {
  final prefs = ref.watch(preferencesProvider).valueOrNull;
  return prefs?.preferredSort ?? 'cheapest';
});

// Sorted + filtered results
final sortedResultsProvider = Provider<List<RideEstimate>>((ref) {
  final results = ref.watch(compareResultsProvider).valueOrNull?.results ?? [];
  final sortMode = ref.watch(sortModeProvider);
  final sorted = List<RideEstimate>.from(results);

  switch (sortMode) {
    case 'fastest':
      sorted.sort((a, b) => a.etaMinutes.compareTo(b.etaMinutes));
    case 'cheapest':
    default:
      sorted.sort((a, b) => a.fareMin.compareTo(b.fareMin));
  }
  return sorted;
});
