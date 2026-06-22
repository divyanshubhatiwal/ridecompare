class User {
  final int id;
  final String email;
  final String fullName;
  final String? phoneNumber;
  final String? avatarUrl;
  final bool isVerified;
  final String createdAt;

  const User({
    required this.id,
    required this.email,
    required this.fullName,
    this.phoneNumber,
    this.avatarUrl,
    required this.isVerified,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> j) => User(
        id: j['id'] as int,
        email: j['email'] as String,
        fullName: j['full_name'] as String,
        phoneNumber: j['phone_number'] as String?,
        avatarUrl: j['avatar_url'] as String?,
        isVerified: j['is_verified'] as bool? ?? false,
        createdAt: j['created_at'] as String? ?? '',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'full_name': fullName,
        'phone_number': phoneNumber,
        'avatar_url': avatarUrl,
        'is_verified': isVerified,
        'created_at': createdAt,
      };
}

class AuthTokens {
  final String accessToken;
  final String refreshToken;
  final String tokenType;
  final int expiresIn;

  const AuthTokens({
    required this.accessToken,
    required this.refreshToken,
    required this.tokenType,
    required this.expiresIn,
  });

  factory AuthTokens.fromJson(Map<String, dynamic> j) => AuthTokens(
        accessToken: j['access_token'] as String,
        refreshToken: j['refresh_token'] as String,
        tokenType: j['token_type'] as String? ?? 'bearer',
        expiresIn: j['expires_in'] as int? ?? 3600,
      );
}

class SavedPlace {
  final int id;
  final String label;
  final String address;
  final double latitude;
  final double longitude;
  final String? placeId;
  final String? icon;
  final bool isFavorite;

  const SavedPlace({
    required this.id,
    required this.label,
    required this.address,
    required this.latitude,
    required this.longitude,
    this.placeId,
    this.icon,
    required this.isFavorite,
  });

  factory SavedPlace.fromJson(Map<String, dynamic> j) => SavedPlace(
        id: j['id'] as int,
        label: j['label'] as String,
        address: j['address'] as String,
        latitude: (j['latitude'] as num).toDouble(),
        longitude: (j['longitude'] as num).toDouble(),
        placeId: j['place_id'] as String?,
        icon: j['icon'] as String?,
        isFavorite: j['is_favorite'] as bool? ?? false,
      );
}

class PlaceAutocomplete {
  final String placeId;
  final String description;
  final String mainText;
  final String secondaryText;
  final double? latitude;
  final double? longitude;

  const PlaceAutocomplete({
    required this.placeId,
    required this.description,
    required this.mainText,
    required this.secondaryText,
    this.latitude,
    this.longitude,
  });

  factory PlaceAutocomplete.fromJson(Map<String, dynamic> j) => PlaceAutocomplete(
        placeId: j['place_id'] as String? ?? '',
        description: j['description'] as String? ?? '',
        mainText: j['main_text'] as String? ?? '',
        secondaryText: j['secondary_text'] as String? ?? '',
        latitude: j['latitude'] != null ? (j['latitude'] as num).toDouble() : null,
        longitude: j['longitude'] != null ? (j['longitude'] as num).toDouble() : null,
      );
}

class RideHistoryItem {
  final int id;
  final String pickupAddress;
  final String destinationAddress;
  final String searchedAt;
  final int resultCount;
  final double? cheapestFare;
  final String? cheapestProvider;

  const RideHistoryItem({
    required this.id,
    required this.pickupAddress,
    required this.destinationAddress,
    required this.searchedAt,
    required this.resultCount,
    this.cheapestFare,
    this.cheapestProvider,
  });

  factory RideHistoryItem.fromJson(Map<String, dynamic> j) => RideHistoryItem(
        id: j['id'] as int,
        pickupAddress: j['pickup_address'] as String,
        destinationAddress: j['destination_address'] as String,
        searchedAt: j['searched_at'] as String,
        resultCount: j['result_count'] as int? ?? 0,
        cheapestFare: j['cheapest_fare'] != null ? (j['cheapest_fare'] as num).toDouble() : null,
        cheapestProvider: j['cheapest_provider'] as String?,
      );
}

class UserPreferences {
  final String preferredSort;
  final bool avoidSurge;
  final double maxSurgeMultiplier;
  final List<String> preferredProviders;
  final List<String> preferredRideTypes;
  final bool airportMode;
  final bool notificationsEnabled;
  final bool priceAlertEnabled;
  final bool surgeAlertEnabled;
  final String currency;

  const UserPreferences({
    required this.preferredSort,
    required this.avoidSurge,
    required this.maxSurgeMultiplier,
    required this.preferredProviders,
    required this.preferredRideTypes,
    required this.airportMode,
    required this.notificationsEnabled,
    required this.priceAlertEnabled,
    required this.surgeAlertEnabled,
    required this.currency,
  });

  factory UserPreferences.fromJson(Map<String, dynamic> j) => UserPreferences(
        preferredSort: j['preferred_sort'] as String? ?? 'cheapest',
        avoidSurge: j['avoid_surge'] as bool? ?? false,
        maxSurgeMultiplier: (j['max_surge_multiplier'] as num?)?.toDouble() ?? 2.0,
        preferredProviders: (j['preferred_providers'] as List?)?.cast<String>() ?? [],
        preferredRideTypes: (j['preferred_ride_types'] as List?)?.cast<String>() ?? [],
        airportMode: j['airport_mode'] as bool? ?? false,
        notificationsEnabled: j['notifications_enabled'] as bool? ?? true,
        priceAlertEnabled: j['price_alert_enabled'] as bool? ?? true,
        surgeAlertEnabled: j['surge_alert_enabled'] as bool? ?? true,
        currency: j['currency'] as String? ?? 'INR',
      );

  Map<String, dynamic> toJson() => {
        'preferred_sort': preferredSort,
        'avoid_surge': avoidSurge,
        'max_surge_multiplier': maxSurgeMultiplier,
        'preferred_providers': preferredProviders,
        'preferred_ride_types': preferredRideTypes,
        'airport_mode': airportMode,
        'notifications_enabled': notificationsEnabled,
        'price_alert_enabled': priceAlertEnabled,
        'surge_alert_enabled': surgeAlertEnabled,
        'currency': currency,
      };
}
