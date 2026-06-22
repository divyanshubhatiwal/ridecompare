class AppException implements Exception {
  final String message;
  final int? statusCode;
  const AppException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class UnauthorizedException extends AppException {
  const UnauthorizedException([String message = 'Session expired. Please log in again.'])
      : super(message, statusCode: 401);
}

class NotFoundException extends AppException {
  const NotFoundException([String message = 'Resource not found.'])
      : super(message, statusCode: 404);
}

class NetworkException extends AppException {
  const NetworkException([String message = 'No internet connection.'])
      : super(message);
}

class ServerException extends AppException {
  const ServerException([String message = 'Server error. Please try again.'])
      : super(message, statusCode: 500);
}

class ValidationException extends AppException {
  const ValidationException(String message) : super(message, statusCode: 422);
}

class ProviderUnavailableException extends AppException {
  const ProviderUnavailableException(String provider)
      : super('$provider is unavailable right now.');
}

class NoRidesFoundException extends AppException {
  const NoRidesFoundException()
      : super('No rides found for this route. Try adjusting your pickup or destination.');
}
