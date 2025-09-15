<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  let currentLang = 'it';
  let isVisible = false;
  
  const languages = {
    it: {
      flag: '🇮🇹',
      name: 'Italiano',
      content: {
        hero: {
          title: 'Sistema WMS Professionale',
          subtitle: 'Warehouse Management System Multicommittente',
          description: 'Soluzione completa per la gestione di magazzini 3PL con tecnologie moderne e interfaccia intuitiva',
          cta: 'Accedi al Sistema',
          demo: 'Scopri le Features'
        },
        features: {
          title: 'Caratteristiche Principali',
          items: [
            {
              icon: '🏢',
              title: 'Multicommittente',
              description: 'Segregazione completa dei dati tra diversi clienti con dashboard dedicate'
            },
            {
              icon: '🎨',
              title: 'UI Moderna',
              description: 'Interfaccia con gradienti colorati, dark mode e design responsive'
            },
            {
              icon: '📦',
              title: 'Gestione Ubicazioni',
              description: 'Mappa interattiva del magazzino con tracking real-time'
            },
            {
              icon: '🔄',
              title: 'Movimentazioni',
              description: 'Tracciabilità completa di carichi, scarichi e trasferimenti'
            },
            {
              icon: '📊',
              title: 'Analytics',
              description: 'Dashboard con KPI operativi e reportistica avanzata'
            },
            {
              icon: '🌍',
              title: 'Multilingua',
              description: 'Supporto nativo per 6 lingue internazionali'
            }
          ]
        },
        stats: {
          title: 'Performance del Sistema',
          items: [
            { value: '100+', label: 'Committenti Supportati' },
            { value: '10K+', label: 'Prodotti per Cliente' },
            { value: '1K+', label: 'Movimenti/Giorno' },
            { value: '99.5%', label: 'Uptime Garantito' }
          ]
        },
        tech: {
          title: 'Stack Tecnologico',
          items: [
            { name: 'SvelteKit', desc: 'Framework moderno e performante' },
            { name: 'TypeScript', desc: 'Tipizzazione sicura e robusta' },
            { name: 'SQLite', desc: 'Database veloce e affidabile' },
            { name: 'Tailwind CSS', desc: 'Styling moderno e responsivo' }
          ]
        },
        footer: {
          company: 'Morlappo Srl - Innovazione attraverso l\'Intelligenza Artificiale',
          rights: 'Tutti i diritti riservati'
        }
      }
    },
    en: {
      flag: '🇬🇧',
      name: 'English',
      content: {
        hero: {
          title: 'Professional WMS System',
          subtitle: 'Multi-Tenant Warehouse Management System',
          description: 'Complete solution for 3PL warehouse management with modern technologies and intuitive interface',
          cta: 'Access System',
          demo: 'Explore Features'
        },
        features: {
          title: 'Key Features',
          items: [
            {
              icon: '🏢',
              title: 'Multi-Tenant',
              description: 'Complete data segregation between different clients with dedicated dashboards'
            },
            {
              icon: '🎨',
              title: 'Modern UI',
              description: 'Interface with colorful gradients, dark mode and responsive design'
            },
            {
              icon: '📦',
              title: 'Location Management',
              description: 'Interactive warehouse map with real-time tracking'
            },
            {
              icon: '🔄',
              title: 'Movements',
              description: 'Complete traceability of inbound, outbound and transfers'
            },
            {
              icon: '📊',
              title: 'Analytics',
              description: 'Dashboard with operational KPIs and advanced reporting'
            },
            {
              icon: '🌍',
              title: 'Multilingual',
              description: 'Native support for 6 international languages'
            }
          ]
        },
        stats: {
          title: 'System Performance',
          items: [
            { value: '100+', label: 'Supported Clients' },
            { value: '10K+', label: 'Products per Client' },
            { value: '1K+', label: 'Movements/Day' },
            { value: '99.5%', label: 'Guaranteed Uptime' }
          ]
        },
        tech: {
          title: 'Technology Stack',
          items: [
            { name: 'SvelteKit', desc: 'Modern and performant framework' },
            { name: 'TypeScript', desc: 'Safe and robust typing' },
            { name: 'SQLite', desc: 'Fast and reliable database' },
            { name: 'Tailwind CSS', desc: 'Modern and responsive styling' }
          ]
        },
        footer: {
          company: 'Morlappo Srl - Innovation through Artificial Intelligence',
          rights: 'All rights reserved'
        }
      }
    },
    fr: {
      flag: '🇫🇷',
      name: 'Français',
      content: {
        hero: {
          title: 'Système WMS Professionnel',
          subtitle: 'Système de Gestion d\'Entrepôt Multi-Locataire',
          description: 'Solution complète pour la gestion d\'entrepôts 3PL avec technologies modernes et interface intuitive',
          cta: 'Accéder au Système',
          demo: 'Découvrir les Fonctionnalités'
        },
        features: {
          title: 'Caractéristiques Principales',
          items: [
            {
              icon: '🏢',
              title: 'Multi-Locataire',
              description: 'Ségrégation complète des données entre différents clients avec tableaux de bord dédiés'
            },
            {
              icon: '🎨',
              title: 'Interface Moderne',
              description: 'Interface avec dégradés colorés, mode sombre et design responsive'
            },
            {
              icon: '📦',
              title: 'Gestion des Emplacements',
              description: 'Carte interactive de l\'entrepôt avec suivi en temps réel'
            },
            {
              icon: '🔄',
              title: 'Mouvements',
              description: 'Traçabilité complète des réceptions, expéditions et transferts'
            },
            {
              icon: '📊',
              title: 'Analyses',
              description: 'Tableau de bord avec KPI opérationnels et reporting avancé'
            },
            {
              icon: '🌍',
              title: 'Multilingue',
              description: 'Support natif pour 6 langues internationales'
            }
          ]
        },
        stats: {
          title: 'Performance du Système',
          items: [
            { value: '100+', label: 'Clients Supportés' },
            { value: '10K+', label: 'Produits par Client' },
            { value: '1K+', label: 'Mouvements/Jour' },
            { value: '99.5%', label: 'Disponibilité Garantie' }
          ]
        },
        tech: {
          title: 'Stack Technologique',
          items: [
            { name: 'SvelteKit', desc: 'Framework moderne et performant' },
            { name: 'TypeScript', desc: 'Typage sûr et robuste' },
            { name: 'SQLite', desc: 'Base de données rapide et fiable' },
            { name: 'Tailwind CSS', desc: 'Styling moderne et responsive' }
          ]
        },
        footer: {
          company: 'Morlappo Srl - Innovation par l\'Intelligence Artificielle',
          rights: 'Tous droits réservés'
        }
      }
    },
    de: {
      flag: '🇩🇪',
      name: 'Deutsch',
      content: {
        hero: {
          title: 'Professionelles WMS System',
          subtitle: 'Multi-Mandanten Lagerverwaltungssystem',
          description: 'Komplette Lösung für 3PL Lagerverwaltung mit modernen Technologien und intuitiver Benutzeroberfläche',
          cta: 'System Zugriff',
          demo: 'Features Entdecken'
        },
        features: {
          title: 'Hauptmerkmale',
          items: [
            {
              icon: '🏢',
              title: 'Multi-Mandant',
              description: 'Vollständige Datentrennung zwischen verschiedenen Kunden mit dedizierten Dashboards'
            },
            {
              icon: '🎨',
              title: 'Moderne UI',
              description: 'Benutzeroberfläche mit bunten Verläufen, Dark Mode und responsivem Design'
            },
            {
              icon: '📦',
              title: 'Standortverwaltung',
              description: 'Interaktive Lagerkarte mit Echtzeit-Tracking'
            },
            {
              icon: '🔄',
              title: 'Bewegungen',
              description: 'Vollständige Nachverfolgung von Eingängen, Ausgängen und Transfers'
            },
            {
              icon: '📊',
              title: 'Analytics',
              description: 'Dashboard mit operativen KPIs und erweiterten Berichten'
            },
            {
              icon: '🌍',
              title: 'Mehrsprachig',
              description: 'Native Unterstützung für 6 internationale Sprachen'
            }
          ]
        },
        stats: {
          title: 'System Performance',
          items: [
            { value: '100+', label: 'Unterstützte Kunden' },
            { value: '10K+', label: 'Produkte pro Kunde' },
            { value: '1K+', label: 'Bewegungen/Tag' },
            { value: '99.5%', label: 'Garantierte Verfügbarkeit' }
          ]
        },
        tech: {
          title: 'Technologie Stack',
          items: [
            { name: 'SvelteKit', desc: 'Modernes und performantes Framework' },
            { name: 'TypeScript', desc: 'Sichere und robuste Typisierung' },
            { name: 'SQLite', desc: 'Schnelle und zuverlässige Datenbank' },
            { name: 'Tailwind CSS', desc: 'Modernes und responsives Styling' }
          ]
        },
        footer: {
          company: 'Morlappo Srl - Innovation durch Künstliche Intelligenz',
          rights: 'Alle Rechte vorbehalten'
        }
      }
    },
    es: {
      flag: '🇪🇸',
      name: 'Español',
      content: {
        hero: {
          title: 'Sistema WMS Profesional',
          subtitle: 'Sistema de Gestión de Almacén Multi-Inquilino',
          description: 'Solución completa para gestión de almacenes 3PL con tecnologías modernas e interfaz intuitiva',
          cta: 'Acceder al Sistema',
          demo: 'Explorar Características'
        },
        features: {
          title: 'Características Principales',
          items: [
            {
              icon: '🏢',
              title: 'Multi-Inquilino',
              description: 'Segregación completa de datos entre diferentes clientes con dashboards dedicados'
            },
            {
              icon: '🎨',
              title: 'Interfaz Moderna',
              description: 'Interfaz con gradientes coloridos, modo oscuro y diseño responsive'
            },
            {
              icon: '📦',
              title: 'Gestión de Ubicaciones',
              description: 'Mapa interactivo del almacén con seguimiento en tiempo real'
            },
            {
              icon: '🔄',
              title: 'Movimientos',
              description: 'Trazabilidad completa de entradas, salidas y transferencias'
            },
            {
              icon: '📊',
              title: 'Analíticas',
              description: 'Dashboard con KPIs operacionales y reportes avanzados'
            },
            {
              icon: '🌍',
              title: 'Multiidioma',
              description: 'Soporte nativo para 6 idiomas internacionales'
            }
          ]
        },
        stats: {
          title: 'Rendimiento del Sistema',
          items: [
            { value: '100+', label: 'Clientes Soportados' },
            { value: '10K+', label: 'Productos por Cliente' },
            { value: '1K+', label: 'Movimientos/Día' },
            { value: '99.5%', label: 'Disponibilidad Garantizada' }
          ]
        },
        tech: {
          title: 'Stack Tecnológico',
          items: [
            { name: 'SvelteKit', desc: 'Framework moderno y eficiente' },
            { name: 'TypeScript', desc: 'Tipado seguro y robusto' },
            { name: 'SQLite', desc: 'Base de datos rápida y confiable' },
            { name: 'Tailwind CSS', desc: 'Estilos modernos y responsive' }
          ]
        },
        footer: {
          company: 'Morlappo Srl - Innovación a través de Inteligencia Artificial',
          rights: 'Todos los derechos reservados'
        }
      }
    },
    zh: {
      flag: '🇨🇳',
      name: '中文',
      content: {
        hero: {
          title: '专业WMS系统',
          subtitle: '多租户仓库管理系统',
          description: '采用现代技术和直观界面的3PL仓库管理完整解决方案',
          cta: '访问系统',
          demo: '探索功能'
        },
        features: {
          title: '主要特性',
          items: [
            {
              icon: '🏢',
              title: '多租户',
              description: '不同客户间完整的数据隔离，配备专用仪表板'
            },
            {
              icon: '🎨',
              title: '现代界面',
              description: '彩色渐变界面，支持暗色模式和响应式设计'
            },
            {
              icon: '📦',
              title: '位置管理',
              description: '具有实时跟踪功能的交互式仓库地图'
            },
            {
              icon: '🔄',
              title: '移动管理',
              description: '入库、出库和转移的完整可追溯性'
            },
            {
              icon: '📊',
              title: '数据分析',
              description: '具有操作KPI和高级报告的仪表板'
            },
            {
              icon: '🌍',
              title: '多语言',
              description: '原生支持6种国际语言'
            }
          ]
        },
        stats: {
          title: '系统性能',
          items: [
            { value: '100+', label: '支持客户数' },
            { value: '10K+', label: '每客户产品数' },
            { value: '1K+', label: '每日移动次数' },
            { value: '99.5%', label: '保证正常运行时间' }
          ]
        },
        tech: {
          title: '技术栈',
          items: [
            { name: 'SvelteKit', desc: '现代高性能框架' },
            { name: 'TypeScript', desc: '安全可靠的类型系统' },
            { name: 'SQLite', desc: '快速可靠的数据库' },
            { name: 'Tailwind CSS', desc: '现代响应式样式' }
          ]
        },
        footer: {
          company: 'Morlappo Srl - 通过人工智能创新',
          rights: '版权所有'
        }
      }
    }
  };
  
  $: content = languages[currentLang].content;
  
  onMount(() => {
    isVisible = true;
  });
  
  function changeLang(lang: string) {
    currentLang = lang;
  }
  
  function goToLogin() {
    goto('/login');
  }
</script>

<svelte:head>
  <title>{content.hero.title} - Morlappo WMS</title>
  <meta name="description" content={content.hero.description} />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-900 dark:to-purple-900">
  
  <!-- Language Selector -->
  <div class="fixed top-4 right-4 z-50">
    <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 dark:border-gray-700/20">
      <div class="flex p-2 gap-1">
        {#each Object.entries(languages) as [code, lang]}
          <button
            on:click={() => changeLang(code)}
            class="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 {currentLang === code ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
          >
            <span class="text-lg">{lang.flag}</span>
            <span class="hidden sm:inline">{lang.name}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Hero Section -->
  <section class="relative pt-20 pb-16 px-4">
    <div class="max-w-6xl mx-auto text-center">
      
      <!-- Logo/Brand -->
      <div class="mb-8 {isVisible ? 'animate-fade-in-up' : 'opacity-0'}">
        <div class="inline-flex items-center gap-4 p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-2xl mb-6">
          <div class="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <span class="text-4xl">🏭</span>
          </div>
          <div class="text-left">
            <h1 class="text-3xl font-bold text-white mb-1">{content.hero.title}</h1>
            <p class="text-blue-100 text-sm font-medium">{content.hero.subtitle}</p>
          </div>
        </div>
      </div>
      
      <!-- Description -->
      <div class="mb-12 {isVisible ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'}">
        <p class="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          {content.hero.description}
        </p>
      </div>
      
      <!-- CTA Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center mb-16 {isVisible ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'}">
        <button
          on:click={goToLogin}
          class="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          🚀 {content.hero.cta}
        </button>
        <button
          class="px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-800 dark:text-gray-200 font-bold rounded-lg shadow-lg hover:shadow-xl border border-white/20 dark:border-gray-700/20 transform hover:scale-105 transition-all duration-200"
        >
          📋 {content.hero.demo}
        </button>
      </div>
      
    </div>
  </section>

  <!-- Features Section -->
  <section class="py-16 px-4">
    <div class="max-w-6xl mx-auto">
      
      <h2 class="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-gray-200">
        {content.features.title}
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each content.features.items as feature, i}
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20 hover:shadow-xl transform hover:scale-105 transition-all duration-300">
            <div class="text-4xl mb-4">{feature.icon}</div>
            <h3 class="text-xl font-bold mb-3 text-gray-800 dark:text-gray-200">{feature.title}</h3>
            <p class="text-gray-600 dark:text-gray-400">{feature.description}</p>
          </div>
        {/each}
      </div>
      
    </div>
  </section>

  <!-- Stats Section -->
  <section class="py-16 px-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5">
    <div class="max-w-4xl mx-auto text-center">
      
      <h2 class="text-3xl font-bold mb-12 text-gray-800 dark:text-gray-200">
        {content.stats.title}
      </h2>
      
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {#each content.stats.items as stat}
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
            <div class="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
              {stat.value}
            </div>
            <div class="text-sm font-medium text-gray-600 dark:text-gray-400">
              {stat.label}
            </div>
          </div>
        {/each}
      </div>
      
    </div>
  </section>

  <!-- Tech Stack Section -->
  <section class="py-16 px-4">
    <div class="max-w-4xl mx-auto">
      
      <h2 class="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-gray-200">
        {content.tech.title}
      </h2>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {#each content.tech.items as tech}
          <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center hover:shadow-xl transform hover:scale-105 transition-all duration-300">
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              {tech.name}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {tech.desc}
            </div>
          </div>
        {/each}
      </div>
      
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-12 px-4 bg-gradient-to-r from-slate-900 to-blue-900 text-white">
    <div class="max-w-4xl mx-auto text-center">
      
      <div class="flex items-center justify-center gap-4 mb-6">
        <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
          <span class="text-2xl">🏭</span>
        </div>
        <div>
          <div class="font-bold text-lg">Morlappo WMS</div>
          <div class="text-blue-200 text-sm">Warehouse Management System</div>
        </div>
      </div>
      
      <p class="text-blue-200 mb-2">{content.footer.company}</p>
      <p class="text-blue-300 text-sm">© 2025 - {content.footer.rights}</p>
      
      <div class="mt-8 pt-6 border-t border-blue-800">
        <div class="flex justify-center gap-6 text-sm text-blue-300">
          <span>📧 info@morlappo.com</span>
          <span>🌐 morlappo.com</span>
          <span>📱 +39 395 348 147 95</span>
        </div>
      </div>
      
    </div>
  </footer>

</div>

<style>
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
  
  .animate-fade-in-up {
    animation: fadeInUp 0.8s ease-out forwards;
  }
  
  .animation-delay-200 {
    animation-delay: 0.2s;
  }
  
  .animation-delay-400 {
    animation-delay: 0.4s;
  }
</style>