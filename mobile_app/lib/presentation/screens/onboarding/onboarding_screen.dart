import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/theme/app_theme.dart';

class _OnboardingPage {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;

  const _OnboardingPage({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
  });
}

const _pages = [
  _OnboardingPage(
    title: 'Compare All Providers',
    subtitle: 'See prices from Uber, Ola, Rapido, Namma Yatri and more — side by side.',
    icon: Icons.compare_arrows_rounded,
    color: AppColors.primary,
  ),
  _OnboardingPage(
    title: 'Find the Best Deal',
    subtitle: 'Instantly spot the cheapest and fastest option with smart badges.',
    icon: Icons.local_offer_rounded,
    color: AppColors.accent,
  ),
  _OnboardingPage(
    title: 'Book in One Tap',
    subtitle: 'Tap Book to jump straight into your preferred app — no switching required.',
    icon: Icons.bolt_rounded,
    color: AppColors.warning,
  ),
  _OnboardingPage(
    title: 'Price Alerts',
    subtitle: 'Set fare alerts and we\'ll notify you when prices drop or surge ends.',
    icon: Icons.notifications_active_rounded,
    color: AppColors.bestValue,
  ),
];

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;

  void _next() {
    if (_page < _pages.length - 1) {
      _controller.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      _done();
    }
  }

  Future<void> _done() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_done', true);
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkBg,
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.topRight,
              child: TextButton(
                onPressed: _done,
                child: Text('Skip', style: TextStyle(color: AppColors.textSecondary)),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: _pages.length,
                onPageChanged: (i) => setState(() => _page = i),
                itemBuilder: (context, i) => _PageContent(page: _pages[i]),
              ),
            ),
            _BottomSection(
              page: _page,
              totalPages: _pages.length,
              onNext: _next,
            ),
          ],
        ),
      ),
    );
  }
}

class _PageContent extends StatelessWidget {
  final _OnboardingPage page;
  const _PageContent({required this.page});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: page.color.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(page.icon, color: page.color, size: 60),
          ),
          const SizedBox(height: 40),
          Text(
            page.title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.w700,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            page.subtitle,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 16,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _BottomSection extends StatelessWidget {
  final int page;
  final int totalPages;
  final VoidCallback onNext;

  const _BottomSection({required this.page, required this.totalPages, required this.onNext});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(totalPages, (i) => AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.symmetric(horizontal: 4),
              width: i == page ? 24 : 8,
              height: 8,
              decoration: BoxDecoration(
                color: i == page ? AppColors.primary : AppColors.darkBorder,
                borderRadius: BorderRadius.circular(4),
              ),
            )),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onNext,
              child: Text(page == totalPages - 1 ? 'Get Started' : 'Next'),
            ),
          ),
        ],
      ),
    );
  }
}
