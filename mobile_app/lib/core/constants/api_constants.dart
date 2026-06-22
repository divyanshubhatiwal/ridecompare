class ApiConstants {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000',
  );
  static const String apiVersion = '/api/v1';

  // Auth
  static const String register = '$apiVersion/auth/register';
  static const String login = '$apiVersion/auth/login';
  static const String refresh = '$apiVersion/auth/refresh';
  static const String logout = '$apiVersion/auth/logout';

  // Users
  static const String me = '$apiVersion/users/me';

  // Places
  static const String autocomplete = '$apiVersion/places/autocomplete';
  static const String savePlaces = '$apiVersion/places/save';
  static const String savedPlaces = '$apiVersion/places/saved';

  // Compare
  static const String compareRides = '$apiVersion/compare/rides';
  static const String rideHistory = '$apiVersion/compare/history';

  // Alerts
  static const String createAlert = '$apiVersion/alerts/price';
  static const String alerts = '$apiVersion/alerts';

  // Preferences
  static const String preferences = '$apiVersion/preferences';

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 10);
  static const Duration receiveTimeout = Duration(seconds: 15);
}

class AppConstants {
  static const String googleMapsApiKey = String.fromEnvironment(
    'GOOGLE_MAPS_API_KEY',
    defaultValue: '',
  );
  static const String appName = 'RideCompare';
  static const String tokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
}
