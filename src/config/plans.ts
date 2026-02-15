export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanTier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  badge?: string;
  highlight: boolean;
  cta: string;
  ctaAction: 'auth' | 'checkout' | 'contact';
  featuresIntro?: string;
  features: string[];
}

export const PLANS: PlanTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Pour découvrir et prototyper vos idées.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    highlight: false,
    cta: 'Get Started',
    ctaAction: 'auth',
    features: [
      '5 crédits quotidiens',
      'Max 30 crédits / mois',
      'Projets publics uniquement',
      '1 domaine blink.app',
      'Cloud intégré',
      'Prévisualisation en temps réel',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Pour les créateurs sérieux qui veulent plus.',
    monthlyPrice: 25,
    yearlyPrice: 20,
    badge: 'Populaire',
    highlight: true,
    cta: 'Get Started',
    ctaAction: 'checkout',
    featuresIntro: 'Tout le Free, plus :',
    features: [
      '100 crédits / mois',
      '5 crédits quotidiens (max 150/mois)',
      'Projets illimités',
      'Domaines personnalisés',
      'Export ZIP du code',
      'Retrait du badge Blink',
      'Support prioritaire',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Pour les équipes qui construisent ensemble.',
    monthlyPrice: 50,
    yearlyPrice: 40,
    highlight: false,
    cta: 'Get Started',
    ctaAction: 'checkout',
    featuresIntro: 'Tout le Pro, plus :',
    features: [
      '100 crédits / mois inclus',
      'Publish interne',
      'SSO / SAML',
      'Workspace équipe',
      'Templates de design',
      'Contrôle d\'accès par rôles',
      'Centre de sécurité',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Solutions sur mesure pour les organisations.',
    monthlyPrice: null,
    yearlyPrice: null,
    highlight: false,
    cta: 'Book a Demo',
    ctaAction: 'contact',
    featuresIntro: 'Tout le Business, plus :',
    features: [
      'Support dédié',
      'Onboarding personnalisé',
      'Systèmes de design',
      'SCIM provisioning',
      'Contrôles de publication',
      'Contrat & facturation sur mesure',
    ],
  },
];

export const FAQ_ITEMS = [
  {
    question: 'Qu\'est-ce qu\'un crédit ?',
    answer: 'Un crédit correspond à une interaction avec l\'IA — une demande de génération, une itération, ou une modification de code. Les crédits se réinitialisent chaque mois.',
  },
  {
    question: 'Puis-je changer de plan à tout moment ?',
    answer: 'Oui ! Vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements prennent effet immédiatement et le prorata est appliqué automatiquement.',
  },
  {
    question: 'Comment fonctionne la facturation annuelle ?',
    answer: 'En choisissant la facturation annuelle, vous payez pour 12 mois en une fois et bénéficiez d\'une réduction de 20% par rapport au tarif mensuel.',
  },
  {
    question: 'Puis-je exporter mon code ?',
    answer: 'Oui, à partir du plan Pro. Vous pouvez exporter l\'intégralité de votre projet en fichier ZIP et l\'héberger où vous voulez.',
  },
  {
    question: 'Proposez-vous une réduction pour les étudiants ?',
    answer: 'Oui ! Les étudiants bénéficient de 50% de réduction sur le plan Pro. Contactez-nous avec votre adresse email étudiante pour en profiter.',
  },
  {
    question: 'Que se passe-t-il si je dépasse mes crédits ?',
    answer: 'Vous pouvez acheter des crédits supplémentaires à la demande ou upgrader votre plan. Vos projets restent accessibles même sans crédits restants.',
  },
];
