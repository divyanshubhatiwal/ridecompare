import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../presentation/screens/onboarding/splash_screen.dart';
import '../../presentation/screens/onboarding/onboarding_screen.dart';
import '../../presentation/screens/auth/login_screen.dart';
import '../../presentation/screens/auth/register_screen.dart';
import '../../presentation/screens/home/home_screen.dart';
import '../../presentation/screens/compare/compare_screen.dart';
import '../../presentation/screens/compare/provider_detail_screen.dart';
import '../../presentation/screens/history/history_screen.dart';
import '../../presentation/screens/profile/profile_screen.dart';
import '../../presentation/screens/alerts/alerts_screen.dart';
import '../../presentation/screens/places/saved_places_screen.dart';
import '../../presentation/screens/profile/preferences_screen.dart';
import '../../presentation/screens/home/map_route_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    redirect: _globalRedirect,
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
          GoRoute(path: '/history', builder: (_, __) => const HistoryScreen()),
          GoRoute(path: '/alerts', builder: (_, __) => const AlertsScreen()),
          GoRoute(path: '/places', builder: (_, __) => const SavedPlacesScreen()),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
        ],
      ),
      GoRoute(path: '/map-route', builder: (_, __) => const MapRouteScreen()),
      GoRoute(
        path: '/compare',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return CompareScreen(routeData: extra ?? {});
        },
      ),
      GoRoute(
        path: '/provider-detail',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return ProviderDetailScreen(data: extra ?? {});
        },
      ),
      GoRoute(path: '/preferences', builder: (_, __) => const PreferencesScreen()),
    ],
  );
});

Future<String?> _globalRedirect(BuildContext context, GoRouterState state) async {
  const storage = FlutterSecureStorage();
  final token = await storage.read(key: 'access_token');
  final isAuth = token != null;
  final path = state.matchedLocation;

  final publicRoutes = {'/splash', '/onboarding', '/login', '/register'};
  if (!isAuth && !publicRoutes.contains(path)) return '/login';
  if (isAuth && (path == '/login' || path == '/register')) return '/home';
  return null;
}

class MainShell extends StatefulWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _selectedIndex = 0;

  static const _routes = ['/home', '/history', '/alerts', '/places', '/profile'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (i) {
          setState(() => _selectedIndex = i);
          context.go(_routes[i]);
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.history_outlined), selectedIcon: Icon(Icons.history), label: 'History'),
          NavigationDestination(icon: Icon(Icons.notifications_outlined), selectedIcon: Icon(Icons.notifications), label: 'Alerts'),
          NavigationDestination(icon: Icon(Icons.place_outlined), selectedIcon: Icon(Icons.place), label: 'Places'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
