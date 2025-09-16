<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  
  let currentLang = 'it';
  let isVisible = false;
  let sectionsVisible = {
    hero: false,
    stats: false,
    gallery: false,
    features: false,
    technologies: false,
    testimonials: false,
    pricing: false,
    integration: false,
    cta: false
  };

  const languages = {
    it: {
      flag: '🇮🇹',
      name: 'Italiano',
      content: {
        nav: {
          features: 'Funzionalità',
          pricing: 'Prezzi',
          docs: 'Documentazione',
          login: 'Accedi'
        },
        hero: {
          badge: 'AI-Powered WMS',
          title: 'Il futuro della gestione magazzino',
          subtitle: 'Sistema intelligente per magazzini multicommittente',
          description: 'Ottimizza il tuo magazzino con intelligenza artificiale. Gestione completa per 3PL, e-commerce e industria con tracciabilità real-time e analytics avanzati.',
          cta: 'Inizia Gratis',
          demo: 'Vedi Demo',
          clients: 'Scelto da leader del settore'
        },
        stats: {
          title: 'Numeri che parlano',
          items: [
            { value: '99.8%', label: 'Accuratezza' },
            { value: '45%', label: 'Picking più veloce' },
            { value: '30%', label: 'Riduzione costi' },
            { value: '24/7', label: 'Supporto' }
          ]
        },
        features: {
          subtitle: 'Tutto quello che serve',
          title: 'Gestione magazzino di nuova generazione',
          description: 'Dal ricevimento alla spedizione, ogni processo ottimizzato con AI',
          items: [
            {
              title: 'Multi-Client Architecture',
              description: 'Segregazione completa dei dati. Ogni cliente ha il suo spazio dedicato con dashboard personalizzate.',
              icon: 'users'
            },
            {
              title: 'Smart Picking & Packing',
              description: 'Algoritmi AI per ottimizzare percorsi di picking e ridurre tempi di preparazione ordini.',
              icon: 'brain'
            },
            {
              title: 'Real-time Tracking',
              description: 'Tracciabilità completa di ogni movimento con barcode, RFID e location intelligence.',
              icon: 'location'
            },
            {
              title: 'Analytics & KPI',
              description: 'Dashboard avanzati con metriche operative, previsioni e reportistica automatica.',
              icon: 'chart'
            },
            {
              title: 'API Integration',
              description: 'Integrazione seamless con ERP, marketplace e sistemi di trasporto esistenti.',
              icon: 'api'
            },
            {
              title: 'Mobile-First',
              description: 'App nativa per operatori con scanner integrato e workflow ottimizzati.',
              icon: 'mobile'
            }
          ]
        },
        technologies: {
          title: 'Tecnologie all\'avanguardia',
          description: 'Costruito con le tecnologie più moderne per performance e scalabilità',
          items: [
            { name: 'SvelteKit', description: 'Framework reattivo e performante' },
            { name: 'TypeScript', description: 'Codice tipizzato e sicuro' },
            { name: 'SQLite', description: 'Database veloce e affidabile' },
            { name: 'Tailwind CSS', description: 'Design system moderno' },
            { name: 'REST API', description: 'Integrazione standard' },
            { name: 'WebSocket', description: 'Aggiornamenti real-time' }
          ]
        },
        testimonials: {
          title: 'Cosa dicono i nostri clienti',
          items: [
            {
              name: 'Marco Rossi',
              role: 'Direttore Logistica, LogiCorp',
              content: 'Il WMS Morlappo ha rivoluzionato la nostra operatività. Efficienza aumentata del 40% in soli 3 mesi.',
              avatar: 'M'
            },
            {
              name: 'Sara Bianchi',
              role: 'Operations Manager, E-Commerce Plus',
              content: 'Interfaccia intuitiva e supporto eccellente. Finalmente un WMS che capisce le nostre esigenze.',
              avatar: 'S'
            },
            {
              name: 'Luigi Verdi',
              role: 'CEO, 3PL Solutions',
              content: 'La gestione multicommittente è perfetta. Ogni cliente ha la sua vista dedicata senza compromessi.',
              avatar: 'L'
            }
          ]
        },
        pricing: {
          title: 'Prezzi trasparenti',
          subtitle: 'Scegli il piano perfetto per la tua azienda',
          monthly: 'Mensile',
          yearly: 'Annuale',
          save: 'Risparmia 20%',
          plans: [
            {
              name: 'Starter',
              price: '99',
              period: 'mese',
              description: 'Perfetto per piccole aziende',
              features: [
                '1 Committente',
                '1.000 Prodotti',
                '5.000 Movimenti/mese',
                'Dashboard base',
                'Support email',
                'App mobile'
              ],
              cta: 'Inizia gratis',
              popular: false
            },
            {
              name: 'Professional',
              price: '299',
              period: 'mese',
              description: 'Ideale per aziende in crescita',
              features: [
                '5 Committenti',
                '10.000 Prodotti',
                'Movimenti illimitati',
                'Analytics avanzati',
                'Support prioritario',
                'API access',
                'Integrazioni'
              ],
              cta: 'Inizia prova',
              popular: true
            },
            {
              name: 'Enterprise',
              price: 'Custom',
              period: '',
              description: 'Per grandi organizzazioni',
              features: [
                'Committenti illimitati',
                'Prodotti illimitati',
                'SLA garantiti',
                'Support dedicato',
                'On-premise option',
                'Custom integrations',
                'Training incluso'
              ],
              cta: 'Contattaci',
              popular: false
            }
          ]
        },
        integration: {
          title: 'Integrazione perfetta',
          description: 'Connettiti con i tuoi sistemi esistenti tramite API moderne'
        },
        cta: {
          title: 'Pronto a rivoluzionare il tuo magazzino?',
          description: 'Unisciti a centinaia di aziende che hanno già ottimizzato la loro logistica',
          button: 'Inizia la Prova Gratuita'
        }
      }
    },
    en: {
      flag: '🇬🇧',
      name: 'English',
      content: {
        nav: {
          features: 'Features',
          pricing: 'Pricing',
          docs: 'Documentation',
          login: 'Login'
        },
        hero: {
          badge: 'AI-Powered WMS',
          title: 'The future of warehouse management',
          subtitle: 'Intelligent system for multi-client warehouses',
          description: 'Optimize your warehouse with artificial intelligence. Complete management for 3PL, e-commerce and industry with real-time tracking and advanced analytics.',
          cta: 'Start Free',
          demo: 'Watch Demo',
          clients: 'Trusted by industry leaders'
        },
        stats: {
          title: 'Numbers that speak',
          items: [
            { value: '99.8%', label: 'Accuracy Rate' },
            { value: '45%', label: 'Faster Picking' },
            { value: '30%', label: 'Cost Reduction' },
            { value: '24/7', label: 'Support' }
          ]
        },
        features: {
          subtitle: 'Everything you need',
          title: 'Next-generation warehouse management',
          description: 'From receiving to shipping, every process optimized with AI',
          items: [
            {
              title: 'Multi-Client Architecture',
              description: 'Complete data segregation. Each client has dedicated space with personalized dashboards.',
              icon: 'users'
            },
            {
              title: 'Smart Picking & Packing',
              description: 'AI algorithms to optimize picking routes and reduce order preparation times.',
              icon: 'brain'
            },
            {
              title: 'Real-time Tracking',
              description: 'Complete traceability of every movement with barcode, RFID and location intelligence.',
              icon: 'location'
            },
            {
              title: 'Analytics & KPI',
              description: 'Advanced dashboards with operational metrics, forecasting and automated reporting.',
              icon: 'chart'
            },
            {
              title: 'API Integration',
              description: 'Seamless integration with existing ERP, marketplace and transport systems.',
              icon: 'api'
            },
            {
              title: 'Mobile-First',
              description: 'Native app for operators with integrated scanner and optimized workflows.',
              icon: 'mobile'
            }
          ]
        },
        technologies: {
          title: 'Cutting-edge technologies',
          description: 'Built with modern technologies for performance and scalability',
          items: [
            { name: 'SvelteKit', description: 'Reactive and performant framework' },
            { name: 'TypeScript', description: 'Type-safe and secure code' },
            { name: 'SQLite', description: 'Fast and reliable database' },
            { name: 'Tailwind CSS', description: 'Modern design system' },
            { name: 'REST API', description: 'Standard integration' },
            { name: 'WebSocket', description: 'Real-time updates' }
          ]
        },
        testimonials: {
          title: 'What our customers say',
          items: [
            {
              name: 'John Smith',
              role: 'Logistics Director, LogiCorp',
              content: 'Morlappo WMS revolutionized our operations. Efficiency increased by 40% in just 3 months.',
              avatar: 'J'
            },
            {
              name: 'Sarah Johnson',
              role: 'Operations Manager, E-Commerce Plus',
              content: 'Intuitive interface and excellent support. Finally a WMS that understands our needs.',
              avatar: 'S'
            },
            {
              name: 'Mike Brown',
              role: 'CEO, 3PL Solutions',
              content: 'Multi-client management is perfect. Each customer has their dedicated view without compromises.',
              avatar: 'M'
            }
          ]
        },
        pricing: {
          title: 'Transparent pricing',
          subtitle: 'Choose the perfect plan for your business',
          monthly: 'Monthly',
          yearly: 'Yearly',
          save: 'Save 20%',
          plans: [
            {
              name: 'Starter',
              price: '99',
              period: 'month',
              description: 'Perfect for small businesses',
              features: [
                '1 Client',
                '1,000 Products',
                '5,000 Movements/month',
                'Basic dashboard',
                'Email support',
                'Mobile app'
              ],
              cta: 'Start free',
              popular: false
            },
            {
              name: 'Professional',
              price: '299',
              period: 'month',
              description: 'Ideal for growing companies',
              features: [
                '5 Clients',
                '10,000 Products',
                'Unlimited movements',
                'Advanced analytics',
                'Priority support',
                'API access',
                'Integrations'
              ],
              cta: 'Start trial',
              popular: true
            },
            {
              name: 'Enterprise',
              price: 'Custom',
              period: '',
              description: 'For large organizations',
              features: [
                'Unlimited clients',
                'Unlimited products',
                'Guaranteed SLA',
                'Dedicated support',
                'On-premise option',
                'Custom integrations',
                'Training included'
              ],
              cta: 'Contact us',
              popular: false
            }
          ]
        },
        integration: {
          title: 'Perfect integration',
          description: 'Connect with your existing systems through modern APIs'
        },
        cta: {
          title: 'Ready to revolutionize your warehouse?',
          description: 'Join hundreds of companies that have already optimized their logistics',
          button: 'Start Free Trial'
        }
      }
    },
    fr: {
      flag: '🇫🇷',
      name: 'Français',
      content: {
        nav: {
          features: 'Fonctionnalités',
          pricing: 'Tarifs',
          docs: 'Documentation',
          login: 'Connexion'
        },
        hero: {
          badge: 'WMS alimenté par IA',
          title: 'L\'avenir de la gestion d\'entrepôt',
          subtitle: 'Système intelligent pour entrepôts multi-clients',
          description: 'Optimisez votre entrepôt avec l\'intelligence artificielle. Gestion complète pour 3PL, e-commerce et industrie avec traçabilité temps réel et analytics avancés.',
          cta: 'Commencer gratuit',
          demo: 'Voir démo',
          clients: 'Choisi par les leaders du secteur'
        },
        stats: {
          title: 'Des chiffres qui parlent',
          items: [
            { value: '99.8%', label: 'Taux précision' },
            { value: '45%', label: 'Picking plus rapide' },
            { value: '30%', label: 'Réduction coûts' },
            { value: '24/7', label: 'Support' }
          ]
        },
        features: {
          subtitle: 'Tout ce dont vous avez besoin',
          title: 'Gestion d\'entrepôt nouvelle génération',
          description: 'De la réception à l\'expédition, chaque processus optimisé avec IA',
          items: [
            {
              title: 'Architecture Multi-Client',
              description: 'Ségrégation complète des données. Chaque client a son espace dédié avec tableaux de bord personnalisés.',
              icon: 'users'
            },
            {
              title: 'Picking & Packing Intelligent',
              description: 'Algorithmes IA pour optimiser les itinéraires de picking et réduire les temps de préparation.',
              icon: 'brain'
            },
            {
              title: 'Suivi Temps Réel',
              description: 'Traçabilité complète de chaque mouvement avec codes-barres, RFID et intelligence de localisation.',
              icon: 'location'
            },
            {
              title: 'Analytics & KPI',
              description: 'Tableaux de bord avancés avec métriques opérationnelles, prévisions et reporting automatique.',
              icon: 'chart'
            },
            {
              title: 'Intégration API',
              description: 'Intégration transparente avec ERP, marketplaces et systèmes de transport existants.',
              icon: 'api'
            },
            {
              title: 'Mobile-First',
              description: 'App native pour opérateurs avec scanner intégré et workflows optimisés.',
              icon: 'mobile'
            }
          ]
        },
        technologies: {
          title: 'Technologies de pointe',
          description: 'Construit avec des technologies modernes pour performance et évolutivité',
          items: [
            { name: 'SvelteKit', description: 'Framework réactif et performant' },
            { name: 'TypeScript', description: 'Code typé et sécurisé' },
            { name: 'SQLite', description: 'Base de données rapide et fiable' },
            { name: 'Tailwind CSS', description: 'Système de design moderne' },
            { name: 'REST API', description: 'Intégration standard' },
            { name: 'WebSocket', description: 'Mises à jour temps réel' }
          ]
        },
        testimonials: {
          title: 'Ce que disent nos clients',
          items: [
            {
              name: 'Pierre Dubois',
              role: 'Directeur Logistique, LogiCorp',
              content: 'Le WMS Morlappo a révolutionné nos opérations. Efficacité augmentée de 40% en seulement 3 mois.',
              avatar: 'P'
            },
            {
              name: 'Marie Martin',
              role: 'Responsable Opérations, E-Commerce Plus',
              content: 'Interface intuitive et support excellent. Enfin un WMS qui comprend nos besoins.',
              avatar: 'M'
            },
            {
              name: 'Jean Durand',
              role: 'PDG, 3PL Solutions',
              content: 'La gestion multi-client est parfaite. Chaque client a sa vue dédiée sans compromis.',
              avatar: 'J'
            }
          ]
        },
        pricing: {
          title: 'Tarifs transparents',
          subtitle: 'Choisissez le plan parfait pour votre entreprise',
          monthly: 'Mensuel',
          yearly: 'Annuel',
          save: 'Économisez 20%',
          plans: [
            {
              name: 'Starter',
              price: '99',
              period: 'mois',
              description: 'Parfait pour petites entreprises',
              features: [
                '1 Client',
                '1 000 Produits',
                '5 000 Mouvements/mois',
                'Tableau de bord basique',
                'Support email',
                'App mobile'
              ],
              cta: 'Commencer gratuit',
              popular: false
            },
            {
              name: 'Professionnel',
              price: '299',
              period: 'mois',
              description: 'Idéal pour entreprises en croissance',
              features: [
                '5 Clients',
                '10 000 Produits',
                'Mouvements illimités',
                'Analytics avancés',
                'Support prioritaire',
                'Accès API',
                'Intégrations'
              ],
              cta: 'Commencer essai',
              popular: true
            },
            {
              name: 'Entreprise',
              price: 'Sur mesure',
              period: '',
              description: 'Pour grandes organisations',
              features: [
                'Clients illimités',
                'Produits illimités',
                'SLA garantis',
                'Support dédié',
                'Option on-premise',
                'Intégrations custom',
                'Formation incluse'
              ],
              cta: 'Nous contacter',
              popular: false
            }
          ]
        },
        integration: {
          title: 'Intégration parfaite',
          description: 'Connectez-vous avec vos systèmes existants via des API modernes'
        },
        cta: {
          title: 'Prêt à révolutionner votre entrepôt?',
          description: 'Rejoignez des centaines d\'entreprises qui ont déjà optimisé leur logistique',
          button: 'Commencer l\'Essai Gratuit'
        }
      }
    },
    de: {
      flag: '🇩🇪',
      name: 'Deutsch',
      content: {
        nav: {
          features: 'Funktionen',
          pricing: 'Preise',
          docs: 'Dokumentation',
          login: 'Anmelden'
        },
        hero: {
          badge: 'KI-betriebenes WMS',
          title: 'Die Zukunft der Lagerverwaltung',
          subtitle: 'Intelligentes System für Multi-Client-Lager',
          description: 'Optimieren Sie Ihr Lager mit künstlicher Intelligenz. Komplette Verwaltung für 3PL, E-Commerce und Industrie mit Echtzeit-Tracking und erweiterten Analytics.',
          cta: 'Kostenlos starten',
          demo: 'Demo ansehen',
          clients: 'Vertraut von Branchenführern'
        },
        stats: {
          title: 'Zahlen, die sprechen',
          items: [
            { value: '99.8%', label: 'Genauigkeitsrate' },
            { value: '45%', label: 'Schnelleres Picking' },
            { value: '30%', label: 'Kostenreduktion' },
            { value: '24/7', label: 'Support' }
          ]
        },
        features: {
          subtitle: 'Alles was Sie brauchen',
          title: 'Lagerverwaltung der nächsten Generation',
          description: 'Vom Wareneingang bis zum Versand, jeder Prozess mit KI optimiert',
          items: [
            {
              title: 'Multi-Client-Architektur',
              description: 'Komplette Datentrennung. Jeder Client hat seinen dedizierten Bereich mit personalisierten Dashboards.',
              icon: 'users'
            },
            {
              title: 'Intelligentes Picking & Packing',
              description: 'KI-Algorithmen zur Optimierung von Picking-Routen und Reduzierung von Auftragsvorbereitungszeiten.',
              icon: 'brain'
            },
            {
              title: 'Echtzeit-Tracking',
              description: 'Vollständige Rückverfolgbarkeit jeder Bewegung mit Barcode, RFID und Location Intelligence.',
              icon: 'location'
            },
            {
              title: 'Analytics & KPI',
              description: 'Erweiterte Dashboards mit operativen Metriken, Prognosen und automatisierter Berichterstattung.',
              icon: 'chart'
            },
            {
              title: 'API-Integration',
              description: 'Nahtlose Integration mit bestehenden ERP-, Marktplatz- und Transportsystemen.',
              icon: 'api'
            },
            {
              title: 'Mobile-First',
              description: 'Native App für Operatoren mit integriertem Scanner und optimierten Workflows.',
              icon: 'mobile'
            }
          ]
        },
        technologies: {
          title: 'Modernste Technologien',
          description: 'Gebaut mit modernen Technologien für Leistung und Skalierbarkeit',
          items: [
            { name: 'SvelteKit', description: 'Reaktives und performantes Framework' },
            { name: 'TypeScript', description: 'Typsicherer und sicherer Code' },
            { name: 'SQLite', description: 'Schnelle und zuverlässige Datenbank' },
            { name: 'Tailwind CSS', description: 'Modernes Design-System' },
            { name: 'REST API', description: 'Standard-Integration' },
            { name: 'WebSocket', description: 'Echtzeit-Updates' }
          ]
        },
        testimonials: {
          title: 'Was unsere Kunden sagen',
          items: [
            {
              name: 'Hans Schmidt',
              role: 'Logistikdirektor, LogiCorp',
              content: 'Das Morlappo WMS hat unsere Abläufe revolutioniert. Effizienz um 40% in nur 3 Monaten gesteigert.',
              avatar: 'H'
            },
            {
              name: 'Anna Müller',
              role: 'Operations Manager, E-Commerce Plus',
              content: 'Intuitive Benutzeroberfläche und exzellenter Support. Endlich ein WMS, das unsere Bedürfnisse versteht.',
              avatar: 'A'
            },
            {
              name: 'Klaus Weber',
              role: 'CEO, 3PL Solutions',
              content: 'Das Multi-Client-Management ist perfekt. Jeder Kunde hat seine dedizierte Ansicht ohne Kompromisse.',
              avatar: 'K'
            }
          ]
        },
        pricing: {
          title: 'Transparente Preise',
          subtitle: 'Wählen Sie den perfekten Plan für Ihr Unternehmen',
          monthly: 'Monatlich',
          yearly: 'Jährlich',
          save: 'Sparen Sie 20%',
          plans: [
            {
              name: 'Starter',
              price: '99',
              period: 'Monat',
              description: 'Perfekt für kleine Unternehmen',
              features: [
                '1 Client',
                '1.000 Produkte',
                '5.000 Bewegungen/Monat',
                'Basis-Dashboard',
                'E-Mail-Support',
                'Mobile App'
              ],
              cta: 'Kostenlos starten',
              popular: false
            },
            {
              name: 'Professional',
              price: '299',
              period: 'Monat',
              description: 'Ideal für wachsende Unternehmen',
              features: [
                '5 Clients',
                '10.000 Produkte',
                'Unbegrenzte Bewegungen',
                'Erweiterte Analytics',
                'Priority Support',
                'API-Zugang',
                'Integrationen'
              ],
              cta: 'Testversion starten',
              popular: true
            },
            {
              name: 'Enterprise',
              price: 'Individuell',
              period: '',
              description: 'Für große Organisationen',
              features: [
                'Unbegrenzte Clients',
                'Unbegrenzte Produkte',
                'Garantierte SLA',
                'Dedizierter Support',
                'On-Premise Option',
                'Custom Integrationen',
                'Schulung inklusive'
              ],
              cta: 'Kontakt aufnehmen',
              popular: false
            }
          ]
        },
        integration: {
          title: 'Perfekte Integration',
          description: 'Verbinden Sie sich mit Ihren bestehenden Systemen über moderne APIs'
        },
        cta: {
          title: 'Bereit, Ihr Lager zu revolutionieren?',
          description: 'Schließen Sie sich Hunderten von Unternehmen an, die ihre Logistik bereits optimiert haben',
          button: 'Kostenlose Testversion starten'
        }
      }
    },
    es: {
      flag: '🇪🇸',
      name: 'Español',
      content: {
        nav: {
          features: 'Características',
          pricing: 'Precios',
          docs: 'Documentación',
          login: 'Iniciar sesión'
        },
        hero: {
          badge: 'WMS con IA',
          title: 'El futuro de la gestión de almacenes',
          subtitle: 'Sistema inteligente para almacenes multicliente',
          description: 'Optimiza tu almacén con inteligencia artificial. Gestión completa para 3PL, e-commerce e industria con seguimiento en tiempo real y analytics avanzados.',
          cta: 'Empezar gratis',
          demo: 'Ver demo',
          clients: 'Elegido por líderes del sector'
        },
        stats: {
          title: 'Números que hablan',
          items: [
            { value: '99.8%', label: 'Tasa de precisión' },
            { value: '45%', label: 'Picking más rápido' },
            { value: '30%', label: 'Reducción de costos' },
            { value: '24/7', label: 'Soporte' }
          ]
        },
        features: {
          subtitle: 'Todo lo que necesitas',
          title: 'Gestión de almacén de nueva generación',
          description: 'Desde la recepción hasta el envío, cada proceso optimizado con IA',
          items: [
            {
              title: 'Arquitectura Multi-Cliente',
              description: 'Segregación completa de datos. Cada cliente tiene su espacio dedicado con dashboards personalizados.',
              icon: 'users'
            },
            {
              title: 'Picking y Packing Inteligente',
              description: 'Algoritmos de IA para optimizar rutas de picking y reducir tiempos de preparación de pedidos.',
              icon: 'brain'
            },
            {
              title: 'Seguimiento en Tiempo Real',
              description: 'Trazabilidad completa de cada movimiento con códigos de barras, RFID e inteligencia de ubicación.',
              icon: 'location'
            },
            {
              title: 'Analytics y KPI',
              description: 'Dashboards avanzados con métricas operativas, pronósticos y reportes automatizados.',
              icon: 'chart'
            },
            {
              title: 'Integración API',
              description: 'Integración perfecta con ERP, marketplaces y sistemas de transporte existentes.',
              icon: 'api'
            },
            {
              title: 'Mobile-First',
              description: 'App nativa para operadores con escáner integrado y flujos de trabajo optimizados.',
              icon: 'mobile'
            }
          ]
        },
        technologies: {
          title: 'Tecnologías de vanguardia',
          description: 'Construido con tecnologías modernas para rendimiento y escalabilidad',
          items: [
            { name: 'SvelteKit', description: 'Framework reactivo y performante' },
            { name: 'TypeScript', description: 'Código tipado y seguro' },
            { name: 'SQLite', description: 'Base de datos rápida y confiable' },
            { name: 'Tailwind CSS', description: 'Sistema de diseño moderno' },
            { name: 'REST API', description: 'Integración estándar' },
            { name: 'WebSocket', description: 'Actualizaciones en tiempo real' }
          ]
        },
        testimonials: {
          title: 'Lo que dicen nuestros clientes',
          items: [
            {
              name: 'Carlos García',
              role: 'Director de Logística, LogiCorp',
              content: 'El WMS de Morlappo revolucionó nuestras operaciones. Eficiencia aumentada 40% en solo 3 meses.',
              avatar: 'C'
            },
            {
              name: 'Ana López',
              role: 'Gerente de Operaciones, E-Commerce Plus',
              content: 'Interfaz intuitiva y soporte excelente. Finalmente un WMS que entiende nuestras necesidades.',
              avatar: 'A'
            },
            {
              name: 'Miguel Rodríguez',
              role: 'CEO, 3PL Solutions',
              content: 'La gestión multicliente es perfecta. Cada cliente tiene su vista dedicada sin compromisos.',
              avatar: 'M'
            }
          ]
        },
        pricing: {
          title: 'Precios transparentes',
          subtitle: 'Elige el plan perfecto para tu empresa',
          monthly: 'Mensual',
          yearly: 'Anual',
          save: 'Ahorra 20%',
          plans: [
            {
              name: 'Starter',
              price: '99',
              period: 'mes',
              description: 'Perfecto para pequeñas empresas',
              features: [
                '1 Cliente',
                '1.000 Productos',
                '5.000 Movimientos/mes',
                'Dashboard básico',
                'Soporte por email',
                'App móvil'
              ],
              cta: 'Empezar gratis',
              popular: false
            },
            {
              name: 'Profesional',
              price: '299',
              period: 'mes',
              description: 'Ideal para empresas en crecimiento',
              features: [
                '5 Clientes',
                '10.000 Productos',
                'Movimientos ilimitados',
                'Analytics avanzados',
                'Soporte prioritario',
                'Acceso API',
                'Integraciones'
              ],
              cta: 'Empezar prueba',
              popular: true
            },
            {
              name: 'Enterprise',
              price: 'Personalizado',
              period: '',
              description: 'Para grandes organizaciones',
              features: [
                'Clientes ilimitados',
                'Productos ilimitados',
                'SLA garantizados',
                'Soporte dedicado',
                'Opción on-premise',
                'Integraciones custom',
                'Entrenamiento incluido'
              ],
              cta: 'Contáctanos',
              popular: false
            }
          ]
        },
        integration: {
          title: 'Integración perfecta',
          description: 'Conéctate con tus sistemas existentes a través de APIs modernas'
        },
        cta: {
          title: '¿Listo para revolucionar tu almacén?',
          description: 'Únete a cientos de empresas que ya han optimizado su logística',
          button: 'Comenzar Prueba Gratuita'
        }
      }
    },
    zh: {
      flag: '🇨🇳',
      name: '中文',
      content: {
        nav: {
          features: '功能',
          pricing: '价格',
          docs: '文档',
          login: '登录'
        },
        hero: {
          badge: 'AI驱动的WMS',
          title: '仓库管理的未来',
          subtitle: '多客户仓库智能系统',
          description: '用人工智能优化您的仓库。为3PL、电子商务和工业提供完整管理，具有实时跟踪和高级分析功能。',
          cta: '免费开始',
          demo: '观看演示',
          clients: '行业领导者的选择'
        },
        stats: {
          title: '数据说话',
          items: [
            { value: '99.8%', label: '准确率' },
            { value: '45%', label: '拣货更快' },
            { value: '30%', label: '成本降低' },
            { value: '24/7', label: '支持' }
          ]
        },
        features: {
          subtitle: '您需要的一切',
          title: '下一代仓库管理',
          description: '从接收到发货，每个流程都通过AI优化',
          items: [
            {
              title: '多客户架构',
              description: '完整的数据隔离。每个客户都有专用空间和个性化仪表板。',
              icon: 'users'
            },
            {
              title: '智能拣选和包装',
              description: 'AI算法优化拣选路线，减少订单准备时间。',
              icon: 'brain'
            },
            {
              title: '实时跟踪',
              description: '通过条码、RFID和位置智能完整追溯每个移动。',
              icon: 'location'
            },
            {
              title: '分析和KPI',
              description: '具有操作指标、预测和自动报告的高级仪表板。',
              icon: 'chart'
            },
            {
              title: 'API集成',
              description: '与现有ERP、市场和运输系统无缝集成。',
              icon: 'api'
            },
            {
              title: '移动优先',
              description: '为操作员提供集成扫描器和优化工作流程的原生应用。',
              icon: 'mobile'
            }
          ]
        },
        technologies: {
          title: '前沿技术',
          description: '采用现代技术构建，确保性能和可扩展性',
          items: [
            { name: 'SvelteKit', description: '响应式高性能框架' },
            { name: 'TypeScript', description: '类型安全的代码' },
            { name: 'SQLite', description: '快速可靠的数据库' },
            { name: 'Tailwind CSS', description: '现代设计系统' },
            { name: 'REST API', description: '标准集成' },
            { name: 'WebSocket', description: '实时更新' }
          ]
        },
        testimonials: {
          title: '客户评价',
          items: [
            {
              name: '李明',
              role: '物流总监，LogiCorp',
              content: 'Morlappo WMS革新了我们的运营。仅3个月效率就提高了40%。',
              avatar: '李'
            },
            {
              name: '王丽',
              role: '运营经理，E-Commerce Plus',
              content: '直观的界面和出色的支持。终于有了一个理解我们需求的WMS。',
              avatar: '王'
            },
            {
              name: '张伟',
              role: 'CEO，3PL Solutions',
              content: '多客户管理非常完美。每个客户都有专用视图，没有妥协。',
              avatar: '张'
            }
          ]
        },
        pricing: {
          title: '透明定价',
          subtitle: '为您的企业选择完美计划',
          monthly: '月付',
          yearly: '年付',
          save: '节省20%',
          plans: [
            {
              name: '入门版',
              price: '99',
              period: '月',
              description: '适合小型企业',
              features: [
                '1个客户',
                '1,000个产品',
                '5,000次移动/月',
                '基础仪表板',
                '邮件支持',
                '移动应用'
              ],
              cta: '免费开始',
              popular: false
            },
            {
              name: '专业版',
              price: '299',
              period: '月',
              description: '适合成长型企业',
              features: [
                '5个客户',
                '10,000个产品',
                '无限移动',
                '高级分析',
                '优先支持',
                'API访问',
                '集成功能'
              ],
              cta: '开始试用',
              popular: true
            },
            {
              name: '企业版',
              price: '定制',
              period: '',
              description: '适合大型组织',
              features: [
                '无限客户',
                '无限产品',
                '保证SLA',
                '专属支持',
                '本地部署选项',
                '定制集成',
                '包含培训'
              ],
              cta: '联系我们',
              popular: false
            }
          ]
        },
        integration: {
          title: '完美集成',
          description: '通过现代API与您现有的系统连接'
        },
        cta: {
          title: '准备好革新您的仓库了吗？',
          description: '加入已经优化物流的数百家公司',
          button: '开始免费试用'
        }
      }
    }
  };

  let content = languages[currentLang].content;
  let isYearly = false;

  function switchLanguage(lang: string) {
    currentLang = lang;
    content = languages[lang].content;
  }

  function getIcon(iconName: string) {
    const icons = {
      users: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/>
      </svg>`,
      brain: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>
      </svg>`,
      location: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
      </svg>`,
      chart: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
      </svg>`,
      api: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"/>
      </svg>`,
      mobile: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/>
      </svg>`
    };
    return icons[iconName] || '';
  }

  // Gallery functionality
  let activeGalleryItem = 0;
  
  const galleryItems = [
    {
      title: "Dashboard Principale",
      description: "Monitor in tempo reale delle attività del magazzino con KPI avanzati e analytics intelligenti. Controlla produttività, spazio occupato e performance operative.",
      image: "/placeholder-dashboard.svg"
    },
    {
      title: "Gestione Prodotti",
      description: "Anagrafica completa dei prodotti con codici barcode, categorie personalizzate e gestione scorte automatica per ogni committente.",
      image: "/placeholder-products.svg"
    },
    {
      title: "Movimenti Magazzino",
      description: "Tracciabilità completa di carico, scarico e movimenti interni con picking ottimizzato e controllo qualità integrato.",
      image: "/placeholder-movements.svg"
    },
    {
      title: "Report e Analytics",
      description: "Reportistica avanzata con grafici interattivi, previsioni AI e export automatizzati per la business intelligence.",
      image: "/placeholder-analytics.svg"
    }
  ];

  function setActiveGalleryItem(index: number) {
    activeGalleryItem = index;
  }

  // Auto-cycle gallery images every 4 seconds
  let galleryInterval: NodeJS.Timeout;
  
  function startGalleryAutoplay() {
    galleryInterval = setInterval(() => {
      activeGalleryItem = (activeGalleryItem + 1) % galleryItems.length;
    }, 4000);
  }
  
  function stopGalleryAutoplay() {
    if (galleryInterval) {
      clearInterval(galleryInterval);
    }
  }

  // Intersection Observer per le animazioni
  function observeSection(node: HTMLElement, sectionName: string) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            sectionsVisible[sectionName] = true;
            // Start gallery autoplay when gallery section becomes visible
            if (sectionName === 'gallery') {
              setTimeout(startGalleryAutoplay, 1000); // Start after initial animations
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(node);

    return {
      destroy() {
        observer.disconnect();
      }
    };
  }

  onMount(() => {
    isVisible = true;
    setTimeout(() => {
      sectionsVisible.hero = true;
    }, 200);
  });

  onDestroy(() => {
    stopGalleryAutoplay();
  });
</script>

<svelte:head>
  <title>AI-Powered WMS for Europe | Smart Warehouse Management | Morlappo</title>
</svelte:head>

<div class="bg-black text-white min-h-screen">
  <!-- Navigation -->
  <nav class="border-b border-gray-800 backdrop-blur-sm bg-black/90 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-6 lg:px-8">
      <div class="flex justify-between items-center py-4">
        <!-- Logo -->
        <div class="flex items-center space-x-3">
          <img src="https://connect.microlops.it:3304/morlappo-logo-white.png" alt="Morlappo Logo" class="w-8 h-8 object-contain">
          <span class="text-xl font-bold">Morlappo WMS</span>
        </div>

        <!-- Navigation Links -->
        <div class="hidden md:flex items-center space-x-8">
          <a href="#features" class="text-gray-300 hover:text-white transition-colors">{content.nav.features}</a>
          <a href="#pricing" class="text-gray-300 hover:text-white transition-colors">{content.nav.pricing}</a>
          <a href="https://github.com/morlapposrl/wms-warehouse-management" target="_blank" class="text-gray-300 hover:text-white transition-colors">{content.nav.docs}</a>
          
          <!-- Language Switcher -->
          <div class="flex items-center space-x-2">
            {#each Object.entries(languages) as [lang, config]}
              <button
                on:click={() => switchLanguage(lang)}
                class="w-8 h-8 rounded-full border-2 transition-all duration-200 {currentLang === lang ? 'border-purple-500 scale-110' : 'border-gray-600 hover:border-gray-400'}"
                title={config.name}
              >
                <span class="text-sm">{config.flag}</span>
              </button>
            {/each}
          </div>

          <button 
            on:click={() => window.location.href = '/login'}
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 font-medium"
          >
            {content.nav.login}
          </button>
        </div>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="relative overflow-hidden" use:observeSection={'hero'}>
    <div class="max-w-7xl mx-auto px-6 lg:px-8 py-20">
      <div class="text-center max-w-4xl mx-auto">
        <!-- Badge -->
        <div class="inline-flex items-center px-4 py-2 rounded-full bg-purple-900/30 border border-purple-500/20 mb-8 opacity-0 {sectionsVisible.hero ? 'animate-fade-in-up' : ''}">
          <svg class="w-4 h-4 text-purple-400 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
          </svg>
          <span class="text-purple-300 text-sm font-medium">{content.hero.badge}</span>
        </div>

        <!-- Main Title -->
        <h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight opacity-0 {sectionsVisible.hero ? 'animate-fade-in-up animation-delay-200' : ''}">
          <span class="bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
            {content.hero.title}
          </span>
        </h1>

        <!-- Subtitle -->
        <p class="text-xl md:text-2xl text-gray-400 mb-6 font-light opacity-0 {sectionsVisible.hero ? 'animate-fade-in-up animation-delay-400' : ''}">
          {content.hero.subtitle}
        </p>

        <!-- Description -->
        <p class="text-lg text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed opacity-0 {sectionsVisible.hero ? 'animate-fade-in-up animation-delay-600' : ''}">
          {content.hero.description}
        </p>

        <!-- Single CTA Button -->
        <div class="flex justify-center mb-16 opacity-0 {sectionsVisible.hero ? 'animate-fade-in-up animation-delay-800' : ''}">
          <button 
            on:click={() => window.location.href = '/login'}
            class="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 font-semibold text-lg shadow-xl hover:shadow-purple-500/25 hover:scale-105"
          >
            Accedi alla Piattaforma
          </button>
        </div>

        <!-- Trust Indicators -->
        <p class="text-sm text-gray-500 mb-8 opacity-0 {sectionsVisible.hero ? 'animate-fade-in-up animation-delay-1000' : ''}">{content.hero.clients}</p>
        <div class="flex justify-center items-center space-x-8 opacity-40 {sectionsVisible.hero ? 'animate-fade-in-up animation-delay-1200' : ''}">
          <div class="text-2xl font-bold">SAP</div>
          <div class="text-2xl font-bold">Oracle</div>
          <div class="text-2xl font-bold">Microsoft</div>
          <div class="text-2xl font-bold">Amazon</div>
        </div>
      </div>
    </div>

    <!-- Background Gradient -->
    <div class="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20 pointer-events-none"></div>
    <div class="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
  </section>

  <!-- Stats Section -->
  <section class="py-20 border-t border-gray-800" use:observeSection={'stats'}>
    <div class="max-w-7xl mx-auto px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-3xl font-bold mb-4 opacity-0 {sectionsVisible.stats ? 'animate-fade-in-up' : ''}">{content.stats.title}</h2>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
        {#each content.stats.items as stat, index}
          <div class="text-center opacity-0 {sectionsVisible.stats ? 'animate-fade-in-up' : ''}" style="animation-delay: {index * 100}ms">
            <div class="text-4xl md:text-5xl font-bold text-purple-400 mb-2">{stat.value}</div>
            <div class="text-gray-400">{stat.label}</div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Screenshot Gallery Section -->
  <section class="py-20 border-t border-gray-800" use:observeSection={'gallery'}>
    <div class="max-w-7xl mx-auto px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold mb-6 opacity-0 {sectionsVisible.gallery ? 'animate-fade-in-up' : ''}">Esplora la Piattaforma</h2>
        <p class="text-xl text-gray-400 max-w-3xl mx-auto opacity-0 {sectionsVisible.gallery ? 'animate-fade-in-up animation-delay-200' : ''}">Scopri le funzionalità principali del nostro sistema di gestione magazzino</p>
      </div>
      
      <div 
        class="grid lg:grid-cols-2 gap-12 items-center"
        on:mouseenter={stopGalleryAutoplay}
        on:mouseleave={startGalleryAutoplay}
      >
        <!-- Descriptions (Left Side) -->
        <div class="space-y-8 opacity-0 {sectionsVisible.gallery ? 'animate-fade-in-up animation-delay-400' : ''}">
          {#each galleryItems as item, index}
            <div 
              class="cursor-pointer p-6 rounded-lg border border-transparent transition-all duration-300 {activeGalleryItem === index ? 'border-purple-500 bg-purple-900/20' : 'hover:border-gray-700 hover:bg-gray-900/50'}"
              on:click={() => setActiveGalleryItem(index)}
              role="button"
              tabindex="0"
              on:keydown={(e) => e.key === 'Enter' && setActiveGalleryItem(index)}
            >
              <h3 class="text-xl font-semibold mb-3 {activeGalleryItem === index ? 'text-purple-400' : 'text-white'}">{item.title}</h3>
              <p class="text-gray-400 leading-relaxed">{item.description}</p>
            </div>
          {/each}
        </div>
        
        <!-- Screenshot Display (Right Side) -->
        <div class="relative opacity-0 {sectionsVisible.gallery ? 'animate-fade-in-up animation-delay-600' : ''}">
          <div class="relative rounded-xl overflow-hidden shadow-2xl border border-gray-700">
            {#each galleryItems as item, index}
              <div 
                class="absolute inset-0 transition-opacity duration-500 {activeGalleryItem === index ? 'opacity-100' : 'opacity-0'}"
              >
                <img 
                  src={item.image} 
                  alt={item.title}
                  class="w-full h-auto object-cover"
                  loading="lazy"
                />
                <!-- Overlay gradient for better text readability -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            {/each}
            
            <!-- Navigation dots -->
            <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {#each galleryItems as _, index}
                <button
                  class="w-3 h-3 rounded-full transition-all duration-300 {activeGalleryItem === index ? 'bg-purple-400 scale-110' : 'bg-gray-600 hover:bg-gray-500'}"
                  on:click={() => setActiveGalleryItem(index)}
                  aria-label="Vai alla immagine {index + 1}"
                />
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section id="features" class="py-20 border-t border-gray-800" use:observeSection={'features'}>
    <div class="max-w-7xl mx-auto px-6 lg:px-8">
      <div class="text-center mb-16">
        <p class="text-purple-400 text-sm font-medium uppercase tracking-wider mb-4 opacity-0 {sectionsVisible.features ? 'animate-fade-in-up' : ''}">{content.features.subtitle}</p>
        <h2 class="text-4xl md:text-5xl font-bold mb-6 opacity-0 {sectionsVisible.features ? 'animate-fade-in-up animation-delay-200' : ''}">{content.features.title}</h2>
        <p class="text-xl text-gray-400 max-w-3xl mx-auto opacity-0 {sectionsVisible.features ? 'animate-fade-in-up animation-delay-400' : ''}">{content.features.description}</p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each content.features.items as feature, index}
          <div class="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-gray-700 transition-all duration-200 group opacity-0 {sectionsVisible.features ? 'animate-fade-in-up' : ''}" style="animation-delay: {600 + index * 100}ms">
            <div class="text-purple-400 mb-4 group-hover:text-purple-300 transition-colors">
              {@html getIcon(feature.icon)}
            </div>
            <h3 class="text-xl font-semibold mb-3">{feature.title}</h3>
            <p class="text-gray-400 leading-relaxed">{feature.description}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Technologies Section -->
  <section class="py-20 border-t border-gray-800" use:observeSection={'technologies'}>
    <div class="max-w-7xl mx-auto px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold mb-6 opacity-0 {sectionsVisible.technologies ? 'animate-fade-in-up' : ''}">{content.technologies.title}</h2>
        <p class="text-xl text-gray-400 max-w-3xl mx-auto opacity-0 {sectionsVisible.technologies ? 'animate-fade-in-up animation-delay-200' : ''}">{content.technologies.description}</p>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {#each content.technologies.items as tech, index}
          <div class="text-center p-6 bg-gray-900/30 rounded-lg border border-gray-800 hover:border-gray-700 transition-all duration-200 opacity-0 {sectionsVisible.technologies ? 'animate-fade-in-up' : ''}" style="animation-delay: {400 + index * 100}ms">
            <div class="text-2xl font-bold text-purple-400 mb-2">{tech.name}</div>
            <p class="text-sm text-gray-400">{tech.description}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Testimonials Section -->
  <section class="py-20 border-t border-gray-800" use:observeSection={'testimonials'}>
    <div class="max-w-7xl mx-auto px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold mb-6 opacity-0 {sectionsVisible.testimonials ? 'animate-fade-in-up' : ''}">{content.testimonials.title}</h2>
      </div>
      
      <div class="grid md:grid-cols-3 gap-8">
        {#each content.testimonials.items as testimonial, index}
          <div class="bg-gray-900/50 border border-gray-800 rounded-xl p-8 opacity-0 {sectionsVisible.testimonials ? 'animate-fade-in-up' : ''}" style="animation-delay: {200 + index * 200}ms">
            <div class="flex items-center mb-6">
              <div class="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                {testimonial.avatar}
              </div>
              <div>
                <div class="font-semibold">{testimonial.name}</div>
                <div class="text-sm text-gray-400">{testimonial.role}</div>
              </div>
            </div>
            <p class="text-gray-300 leading-relaxed">"{testimonial.content}"</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Pricing Section -->
  <section id="pricing" class="py-20 border-t border-gray-800" use:observeSection={'pricing'}>
    <div class="max-w-7xl mx-auto px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold mb-6 opacity-0 {sectionsVisible.pricing ? 'animate-fade-in-up' : ''}">{content.pricing.title}</h2>
        <p class="text-xl text-gray-400 mb-8 opacity-0 {sectionsVisible.pricing ? 'animate-fade-in-up animation-delay-200' : ''}">{content.pricing.subtitle}</p>
        
        <!-- Pricing Toggle -->
        <div class="flex items-center justify-center space-x-4 mb-12 opacity-0 {sectionsVisible.pricing ? 'animate-fade-in-up animation-delay-400' : ''}">
          <span class="text-gray-300 {!isYearly ? 'font-semibold' : ''}">{content.pricing.monthly}</span>
          <button 
            on:click={() => isYearly = !isYearly}
            class="relative w-14 h-7 bg-gray-700 rounded-full transition-colors duration-200 {isYearly ? 'bg-purple-600' : ''}"
          >
            <div class="absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 {isYearly ? 'translate-x-7' : ''}"></div>
          </button>
          <span class="text-gray-300 {isYearly ? 'font-semibold' : ''}">{content.pricing.yearly}</span>
          {#if isYearly}
            <span class="text-purple-400 text-sm font-medium">{content.pricing.save}</span>
          {/if}
        </div>
      </div>

      <div class="grid md:grid-cols-3 gap-8">
        {#each content.pricing.plans as plan, index}
          <div class="bg-gray-900/50 border rounded-xl p-8 relative {plan.popular ? 'border-purple-500' : 'border-gray-800'} opacity-0 {sectionsVisible.pricing ? 'animate-fade-in-up' : ''}" style="animation-delay: {600 + index * 200}ms">
            {#if plan.popular}
              <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span class="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">Popolare</span>
              </div>
            {/if}
            
            <div class="text-center mb-8">
              <h3 class="text-2xl font-bold mb-2">{plan.name}</h3>
              <p class="text-gray-400 mb-6">{plan.description}</p>
              <div class="mb-6">
                {#if plan.price === 'Custom' || plan.price === 'Sur mesure' || plan.price === 'Individuell' || plan.price === 'Personalizado' || plan.price === '定制'}
                  <span class="text-4xl font-bold">{plan.price}</span>
                {:else}
                  <span class="text-4xl font-bold">€{isYearly ? Math.round(plan.price * 0.8) : plan.price}</span>
                  {#if plan.period}
                    <span class="text-gray-400">/{plan.period}</span>
                  {/if}
                {/if}
              </div>
            </div>

            <ul class="space-y-4 mb-8">
              {#each plan.features as feature}
                <li class="flex items-center">
                  <svg class="w-5 h-5 text-purple-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span class="text-gray-300">{feature}</span>
                </li>
              {/each}
            </ul>

            <button 
              on:click={() => plan.cta.includes('Contatt') || plan.cta.includes('Contact') || plan.cta.includes('Nous contacter') || plan.cta.includes('Kontakt') || plan.cta.includes('联系我们') ? window.open('https://canary.discord.com/channels/1417092442569572364/1417092781398032446', '_blank') : goto('/login')}
              class="w-full py-3 rounded-lg font-semibold transition-all duration-200 {plan.popular ? 'bg-purple-600 text-white hover:bg-purple-700' : 'border border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white'}"
            >
              {plan.cta}
            </button>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Open Source Section -->
  <section class="py-20 border-t border-gray-800" use:observeSection={'integration'}>
    <div class="max-w-7xl mx-auto px-6 lg:px-8">
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <!-- Open Source Info -->
        <div>
          <div class="inline-flex items-center px-4 py-2 rounded-full bg-green-900/30 border border-green-500/20 mb-6 opacity-0 {sectionsVisible.integration ? 'animate-fade-in-up' : ''}">
            <svg class="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span class="text-green-300 text-sm font-medium">Open Source</span>
          </div>
          <h2 class="text-4xl font-bold mb-6 opacity-0 {sectionsVisible.integration ? 'animate-fade-in-up animation-delay-200' : ''}">Partendo dall'Open Source per creare un progetto globale</h2>
          <p class="text-xl text-gray-400 mb-8 opacity-0 {sectionsVisible.integration ? 'animate-fade-in-up animation-delay-400' : ''}">
            Crediamo nella forza della collaborazione globale. Il nostro WMS parte da un progetto open source per costruire insieme il futuro della logistica mondiale.
          </p>
          <div class="space-y-4 mb-8 opacity-0 {sectionsVisible.integration ? 'animate-fade-in-up animation-delay-600' : ''}">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-gray-300">Codice sorgente completamente aperto</span>
            </div>
            <div class="flex items-center">
              <svg class="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-gray-300">Community-driven development</span>
            </div>
            <div class="flex items-center">
              <svg class="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-gray-300">Contributi da sviluppatori di tutto il mondo</span>
            </div>
            <div class="flex items-center">
              <svg class="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="text-gray-300">Innovazione condivisa e trasparente</span>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row gap-4 opacity-0 {sectionsVisible.integration ? 'animate-fade-in-up animation-delay-800' : ''}">
            <a 
              href="https://github.com/morlapposrl/wms-warehouse-management" 
              target="_blank"
              class="inline-flex items-center px-6 py-3 bg-gray-900 border border-gray-600 text-white rounded-lg hover:border-gray-400 transition-all duration-200 font-medium"
            >
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Vedi su GitHub
            </a>
            <button
              on:click={() => window.open('https://canary.discord.com/channels/1417092442569572364/1417092781398032446', '_blank')}
              class="inline-flex items-center px-6 py-3 border border-purple-600 text-purple-400 rounded-lg hover:bg-purple-600 hover:text-white transition-all duration-200 font-medium"
            >
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              Unisciti alla Community
            </button>
          </div>
        </div>

        <!-- API Integration -->
        <div class="opacity-0 {sectionsVisible.integration ? 'animate-fade-in-up animation-delay-400' : ''}">
          <div class="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
            <h3 class="text-2xl font-bold mb-6">Integrazione perfetta</h3>
            <p class="text-gray-400 mb-8">Connettiti con i tuoi sistemi esistenti tramite API moderne</p>
            
            <!-- API Example -->
            <div class="bg-black border border-gray-700 rounded-lg p-6">
              <div class="flex items-center justify-between mb-4">
                <span class="text-sm text-gray-400">REST API</span>
                <div class="flex space-x-2">
                  <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <div class="font-mono text-sm">
                <div class="text-purple-400">POST</div>
                <div class="text-blue-400">/api/v1/movements</div>
                <div class="text-gray-500 mt-2">Content-Type: application/json</div>
                <div class="text-gray-300 mt-4">{`{
  "product_id": "SKU123",
  "quantity": 100,
  "location": "A-01-01",
  "type": "INBOUND"
}`}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-20 border-t border-gray-800" use:observeSection={'cta'}>
    <div class="max-w-4xl mx-auto px-6 lg:px-8 text-center">
      <h2 class="text-4xl md:text-5xl font-bold mb-6 opacity-0 {sectionsVisible.cta ? 'animate-fade-in-up' : ''}">{content.cta.title}</h2>
      <p class="text-xl text-gray-400 mb-12 opacity-0 {sectionsVisible.cta ? 'animate-fade-in-up animation-delay-200' : ''}">{content.cta.description}</p>
      <button 
        on:click={() => window.location.href = '/login'}
        class="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 font-semibold text-lg shadow-xl hover:shadow-purple-500/25 hover:scale-105 opacity-0 {sectionsVisible.cta ? 'animate-fade-in-up animation-delay-400' : ''}"
      >
        {content.cta.button}
      </button>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t border-gray-800 py-12">
    <div class="max-w-7xl mx-auto px-6 lg:px-8">
      <div class="grid md:grid-cols-4 gap-8">
        <div>
          <div class="flex items-center space-x-3 mb-4">
            <img src="https://connect.microlops.it:3304/morlappo-logo-white.png" alt="Morlappo Logo" class="w-8 h-8 object-contain">
            <span class="text-xl font-bold">Morlappo WMS</span>
          </div>
          <p class="text-gray-400">Soluzioni integrate per la logistica e gestione magazzino con tecnologie avanzate per ottimizzare i processi della supply chain.</p>
        </div>
        
        <div>
          <h4 class="font-semibold mb-4">Prodotto</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="#features" class="hover:text-white transition-colors">Funzionalità</a></li>
            <li><a href="#pricing" class="hover:text-white transition-colors">Prezzi</a></li>
            <li><a href="https://github.com/morlapposrl/wms-warehouse-management" target="_blank" class="hover:text-white transition-colors">GitHub</a></li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-semibold mb-4">Contatti</h4>
          <ul class="space-y-2 text-gray-400">
            <li><span class="text-gray-300">WhatsApp:</span> +39 353 481 4795</li>
            <li><span class="text-gray-300">Sede Legale:</span><br>L.go Alvaro De Mendoza 4<br>64027 Sant'Omero (TE)</li>
            <li><span class="text-gray-300">Sede Operativa:</span><br>Via Braida 16<br>35010 Villa Del Conte (PD)</li>
            <li><span class="text-gray-300">P.IVA:</span> 02174570677</li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-semibold mb-4">Supporto</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="https://github.com/morlapposrl/wms-warehouse-management" target="_blank" class="hover:text-white transition-colors">Documentazione</a></li>
            <li><a href="https://canary.discord.com/channels/1417092442569572364/1417092781398032446" target="_blank" class="hover:text-white transition-colors">Discord Community</a></li>
            <li><a href="https://morlappo.com" target="_blank" class="hover:text-white transition-colors">Sito Aziendale</a></li>
          </ul>
        </div>
      </div>
      
      <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
        <p>&copy; 2025 MORLAPPO Srl - Tutti i diritti riservati.</p>
      </div>
    </div>
  </footer>
</div>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }

  /* Animazioni fade-in */
  :global(.animate-fade-in-up) {
    animation: fadeInUp 0.6s ease-out forwards;
  }

  :global(.animation-delay-200) {
    animation-delay: 200ms;
  }

  :global(.animation-delay-400) {
    animation-delay: 400ms;
  }

  :global(.animation-delay-600) {
    animation-delay: 600ms;
  }

  :global(.animation-delay-800) {
    animation-delay: 800ms;
  }

  :global(.animation-delay-1000) {
    animation-delay: 1000ms;
  }

  :global(.animation-delay-1200) {
    animation-delay: 1200ms;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Hover effects */
  :global(.hover\:scale-105:hover) {
    transform: scale(1.05);
  }
</style>