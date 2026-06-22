import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../constants/api_constants.dart';
import '../errors/app_exceptions.dart';

final dioClientProvider = Provider<DioClient>((ref) => DioClient());

class DioClient {
  late final Dio _dio;
  final _storage = const FlutterSecureStorage();

  DioClient() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: ApiConstants.connectTimeout,
        receiveTimeout: ApiConstants.receiveTimeout,
        headers: {'Content-Type': 'application/json'},
      ),
    );
    _dio.interceptors.addAll([
      _AuthInterceptor(_storage, _dio),
      LogInterceptor(requestBody: true, responseBody: true),
    ]);
  }

  Dio get dio => _dio;
}

class _AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;
  final Dio _dio;

  _AuthInterceptor(this._storage, this._dio);

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.read(key: AppConstants.tokenKey);
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      final refreshed = await _tryRefresh();
      if (refreshed) {
        final opts = err.requestOptions;
        final token = await _storage.read(key: AppConstants.tokenKey);
        opts.headers['Authorization'] = 'Bearer $token';
        try {
          final response = await _dio.fetch(opts);
          handler.resolve(response);
          return;
        } catch (_) {}
      }
      handler.reject(DioException(
        requestOptions: err.requestOptions,
        error: const UnauthorizedException(),
        type: DioExceptionType.badResponse,
      ));
      return;
    }
    handler.next(_mapError(err));
  }

  Future<bool> _tryRefresh() async {
    try {
      final refreshToken = await _storage.read(key: AppConstants.refreshTokenKey);
      if (refreshToken == null) return false;

      final resp = await _dio.post(
        ApiConstants.refresh,
        data: {'refresh_token': refreshToken},
        options: Options(headers: {}),
      );
      await _storage.write(key: AppConstants.tokenKey, value: resp.data['access_token']);
      await _storage.write(key: AppConstants.refreshTokenKey, value: resp.data['refresh_token']);
      return true;
    } catch (_) {
      await _storage.deleteAll();
      return false;
    }
  }

  DioException _mapError(DioException err) {
    if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.connectionError) {
      return DioException(
        requestOptions: err.requestOptions,
        error: const NetworkException(),
        type: err.type,
      );
    }
    final statusCode = err.response?.statusCode;
    if (statusCode == 404) {
      return DioException(
        requestOptions: err.requestOptions,
        error: const NotFoundException(),
        type: err.type,
      );
    }
    if (statusCode != null && statusCode >= 500) {
      return DioException(
        requestOptions: err.requestOptions,
        error: const ServerException(),
        type: err.type,
      );
    }
    return err;
  }
}
