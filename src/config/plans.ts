export interface CreditTier {
  credits: number;
  monthlyPrice: number;
  annualPrice: number;
  annualMonthly: number;
}

export interface PlanTier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number | null;
  badge?: string;
  highlight: boolean;
  cta: string;
  ctaVariant: 'primary' | 'outline';
  ctaAction: 'auth' | 'checkout' | 'contact';
  featuresIntro?: string;
  features: string[];
  hasCreditSelector: boolean;
  hasAnnualToggle: boolean;
}

export const CREDIT_TIERS_PRO: CreditTier[] = [
  { credits: 100, monthlyPrice: 25, annualPrice: 250, annualMonthly: 21 },
  { credits: 200, monthlyPrice: 50, annualPrice: 500, annualMonthly: 42 },
  { credits: 400, monthlyPrice: 100, annualPrice: 1000, annualMonthly: 84 },
  { credits: 800, monthlyPrice: 200, annualPrice: 2000, annualMonthly: 167 },
  { credits: 1200, monthlyPrice: 294, annualPrice: 2940, annualMonthly: 245 },
  { credits: 2000, monthlyPrice: 480, annualPrice: 4800, annualMonthly: 400 },
  { credits: 3000, monthlyPrice: 705, annualPrice: 7050, annualMonthly: 588 },
  { credits: 4000, monthlyPrice: 920, annualPrice: 9200, annualMonthly: 767 },
  { credits: 5000, monthlyPrice: 1125, annualPrice: 11250, annualMonthly: 938 },
  { credits: 7500, monthlyPrice: 1688, annualPrice: 16880, annualMonthly: 1407 },
  { credits: 10000, monthlyPrice: 2250, annualPrice: 22500, annualMonthly: 1875 },
];

export const CREDIT_TIERS_BUSINESS: CreditTier[] = [
  { credits: 100, monthlyPrice: 50, annualPrice: 500, annualMonthly: 42 },
  { credits: 200, monthlyPrice: 100, annualPrice: 1000, annualMonthly: 84 },
  { credits: 400, monthlyPrice: 200, annualPrice: 2000, annualMonthly: 167 },
  { credits: 800, monthlyPrice: 400, annualPrice: 4000, annualMonthly: 334 },
  { credits: 1200, monthlyPrice: 588, annualPrice: 5880, annualMonthly: 490 },
  { credits: 2000, monthlyPrice: 960, annualPrice: 9600, annualMonthly: 800 },
  { credits: 3000, monthlyPrice: 1410, annualPrice: 14100, annualMonthly: 1175 },
  { credits: 4000, monthlyPrice: 1840, annualPrice: 18400, annualMonthly: 1534 },
  { credits: 5000, monthlyPrice: 2250, annualPrice: 22500, annualMonthly: 1875 },
  { credits: 7500, monthlyPrice: 3300, annualPrice: 33000, annualMonthly: 2750 },
  { credits: 10000, monthlyPrice: 4300, annualPrice: 43000, annualMonthly: 3584 },
];

export const PLANS: PlanTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Découvrez Blink gratuitement et construisez vos premiers prototypes.',
    monthlyPrice: 0,
    highlight: false,
    cta: 'Get Started',
    ctaVariant: 'outline',
    ctaAction: 'auth',
    hasCreditSelector: false,
    hasAnnualToggle: false,
    features: [
      '5 crédits journaliers (max 30/mois)',
      'Projets privés',
      'Workspace collaboratif illimité',
      '5 domaines blink.app',
      'Accès à Blink Cloud',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Pour les équipes rapides qui livrent en temps réel.',
    monthlyPrice: 25,
    badge: 'Popular',
    highlight: true,
    cta: 'Upgrade',
    ctaVariant: 'primary',
    ctaAction: 'checkout',
    hasCreditSelector: true,
    hasAnnualToggle: true,
    featuresIntro: 'Tout le plan Free, plus :',
    features: [
      'Crédits mensuels selon votre forfait',
      '5 crédits journaliers (max 150/mois)',
      'Cloud + AI à l\'usage',
      'Report de crédits',
      'Recharges ponctuelles',
      'Domaines blink.app illimités',
      'Domaines personnalisés',
      'Supprimer le badge Blink',
      'Rôles et autorisations',
      'Mode Code',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Contrôles avancés et fonctionnalités puissantes pour les équipes en croissance.',
    monthlyPrice: 50,
    highlight: false,
    cta: 'Upgrade',
    ctaVariant: 'outline',
    ctaAction: 'checkout',
    hasCreditSelector: true,
    hasAnnualToggle: true,
    featuresIntro: 'Tout le plan Pro, plus :',
    features: [
      'Crédits mensuels selon votre forfait',
      'SSO',
      'Projets restreints au sein des espaces de travail',
      'Refuser la formation aux données',
      'Modèles de conception réutilisables',
      'Contrôle d\'accès basé sur les rôles',
      'Centre de sécurité',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Pour les grandes organisations nécessitant flexibilité, scalabilité et gouvernance.',
    monthlyPrice: null,
    highlight: false,
    cta: 'Book a Demo',
    ctaVariant: 'outline',
    ctaAction: 'contact',
    hasCreditSelector: false,
    hasAnnualToggle: false,
    featuresIntro: 'Tout le plan Business, plus :',
    features: [
      'Support dédié',
      'Services d\'onboarding',
      'Design systems',
      'SCIM',
      'Support pour connecteurs personnalisés',
      'Contrôles de publication',
      'Contrôles de partage',
      'Logs d\'audit (bientôt !)',
    ],
  },
];

export const FAQ_ITEMS = [
  {
    question: 'Qu\'est-ce que Blink et comment ça marche ?',
    answer: 'Blink est un constructeur d\'applications alimenté par l\'IA qui transforme vos idées en vraies applications web full-stack. Décrivez simplement ce que vous voulez construire et Blink génère du code production-ready, le déploie et vous donne une URL en direct — le tout en quelques secondes.',
  },
  {
    question: 'Que comprend le plan gratuit ?',
    answer: 'Le plan gratuit inclut 5 crédits journaliers (jusqu\'à 30 par mois), des projets privés, un nombre illimité de collaborateurs, 5 domaines blink.app et l\'accès à Blink Cloud. C\'est parfait pour découvrir la plateforme et construire des prototypes.',
  },
  {
    question: 'Qu\'est-ce qu\'un crédit ?',
    answer: 'Un crédit correspond à une interaction avec l\'IA — une génération, une itération ou une modification de code. Le coût varie selon la complexité du message. Les crédits se rechargent chaque mois pour les forfaits payants, et les crédits journaliers sont renouvelés chaque jour.',
  },
  {
    question: 'Quelles sont les formules payantes disponibles ?',
    answer: 'Nous proposons des plans Pro (à partir de 25$/mois pour 100 crédits) et Business (à partir de 50$/mois pour 100 crédits), chacun avec 11 paliers de crédits allant de 100 à 10 000 crédits/mois. La facturation annuelle offre un tarif mensuel réduit.',
  },
  {
    question: 'Que se passe-t-il lors d\'un upgrade ?',
    answer: 'Lorsque vous passez à un forfait supérieur (ex : de 100 à 200 crédits), votre solde total est mis à jour au nouveau total. Vous ne recevez pas 200 crédits supplémentaires — si vous aviez 100 crédits, le passage à 200 vous en donne 100 de plus.',
  },
  {
    question: 'Quelles technologies Blink supporte-t-il ?',
    answer: 'Blink génère des applications React production-ready avec TypeScript, Tailwind CSS et Vite. Il supporte aussi les fonctionnalités backend via Blink Cloud, incluant bases de données, authentification, fonctions edge et stockage de fichiers.',
  },
  {
    question: 'Qui possède les projets et le code ?',
    answer: 'Vous. Tout le code généré par Blink est 100% le vôtre. Vous pouvez l\'exporter en ZIP (plan Pro et supérieur), l\'héberger n\'importe où et le modifier librement.',
  },
  {
    question: 'Comment fonctionne la tarification Cloud + AI ?',
    answer: 'L\'utilisation Cloud + AI est facturée selon la consommation réelle : opérations de base de données, invocations de fonctions edge, stockage de fichiers et appels aux modèles AI. Chaque plan inclut un usage gratuit de Cloud + AI.',
  },
  {
    question: 'Proposez-vous une réduction étudiante ?',
    answer: 'Oui ! Les étudiants bénéficient de jusqu\'à 50% de réduction sur le plan Pro. Vérifiez votre statut étudiant pour réclamer votre réduction.',
  },
];
