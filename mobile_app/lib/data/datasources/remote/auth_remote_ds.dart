import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/errors/app_exceptions.dart';
import '../../../core/network/dio_client.dart';
import '../../models/user.dart';

final authRemoteDsProvider = Provider<AuthRemoteDataSource>(
  (ref) => AuthRemoteDataSource(ref.read(dioClientProvider).dio),
);

class AuthRemoteDataSource {
  final Dio _dio;
  AuthRemoteDataSource(this._dio);

  Future<AuthTokens> register({
    required String email,
    required String fullName,
    required String password,
  }) async {
    try {
      final resp = await _dio.post(ApiConstants.register, data: {
        'email': email,
        'full_name': fullName,
        'password': password,
      });
      return AuthTokens.fromJson(resp.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<AuthTokens> login({required String email, required String password}) async {
    try {
      final resp = await _dio.post(ApiConstants.login, data: {
        'email': email,
        'password': password,
      });
      return AuthTokens.fromJson(resp.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> logout(String refreshToken) async {
    try {
      await _dio.post(ApiConstants.logout, data: {'refresh_token': refreshToken});
    } catch (_) {}
  }

  Future<User> getMe() async {
    try {
      final resp = await _dio.get(ApiConstants.me);
      return User.fromJson(resp.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  AppException _handleError(DioException e) {
    if (e.error is AppException) return e.error as AppException;
    final statusCode = e.response?.statusCode;
    final detail = e.response?.data?['detail'] ?? 'Something went wrong';
    if (statusCode == 401) return UnauthorizedException(detail.toString());
    if (statusCode == 400) return ValidationException(detail.toString());
    return AppException(detail.toString(), statusCode: statusCode);
  }
}
