import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/constants/api_constants.dart';
import '../../data/datasources/remote/auth_remote_ds.dart';
import '../../data/models/user.dart';
// ignore_for_file: unused_import

// Current authenticated user
final currentUserProvider = StateProvider<User?>((ref) => null);

// Auth state notifier
final authNotifierProvider = AsyncNotifierProvider<AuthNotifier, User?>(AuthNotifier.new);

class AuthNotifier extends AsyncNotifier<User?> {
  static const _storage = FlutterSecureStorage();

  @override
  Future<User?> build() async {
    final token = await _storage.read(key: AppConstants.tokenKey);
    if (token == null) return null;
    try {
      final ds = ref.read(authRemoteDsProvider);
      return await ds.getMe();
    } catch (_) {
      return null;
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final ds = ref.read(authRemoteDsProvider);
      final tokens = await ds.login(email: email, password: password);
      await _storeTokens(tokens);
      return await ds.getMe();
    });
  }

  Future<void> register(String email, String fullName, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final ds = ref.read(authRemoteDsProvider);
      final tokens = await ds.register(email: email, fullName: fullName, password: password);
      await _storeTokens(tokens);
      return await ds.getMe();
    });
  }

  Future<void> logout() async {
    final refreshToken = await _storage.read(key: AppConstants.refreshTokenKey);
    if (refreshToken != null) {
      final ds = ref.read(authRemoteDsProvider);
      await ds.logout(refreshToken);
    }
    await _storage.deleteAll();
    state = const AsyncData(null);
  }

  Future<void> _storeTokens(AuthTokens tokens) async {
    await _storage.write(key: AppConstants.tokenKey, value: tokens.accessToken);
    await _storage.write(key: AppConstants.refreshTokenKey, value: tokens.refreshToken);
  }
}

final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authNotifierProvider).valueOrNull != null;
});
