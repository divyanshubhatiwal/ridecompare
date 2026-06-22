import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/errors/app_exceptions.dart';
import '../../../core/network/dio_client.dart';
import '../../models/ride_estimate.dart';
import '../../models/user.dart';

final rideRemoteDsProvider = Provider<RideRemoteDataSource>(
  (ref) => RideRemoteDataSource(ref.read(dioClientProvider).dio),
);

class RideRemoteDataSource {
  final Dio _dio;
  RideRemoteDataSource(this._dio);

  Future<CompareResponse> compareRides(RouteData route) async {
    try {
      final resp = await _dio.post(ApiConstants.compareRides, data: {
        'pickup_lat': route.pickupLat,
        'pickup_lng': route.pickupLng,
        'pickup_address': route.pickupAddress,
        'destination_lat': route.destinationLat,
        'destination_lng': route.destinationLng,
        'destination_address': route.destinationAddress,
      });
      return CompareResponse.fromJson(resp.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<RideHistoryItem>> getHistory({int limit = 20, int offset = 0}) async {
    try {
      final resp = await _dio.get(
        ApiConstants.rideHistory,
        queryParameters: {'limit': limit, 'offset': offset},
      );
      return (resp.data as List).map((e) => RideHistoryItem.fromJson(e)).toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<PlaceAutocomplete>> autocomplete(String query, {String sessionToken = ''}) async {
    try {
      final resp = await _dio.get(
        ApiConstants.autocomplete,
        queryParameters: {'query': query, 'session_token': sessionToken},
      );
      return (resp.data as List).map((e) => PlaceAutocomplete.fromJson(e)).toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<SavedPlace>> getSavedPlaces() async {
    try {
      final resp = await _dio.get(ApiConstants.savedPlaces);
      return (resp.data as List).map((e) => SavedPlace.fromJson(e)).toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<UserPreferences> getPreferences() async {
    try {
      final resp = await _dio.get(ApiConstants.preferences);
      return UserPreferences.fromJson(resp.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  AppException _handleError(DioException e) {
    if (e.error is AppException) return e.error as AppException;
    final statusCode = e.response?.statusCode;
    final detail = e.response?.data?['detail'] ?? 'Something went wrong';
    return AppException(detail.toString(), statusCode: statusCode);
  }
}
