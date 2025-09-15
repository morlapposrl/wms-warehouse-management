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

<div class="min-h-screen bg-white dark:bg-gray-900 relative overflow-hidden">
  
  <!-- Decorative Background Elements -->
  <div class="absolute inset-0 overflow-hidden">
    <div class="absolute -top-4 -right-4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute top-1/3 -left-8 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
    <div class="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 4s;"></div>
  </div>
  
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
  <section class="relative pt-20 pb-16 px-4 bg-white dark:bg-gray-900">
    <div class="max-w-6xl mx-auto text-center">
      
      <!-- Logo/Brand -->
      <div class="mb-8 {isVisible ? 'animate-fade-in-up' : 'opacity-0'}">
        <div class="inline-flex items-center gap-4 p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-2xl mb-6">
          <div class="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm p-2">
            <img 
              src="https://connect.microlops.it:3304/morlappo-logo-white.png" 
              alt="Morlappo Logo" 
              class="w-full h-full object-contain"
              on:error={(e) => e.target.style.display = 'none'}
            />
          </div>
          <div class="text-left">
            <h1 class="text-3xl font-bold text-white mb-1">{content.hero.title}</h1>
            <p class="text-blue-100 text-sm font-medium">{content.hero.subtitle}</p>
          </div>
        </div>
      </div>
      
      <!-- Description -->
      <div class="mb-8 {isVisible ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'}">
        <p class="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-4">
          {content.hero.description}
        </p>
        <!-- Cloud Professional Badge -->
        <div class="flex justify-center">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-400/20 to-blue-500/20 rounded-full border border-slate-400/30 backdrop-blur-sm">
            <div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
              {#if currentLang === 'it'}
                Disponibile anche in <strong class="text-blue-600 dark:text-blue-400">Cloud Professionale</strong>
              {:else if currentLang === 'en'}
                Also available as <strong class="text-blue-600 dark:text-blue-400">Professional Cloud</strong>
              {:else if currentLang === 'fr'}
                Également disponible en <strong class="text-blue-600 dark:text-blue-400">Cloud Professionnel</strong>
              {:else if currentLang === 'de'}
                Auch verfügbar als <strong class="text-blue-600 dark:text-blue-400">Professional Cloud</strong>
              {:else if currentLang === 'es'}
                También disponible en <strong class="text-blue-600 dark:text-blue-400">Cloud Profesional</strong>
              {:else if currentLang === 'zh'}
                还提供<strong class="text-blue-600 dark:text-blue-400">专业云版本</strong>
              {/if}
            </span>
            <div class="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style="animation-delay: 0.5s;"></div>
          </div>
        </div>
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
          on:click={() => window.open('https://github.com/morlapposrl/wms-warehouse-management', '_blank')}
          class="px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-800 dark:text-gray-200 font-bold rounded-lg shadow-lg hover:shadow-xl border border-white/20 dark:border-gray-700/20 transform hover:scale-105 transition-all duration-200"
        >
          📋 {content.hero.demo}
        </button>
      </div>
      
    </div>
  </section>

  <!-- Features Section -->
  <section class="relative py-16 px-4 bg-gray-50 dark:bg-gray-800">
    <div class="max-w-6xl mx-auto relative z-10">
      
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
  <section class="relative py-16 px-4 bg-white dark:bg-gray-900">
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
  <section class="relative py-16 px-4 bg-gray-50 dark:bg-gray-800">
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

  <!-- Cloud Premium Section -->
  <section class="relative py-20 px-4 bg-white dark:bg-gray-900 overflow-hidden">
    
    <div class="max-w-6xl mx-auto text-center relative z-10">
      
      <!-- Premium Header -->
      <div class="mb-12">
        <div class="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-full shadow-lg mb-4">
          <span class="text-2xl">👑</span>
          <span>VERSIONE CLOUD PREMIUM</span>
        </div>
        <h2 class="text-4xl font-bold mb-4 text-gray-800 dark:text-gray-200">
          Gestione Professionale su Cloud
        </h2>
        <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Servizio cloud completo gestito da Morlappo con supporto 24/7, backup automatici e aggiornamenti garantiti
        </p>
      </div>
      
      <!-- Premium Features Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        
        <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-yellow-200 dark:border-yellow-600/50 hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div class="text-4xl mb-4">☁️</div>
          <h3 class="text-xl font-bold mb-3 text-gray-800 dark:text-gray-200">Cloud Hosting</h3>
          <p class="text-gray-600 dark:text-gray-400">Hosting professionale su server dedicati con uptime 99.9%</p>
        </div>
        
        <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-orange-200 dark:border-orange-600/50 hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div class="text-4xl mb-4">🛡️</div>
          <h3 class="text-xl font-bold mb-3 text-gray-800 dark:text-gray-200">Backup & Sicurezza</h3>
          <p class="text-gray-600 dark:text-gray-400">Backup giornalieri automatici e sicurezza enterprise-grade</p>
        </div>
        
        <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-amber-200 dark:border-amber-600/50 hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div class="text-4xl mb-4">🚀</div>
          <h3 class="text-xl font-bold mb-3 text-gray-800 dark:text-gray-200">Aggiornamenti</h3>
          <p class="text-gray-600 dark:text-gray-400">Aggiornamenti automatici con nuove funzionalità ogni mese</p>
        </div>
        
        <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-yellow-200 dark:border-yellow-600/50 hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div class="text-4xl mb-4">📞</div>
          <h3 class="text-xl font-bold mb-3 text-gray-800 dark:text-gray-200">Supporto 24/7</h3>
          <p class="text-gray-600 dark:text-gray-400">Assistenza telefonica e remote dedicated 24 ore su 24</p>
        </div>
        
        <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-orange-200 dark:border-orange-600/50 hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div class="text-4xl mb-4">⚡</div>
          <h3 class="text-xl font-bold mb-3 text-gray-800 dark:text-gray-200">Performance</h3>
          <p class="text-gray-600 dark:text-gray-400">Server ottimizzati per performance elevate e tempi di risposta minimi</p>
        </div>
        
        <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-amber-200 dark:border-amber-600/50 hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div class="text-4xl mb-4">🔧</div>
          <h3 class="text-xl font-bold mb-3 text-gray-800 dark:text-gray-200">Personalizzazioni</h3>
          <p class="text-gray-600 dark:text-gray-400">Customizzazioni dedicate e integrazione con sistemi esistenti</p>
        </div>
        
      </div>
      
      <!-- Pricing -->
      <div class="bg-gradient-to-r from-white/95 to-blue-50/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border-2 border-blue-300 mb-8">
        <div class="text-center">
          <div class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Disponibile a Giorni
          </div>
          <div class="text-xl text-gray-600 mb-4">Versione Cloud Premium</div>
          <div class="text-sm text-gray-500 mb-6">
            Include: Hosting, Supporto, Backup, Aggiornamenti, SSL, Monitoraggio
          </div>
          
          <!-- CTA Button -->
          <button
            on:click={() => window.open('mailto:info@morlappo.com?subject=Richiesta%20WMS%20Cloud%20Premium&body=Buongiorno,%0A%0ASono%20interessato%20alla%20versione%20Cloud%20Premium%20del%20sistema%20WMS.%0A%0AAzienda:%20%0ASettore:%20%0ANumero%20committenti%20previsti:%20%0AVolumi%20mensili%20stimati:%20%0A%0AGrazie%20per%20il%20contatto.', '_self')}
            class="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <span class="text-2xl">📧</span>
            <span>Richiedi Iscrizione</span>
          </button>
          
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Invia richiesta a info@morlappo.com per attivazione servizio cloud
          </p>
        </div>
      </div>
      
      <!-- Contact Info -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-yellow-200 dark:border-yellow-600/30">
          <div class="text-2xl mb-2">📧</div>
          <div class="font-semibold text-gray-800 dark:text-gray-200">Email</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">info@morlappo.com</div>
        </div>
        
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-orange-200 dark:border-orange-600/30">
          <div class="text-2xl mb-2">📱</div>
          <div class="font-semibold text-gray-800 dark:text-gray-200">Telefono</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">+39 395 348 147 95</div>
        </div>
        
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-amber-200 dark:border-amber-600/30">
          <div class="text-2xl mb-2">🌐</div>
          <div class="font-semibold text-gray-800 dark:text-gray-200">Website</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">morlappo.com</div>
        </div>
      </div>
      
    </div>
  </section>

  <!-- GitHub Section -->
  <section class="relative py-16 px-4 bg-gray-50 dark:bg-gray-800 overflow-hidden">
    <div class="max-w-4xl mx-auto text-center">
      
      <div class="mb-8">
        <h2 class="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">🚀 Open Source</h2>
        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Sistema completamente open source disponibile su GitHub. Contribuisci, forka, e personalizza secondo le tue esigenze.
        </p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div class="text-3xl mb-3">⭐</div>
          <h3 class="font-bold text-lg mb-2">MIT License</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm">Licenza permissiva per uso commerciale e privato</p>
        </div>
        
        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div class="text-3xl mb-3">🔧</div>
          <h3 class="font-bold text-lg mb-2">Customizable</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm">Facilmente personalizzabile per ogni business</p>
        </div>
        
        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div class="text-3xl mb-3">👥</div>
          <h3 class="font-bold text-lg mb-2">Community</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm">Supporto della community e contributi welcome</p>
        </div>
      </div>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          on:click={() => window.open('https://github.com/morlapposrl/wms-warehouse-management', '_blank')}
          class="flex items-center justify-center gap-3 px-6 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span>Vedi su GitHub</span>
        </button>
        
        <button
          on:click={() => window.open('https://github.com/morlapposrl/wms-warehouse-management/fork', '_blank')}
          class="flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 01-2 0v-2A5 5 0 0011 9H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <span>Fork Project</span>
        </button>
        
        <button
          on:click={() => window.open('https://github.com/morlapposrl/wms-warehouse-management/releases/latest', '_blank')}
          class="flex items-center justify-center gap-3 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          <span>Download Latest</span>
        </button>
      </div>
      
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-12 px-4 bg-gradient-to-r from-slate-900 to-blue-900 text-white">
    <div class="max-w-4xl mx-auto text-center">
      
      <div class="flex items-center justify-center gap-4 mb-6">
        <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center p-2">
          <img 
            src="https://connect.microlops.it:3304/morlappo-logo-white.png" 
            alt="Morlappo Logo" 
            class="w-full h-full object-contain"
            on:error={(e) => e.target.style.display = 'none'}
          />
        </div>
        <div>
          <div class="font-bold text-lg">Morlappo WMS</div>
          <div class="text-blue-200 text-sm">Warehouse Management System</div>
        </div>
      </div>
      
      <p class="text-blue-200 mb-2">{content.footer.company}</p>
      <p class="text-blue-300 text-sm">© 2025 - {content.footer.rights}</p>
      
      <div class="mt-8 pt-6 border-t border-blue-800">
        <div class="flex justify-center gap-6 text-sm text-blue-300 mb-4">
          <span>📧 info@morlappo.com</span>
          <span>🌐 morlappo.com</span>
          <span>📱 +39 395 348 147 95</span>
        </div>
        <div class="flex justify-center gap-4">
          <button
            on:click={() => window.open('https://github.com/morlapposrl/wms-warehouse-management', '_blank')}
            class="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-blue-200 hover:text-white"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>GitHub Repository</span>
          </button>
          <button
            on:click={() => window.open('https://github.com/morlapposrl/wms-warehouse-management/releases', '_blank')}
            class="flex items-center gap-2 px-4 py-2 bg-green-600/80 hover:bg-green-600 rounded-lg transition-all duration-200 text-white"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            <span>Download</span>
          </button>
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
  
  @keyframes slide {
    0% {
      transform: translateX(-100px) translateY(-100px);
    }
    100% {
      transform: translateX(100px) translateY(100px);
    }
  }
  
  @keyframes slide-reverse {
    0% {
      transform: translateX(50px) translateY(50px);
    }
    100% {
      transform: translateX(-50px) translateY(-50px);
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
    }
    50% {
      transform: translateY(-20px) rotate(180deg);
    }
  }
  
  @keyframes float-delay {
    0%, 100% {
      transform: translateY(0px) rotate(0deg) scale(1);
    }
    33% {
      transform: translateY(-15px) rotate(120deg) scale(1.1);
    }
    66% {
      transform: translateY(-25px) rotate(240deg) scale(0.9);
    }
  }
  
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  
  .animate-float-delay {
    animation: float-delay 8s ease-in-out infinite;
    animation-delay: 2s;
  }
  
  /* New Professional Animations */
  @keyframes gradientShift {
    0%, 100% {
      transform: scale(1) rotate(0deg);
      opacity: 0.6;
    }
    50% {
      transform: scale(1.05) rotate(2deg);
      opacity: 0.8;
    }
  }
  
  @keyframes meshRotate {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  
  @keyframes gridMove {
    0% {
      transform: translateX(0) translateY(0);
    }
    100% {
      transform: translateX(40px) translateY(40px);
    }
  }
  
  @keyframes pathFlow {
    0% {
      transform: translateX(-50px) translateY(-50px);
    }
    100% {
      transform: translateX(50px) translateY(50px);
    }
  }
  
  @keyframes barcodeScroll {
    0%, 100% {
      opacity: 0.3;
      transform: scaleX(1);
    }
    50% {
      opacity: 0.6;
      transform: scaleX(1.1);
    }
  }
  
  @keyframes circuitFlow {
    0% {
      transform: translateX(0) translateY(0);
    }
    100% {
      transform: translateX(60px) translateY(60px);
    }
  }
  
  @keyframes dataStream {
    0%, 100% {
      transform: translateX(0) translateY(0);
      opacity: 0.2;
    }
    50% {
      transform: translateX(20px) translateY(-20px);
      opacity: 0.4;
    }
  }
  
  @keyframes metricsGlow {
    0%, 100% {
      opacity: 0.15;
      transform: scale(1);
    }
    50% {
      opacity: 0.25;
      transform: scale(1.02);
    }
  }
  
  @keyframes statsWave {
    0%, 100% {
      transform: translateX(0) translateY(0);
    }
    33% {
      transform: translateX(15px) translateY(-10px);
    }
    66% {
      transform: translateX(-10px) translateY(15px);
    }
  }
  
  @keyframes float-slow {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
    }
    50% {
      transform: translateY(-25px) rotate(180deg);
    }
  }
  
  @keyframes float-medium {
    0%, 100% {
      transform: translateY(0px) rotate(0deg) scale(1);
    }
    50% {
      transform: translateY(-15px) rotate(90deg) scale(1.05);
    }
  }
  
  .animate-float-slow {
    animation: float-slow 8s ease-in-out infinite;
  }
  
  .animate-float-medium {
    animation: float-medium 6s ease-in-out infinite;
  }
  
  @keyframes conveyorMove {
    0% {
      transform: translateX(-100px);
    }
    100% {
      transform: translateX(200px);
    }
  }
  
  @keyframes scanLine {
    0%, 100% {
      transform: translateY(-50px);
      opacity: 0;
    }
    50% {
      transform: translateY(50px);
      opacity: 1;
    }
  }
</style>