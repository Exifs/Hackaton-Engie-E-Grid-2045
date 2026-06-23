const fr = {
  app: {
    title: "E-Grid 2045 | Prototype JS jouable",
    description: "Prototype JS jouable E-Grid 2045 : energie, datacenters, refroidissement, flux reseau et course AGI.",
    canvasLabel: "Carte jouable E-Grid 2045"
  },
  common: {
    actions: {
      close: "Fermer",
      build: "Construire",
      cancel: "Annuler",
      demolish: "Demolir",
      research: "Recherche",
      pause: "Pause",
      play: "Lecture",
      fastForward: "Avance rapide",
      maximumSpeed: "Avance maximale",
      understood: "Compris"
    },
    status: {
      available: "Disponible",
      locked: "Verrouille",
      unavailable: "Indisponible",
      active: "Actif",
      queued: "En file",
      complete: "Termine",
      stable: "Stable",
      low: "Bas",
      critical: "Critique"
    },
    units: {
      month: "mois",
      monthShort: "m",
      months: "mois",
      week: "Semaine",
      slots: "slots",
      points: "pts",
      experiencePoints: "XP",
      gigawatts: "GW",
      thermalGigawatts: "GWth",
      eflops: "EFLOPS",
      exaflopsShort: "EF",
      millionCurrency: "{{value}}M",
      billionCurrency: "{{value}} Md EUR",
      perMonth: "par mois",
      speedMultiplier: "{{value}}x",
      tier: "tier"
    }
  },
  hud: {
    aria: {
      indicators: "Indicateurs",
      heatmaps: "Cartes thermiques",
      alerts: "Alertes",
      selectedRegion: "Region selectionnee",
      construction: "Construction",
      resources: "Ressources critiques",
      simulationSpeed: "Vitesse de simulation"
    },
    brand: {
      title: "E-GRID 2045",
      tagline: "Construire. Optimiser. Alimenter l'Europe.",
      tooltip: "Construire, optimiser et stabiliser le reseau energetique europeen du calcul.",
      meta: "Couche de commandement strategique"
    },
    resources: {
      title: "Ressources critiques",
      energy: "Energie",
      cooling: "Froid",
      compute: "Calcul",
      researchers: "Chercheurs",
      co2: "CO2",
      energyShort: "E",
      coolingShort: "F",
      computeShort: "C",
      storageShort: "S",
      researchersShort: "R&D",
      produced: "produite",
      consumed: "consommee",
      available: "disponible",
      required: "requis",
      used: "utilise",
      productionShort: "prod.",
      optimal: "optimal",
      missing: "-{{value}} manquants",
      surplus: "+{{value}} marge",
      tooltip:
        "Energie {{energyProduced}} produite pour {{energyConsumed}} consommee. Froid {{coolingAvailable}} disponible pour {{coolingUsed}} utilise. Calcul {{compute}}. Chercheurs {{researchersAvailable}} / {{researchersRequired}}, avec {{researcherShortageRegions}} regions sous-dotees. Statut CO2 {{co2Tier}}.",
      meta: "Energie, froid, calcul, chercheurs, CO2"
    },
    heatmaps: {
      energy: { label: "Energie", short: "PWR", body: "Affiche les zones de production, de demande et de deficit energetique.", meta: "Flux electrique" },
      cooling: { label: "Froid", short: "CLD", body: "Met en avant les capacites de refroidissement et les reserves thermiques.", meta: "Refroidissement" },
      network: { label: "Reseau", short: "NET", body: "Priorise les congestions, liens actifs et transferts interregionaux.", meta: "Reseau" },
      compute: { label: "Calcul", short: "CPU", body: "Compare la production de calcul et les regions a forte charge IA.", meta: "Calcul" },
      co2: { label: "CO2", short: "CO2", body: "Affiche la pression carbone et le risque climatique.", meta: "Carbone" },
      none: { label: "Off", short: "OFF", body: "Desactive l'overlay strategique.", meta: "Carte claire" }
    },
    categories: {
      all: "Tous",
      research: "Recherche",
      energy: "Energie",
      storage: "Stockage",
      cooling: "Refroidissement",
      compute: "Centres de donnees",
      grid: "Reseau electrique"
    },
    panels: {
      construction: "Construction",
      research: "Recherche",
      overview: "Synthese",
      buildings: "Batiments",
      stats: "Stats",
      noActiveAlerts: "Aucune alerte active",
      selectedRegionFallback: "Selection region"
    },
    kpi: {
      budget: "Budget",
      budgetTooltip: "Tresorerie disponible {{money}}. Variation mensuelle {{trend}}{{income}}.",
      budgetMeta: "Projection economique",
      date: "Date",
      dateTooltip: "Fenetre de simulation courante : {{date}}, semaine {{week}}.",
      dateMeta: "Calendrier de campagne",
      week: "Semaine {{week}}",
      monthSuffix: "mois"
    },
    agi: {
      aria: "Progression AGI Europe contre USA",
      title: "Course AGI",
      body: "Europe {{eu}}% contre USA {{usa}}%. Les ticks indiquent la progression strategique globale.",
      progress: "Progression AGI",
      rival: "Courbe rivale",
      europe: "Europe",
      usa: "USA",
      versus: "VS",
      leadMeta: "{{side}} +{{points}} pts"
    },
    time: {
      speed: "Vitesse de simulation",
      tooltip: "Controle la cadence de la simulation.",
      meta: "Pause, lecture, avance rapide",
      paused: "Simulation en pause",
      realSpeed: "Vitesse reelle : {{speed}}"
    },
    menu: {
      title: "Menu de commande",
      body: "Ouvre les aides et commandes systeme disponibles pendant la simulation.",
      meta: "Menu"
    },
    alerts: {
      noActive: "Aucune alerte active",
      hide: "Masquer les alertes",
      close: "Fermer",
      view: "Voir",
      claim: "Reclamer",
      info: "Info",
      global: "Global",
      focusRegion: "Cliquer pour cadrer la region",
      systemInfo: "Information systeme",
      viewTitle: "Voir {{title}}",
      titles: {
        blackoutSevere: "Blackout severe",
        energyDeficit: "Deficit energie",
        coolingInsufficient: "Froid insuffisant",
        networkSaturated: "Reseau sature",
        slotsSaturated: "Emplacements satures",
        researchersInsufficient: "Chercheurs insuffisants",
        co2Elevated: "CO2 eleve",
        usaNearAgi: "USA proches de l'AGI"
      },
      bodies: {
        localEnergyDeficit: "deficit energetique local",
        importsWeak: "imports trop faibles ou distants",
        coolingExceeded: "les datacenters depassent le froid disponible",
        highLossFlows: "flux electriques a fortes pertes",
        regionalCapacityFull: "capacite regionale pleine",
        needsExceedCapacity: "les besoins depassent la capacite",
        fossilDependence: "dependance fossile en hausse",
        usCurveAhead: "la courbe US prend de l'avance"
      },
      actions: {
        buildLocalProduction: "construire une production locale",
        buildNearbySurplus: "construire un surplus proche",
        buildCooling: "construire du refroidissement fluvial, maritime ou air",
        spreadProduction: "repartir la production ou debloquer la supergrid",
        chooseAnotherRegion: "choisir une autre region",
        buildUniversities: "construire des universites",
        shiftClean: "basculer vers nucleaire et renouvelables",
        accelerateAi: "accelerer la recherche IA"
      }
    },
    reasons: {
      selectRegion: "Selectionne d'abord une region.",
      unknownBuilding: "Batiment inconnu.",
      researchTechnology: "Rechercher {{technology}}.",
      regionTag: "La region n'a pas le tag requis.",
      regionPotential: "Potentiel regional trop bas.",
      budget: "Budget insuffisant.",
      slots: "Pas assez d'emplacements regionaux.",
      noRegion: "Aucune region selectionnee.",
      noBuildingSlot: "Aucun batiment sur cet emplacement.",
      noConstructionSlot: "Aucun chantier sur cet emplacement.",
      unknownResearch: "Recherche inconnue.",
      queued: "En file.",
      unknownQueuedResearch: "Recherche en file inconnue.",
      queuedCannotMoveHigher: "La recherche en file ne peut pas monter plus haut.",
      addToQueue: "Ajouter a la file de recherche.",
      readyResearch: "Pret a lancer.",
      completed: "Termine.",
      inProgress: "Recherche en cours.",
      zeroRate: "Debit 0 : {{reason}}",
      outputUnavailable: "production de recherche indisponible.",
      queuePosition: "File #{{position}}.",
      requires: "Requiert {{name}}.",
      researchCompleted: "Recherche deja terminee.",
      researchActive: "Recherche deja active.",
      researchQueued: "Recherche deja en file.",
      requiresAiCenter: "Requiert un Centre recherche IA actif.",
      requiresEnergyCenter: "Requiert un Centre recherche energie actif.",
      requiresAnyResearchCenter: "Requiert un Centre recherche energie ou Centre recherche IA actif."
    },
    region: {
      resizeRight: "Redimensionner le panel droit",
      noConstruction: "Aucun chantier",
      noDemolition: "Aucune demolition",
      noAssets: "Aucun actif",
      buildingSlots: "Emplacements batiments",
      constructionSite: "Chantier",
      demolition: "Demolition",
      energy: "Energie",
      cooling: "Froid",
      compute: "Calcul",
      overview: "Synthese",
      overviewTooltip: "Vue synthese",
      overviewBody: "Emplacements, statuts et action principale",
      buildingsTooltip: "Actifs et files",
      buildingsBody: "Actifs, construction et demolition",
      statsTooltip: "Indicateurs regionaux",
      statsBody: "Capacite, reserves et tags",
      region: "Region",
      regionLevel: "Niveau region",
      views: "Vues region",
      active: "Actif",
      changeView: "Changer de vue",
      manage: "Gerer la region",
      manageTooltip: "Ouvrir le dock de construction pour {{region}}.",
      freeSlots: "{{count}} emplacements libres",
      slots: "Emplacements",
      free: "{{count}} libres",
      levelXp: "XP niveau",
      level: "Niveau {{level}}",
      energyReserve: "Reserve energie",
      producedShort: "{{value}} prod",
      coolingReserve: "Reserve froid",
      capacityShort: "{{value}} capacite",
      computeDeficit: "Deficit calcul",
      computeReserve: "Reserve calcul",
      supplyShort: "{{value}} offre",
      tags: "Tags",
      none: "Aucun",
      extraConstruction: "chantiers en plus",
      viewAllConstruction: "Voir tous les chantiers",
      historyPending: "Historique en attente",
      historyAria: "Historique regional",
      resourceHistory: "Historique ressources",
      historyResource: "Ressource historique",
      historyPeriod: "Periode historique",
      historyEmpty: "Avance quelques mois pour lire une tendance.",
      supply: "Offre",
      usage: "Usage",
      export: "Export",
      importDeficit: "Import/deficit",
      evolution: "Evolution {{label}}",
      remainingMonths: "{{months}}m restantes",
      cancelTitle: "Annuler {{name}}",
      demolitionTitle: "Demolition {{name}}",
      localUse: "Usage local",
      balance: "Solde"
    },
    dock: {
      resizeBottom: "Redimensionner le dock bas",
      panel: "Panel bas",
      close: "Fermer",
      build: "Construire"
    },
    construction: {
      categories: "Categories batiments",
      showOnly: "Afficher seulement {{label}}.",
      options: "{{count}} options",
      unlockRequired: "A debloquer",
      lockedOptions: "Options verrouillees par la recherche ou le potentiel regional.",
      researchShort: "Rech.",
      available: "Disponible",
      locked: "Verrouille",
      techOk: "Tech OK",
      agiBoost: "AGI+",
      showLocked: "Afficher verrouilles",
      showLockedBody: "Inclut les batiments verrouilles par la recherche, les tags ou le potentiel regional dans la liste de construction.",
      filterActive: "Filtre actif",
      filterInactive: "Filtre inactif",
      infrastructure: "Infrastructure",
      regionalInfrastructure: "Infrastructure regionale.",
      dismantle: "Demonter",
      dismantleTitle: "Demonter {{name}} ({{cost}}M)",
      costMonthsSlots: "{{cost}}M - {{months}}m - {{slots}} slots",
      energyDemand: "-{{value}} Energie",
      coolingDemand: "-{{value}} Froid",
      researchersDemand: "{{value}} chercheurs",
      requiredResearch: "Recherche requise",
      requiredPotential: "Potentiel requis",
      regionTags: "Tags region",
      tiers: "Paliers",
      variable: "Variable",
      variableProduction: "Production variable"
    },
    researchPanel: {
      showUnavailable: "Afficher indisponibles",
      showUnavailableBody: "Inclut les recherches indisponibles pour afficher ce qui bloque leur lancement.",
      noActive: "Aucune recherche active",
      chooseTier: "Choisis un palier a lancer",
      queue: "File",
      queueAria: "File de recherche",
      noQueued: "Aucune recherche en attente",
      required: "Recherche requise",
      unlocks: "Debloque {{name}}",
      moveUp: "Remonter {{name}}",
      remove: "Retirer {{name}}",
      up: "Monter",
      removeShort: "Retirer",
      totalCost: "Cout total",
      accumulatedPoints: "Points accumules",
      monthlyProduction: "Production mensuelle",
      eta: "Temps restant estime",
      etaShort: "ETA",
      etaComplete: "terminee",
      zeroRateShort: "debit 0",
      branchTier: "Branche et palier",
      tierLabel: "P{{tier}}",
      branchTierShort: "{{branch}} P{{tier}}",
      techRequirement: "Tech {{technology}}",
      branches: {
        ai: "IA",
        energy: "Energie",
        infrastructure: "Infrastructure"
      },
      prerequisite: "Prerequis technologique",
      blocker: "Condition bloquante",
      status: "Statut",
      effect: "Effet",
      researchEffect: "Effet de recherche",
      buildingUnlocked: "Batiment debloque",
      unlock: "Deblocage"
    },
    gridOverview: {
      title: "Vue reseau",
      meta: "Carte reseau compacte",
      tooltip: "{{active}} liaisons actives. {{congested}} congestions. Flux energie {{consumed}} / {{produced}} GW.",
      powerFlow: "Flux electrique",
      dataFlow: "Flux donnees",
      congestion: "Congestion",
      planned: "Planifie"
    },
    tooltipSections: {
      produced: "Produit",
      consumed: "Consomme",
      constraints: "Contraintes",
      points: "Points",
      conditions: "Conditions",
      unlocks: "Deblocages",
      effect: "Effet",
      price: "Prix",
      construction: "Construction",
      footprint: "Emprise",
      energyProduction: "Production energie",
      coolingProduction: "Production froid",
      computeCapacity: "Capacite calcul",
      gridStorage: "Stockage reseau",
      researchers: "Chercheurs",
      energyNeed: "Besoin energie",
      coolingNeed: "Besoin froid",
      computeNeed: "Besoin calcul",
      requiredResearchers: "Chercheurs requis",
      carbonPressure: "Pression carbone"
    },
    map: {
      zoomLevel: "Zoom {{value}}%",
      resetZoom: "Reinit.",
      labels: {
        ireland: "IRLANDE",
        unitedKingdom: "ROYAUME\nUNI",
        norway: "NORVEGE",
        sweden: "SUEDE",
        finland: "FINLANDE",
        denmark: "DANEMARK",
        belgium: "BELGIQUE",
        germany: "ALLEMAGNE",
        france: "FRANCE",
        spain: "ESPAGNE",
        portugal: "PORTUGAL",
        switzerland: "SUISSE",
        italy: "ITALIE",
        austria: "AUTRICHE",
        czechia: "TCHEQUIE",
        poland: "POLOGNE",
        slovakia: "SLOVAQUIE",
        hungary: "HONGRIE",
        romania: "ROUMANIE",
        bulgaria: "BULGARIE",
        greece: "GRECE",
        northSea: "MER DU\nNORD",
        balticSea: "MER\nBALTIQUE",
        atlanticOcean: "OCEAN\nATLANTIQUE",
        mediterraneanSea: "MER\nMEDITERRANEE",
        blackSea: "MER\nNOIRE"
      }
    }
  },
  onboarding: {
    ui: {
      briefing: "Briefing",
      consequence: "Consequence",
      understood: "Compris",
      next: "Suivant",
      previous: "Precedent",
      skip: "Passer",
      role: "Directrice operations reseau",
      command: "Commandement E-Grid",
      objectiveList: "Objectif courant",
      completeMark: "OK"
    },
    mission: {
      title: "Mission",
      body:
        "Je prends le relais. Mission europeenne : garder l'initiative face aux USA dans la course a l'AGI. Le calcul est prioritaire, mais il ne vaut rien sans energie, froid, reseau stable et chercheurs disponibles.",
      objective: "Lire la mission puis continuer.",
      checklist: "Comprendre la course Europe / USA"
    },
    resources: {
      title: "Ressources cles",
      body:
        "Lis les jauges comme une salle de controle. Les chercheurs sont la capacite humaine R&D. Les points de recherche financent les technologies. Le calcul pousse l'AGI. Energie, froid, reseau et CO2 fixent tes limites.",
      objective: "Observer energie, chercheurs, calcul, froid et CO2.",
      checklist: "Identifier les KPI critiques"
    },
    university: {
      title: "Universite",
      body:
        "On commence par le vivier humain. Les chercheurs sont une capacite globale : sans eux, centres de donnees, centres R&D et centrales avancees risquent de tourner au ralenti.",
      objective: "Construire une universite dans une region urbaine ou orientee recherche.",
      consequence:
        "La region commence a renforcer le vivier de chercheurs. Les infrastructures avancees auront moins de risque de tourner au ralenti.",
      checklist: "Construire une universite"
    },
    coolingOverlay: {
      title: "Overlay refroidissement",
      body:
        "Avant les serveurs, regarde le froid. Le refroidissement est une contrainte de localisation : regions froides, littorales ou fluviales soutiennent mieux les centres de donnees.",
      objective: "Activer l'overlay Froid.",
      consequence: "Tu vois maintenant ou les centres de donnees seront les moins couteux a soutenir.",
      checklist: "Activer l'overlay Froid"
    },
    starterEnergy: {
      title: "Energie de depart",
      body:
        "Securise une premiere marge electrique. Le gaz demarre vite et stabilise le reseau, mais charge le CO2. Solaire et eolien sont plus propres, avec une production variable.",
      objective: "Construire du gaz, du solaire ou de l'eolien terrestre.",
      consequence: "La region gagne de la marge electrique, mais surveille le CO2 si tu as choisi le gaz.",
      checklist: "Construire une production electrique"
    },
    coolingBuild: {
      title: "Refroidissement",
      body:
        "Construis le refroidissement avant d'empiler les serveurs. Le froid protege l'efficacite des centres de donnees et evite que le calcul coute trop cher a maintenir.",
      objective: "Construire une solution de refroidissement compatible avec la region.",
      consequence: "Le froid disponible augmente : les prochains centres de donnees garderont une meilleure efficacite.",
      checklist: "Construire du refroidissement"
    },
    datacenter: {
      title: "Centre de donnees",
      body:
        "Le centre de donnees transforme energie, froid et chercheurs en calcul. Ce calcul sert surtout a accelerer la progression AGI ; s'il manque un pilier, il sous-performe.",
      objective: "Construire un centre de donnees standard.",
      consequence: "Le calcul augmente. Il pourra accelerer l'AGI si energie, froid et chercheurs suivent.",
      checklist: "Construire un centre de donnees standard"
    },
    research: {
      title: "Centre recherche IA",
      body:
        "Le Centre recherche IA transforme calcul et chercheurs en progression AGI. C'est l'accelerateur direct de la course : il devient rentable seulement si energie, froid et chercheurs suivent.",
      objective: "Construire un Centre recherche IA.",
      consequence:
        "La trajectoire AGI europeenne gagne un moteur dedie : le calcul peut maintenant etre converti plus efficacement en avance strategique.",
      checklist: "Construire un Centre recherche IA"
    },
    energyResearch: {
      title: "Centre recherche energie",
      body:
        "Ajoute ensuite le Centre recherche energie. Il produit les points technologiques qui debloquent batteries, super-reseau, renouvelables offshore et nucleaire avance.",
      objective: "Construire un Centre recherche energie.",
      consequence:
        "Tu ouvres la trajectoire energie : les prochaines recherches pourront transformer ton reseau, ton stockage et ta production bas carbone.",
      checklist: "Construire un Centre recherche energie"
    },
    networkOverlay: {
      title: "Overlay reseau",
      body:
        "Controle le reseau. Les imports peuvent sauver une region, mais les pertes montent avec la distance et le volume. Une saturation coupera ta montee en puissance.",
      objective: "Activer l'overlay Reseau ou Energie.",
      consequence: "Tu peux maintenant reperer les dependances aux imports et les risques de pertes.",
      checklist: "Activer l'overlay Reseau ou Energie"
    },
    complete: {
      title: "Fin du guidage",
      body:
        "Premiere boucle lancee. A partir d'ici, cherche l'autonomie strategique : nucleaire, stockage, super-reseau, renouvelables et R&D doivent arriver avant les penuries.",
      objective: "Fermer le tutoriel.",
      checklist: "Continuer en autonomie"
    }
  },
  content: {
    buildings: {
      university: { name: "Universite", notes: "Produit des chercheurs; bonus naturel dans les regions de recherche." },
      ai_research_center: { name: "Centre recherche IA", notes: "Convertit calcul et chercheurs en progression AGI." },
      energy_research_center: { name: "Centre recherche energie", notes: "Debloque batteries, super-reseau, nucleaire avance, etc." },
      datacenter_standard: { name: "Centre de donnees standard", notes: "Disponible des 2025; depend fortement du froid regional." },
      datacenter_hyperscale: { name: "Centre de donnees hyperscale", notes: "Milieu/fin de partie; evite la force brute sans reseau ni froid." },
      gas_power_plant: { name: "Centrale gaz", notes: "Solution rapide; augmente la pression CO2 et le risque climatique." },
      nuclear_power_plant: { name: "Centrale nucleaire", notes: "Tres fort socle long terme; trop lent pour corriger une crise immediate." },
      wind_onshore: { name: "Eolien terrestre", notes: "Variable, mais rapide et propre." },
      wind_offshore: { name: "Eolien offshore", notes: "Verrouille au demarrage P0; plus stable que l'onshore et renforce les regions littorales." },
      solar_farm: { name: "Solaire", notes: "Excellent dans le sud, variable et peu cher." },
      hydro_dam: { name: "Hydro", notes: "Stable; vulnerable aux secheresses." },
      battery_storage: { name: "Batterie", notes: "Amortit les fluctuations renouvelables." },
      air_cooling: { name: "Refroidissement air", notes: "Partout, simple, mais consomme de l'energie." },
      river_cooling: { name: "Refroidissement fluvial", notes: "Tres efficace, mais vulnerable aux secheresses." },
      sea_cooling: { name: "Refroidissement marin", notes: "Excellent rendement, mais contraint la localisation des centres de donnees." },
      geothermal_cooling: { name: "Geothermie froid", notes: "Stable, avance, couteux." }
    },
    effects: {
      unlock_building: "Deblocage de batiment",
      ai_efficiency_bonus: "Efficacite IA",
      distance_efficiency_bonus: "Efficacite distance",
      monthly_income_bonus_and_energy_demand_reduction: "Bonus de revenus et baisse de demande energie",
      cooling_demand_reduction: "Demande de refroidissement",
      network_transfer_bonus: "Bonus de transfert reseau",
      nuclear_cost_time_output_modifiers: "Cout, delai et production nucleaires",
      agi_gain_multiplier: "Multiplicateur de gain AGI"
    },
    effectValues: {
      battery_storage: "Batterie",
      wind_offshore: "Eolien offshore",
      datacenter_hyperscale: "Centre de donnees hyperscale",
      geothermal_cooling: "Geothermie froid",
      income_bonus_30_energy_demand_pct_minus_10: "+30 revenus; -10% demande energie",
      distance_efficiency_pct_15_volume_threshold_pct_25: "+15% efficacite distance; +25% seuil de volume",
      cost_pct_minus_10_construction_pct_minus_10_output_pct_15: "-10% cout; -10% delai de construction; +15% production"
    },
    potentials: {
      cooling: "Potentiel froid",
      hydro: "Potentiel hydro",
      nuclear: "Potentiel nucleaire",
      research: "Potentiel recherche",
      solar: "Potentiel solaire",
      wind_offshore: "Potentiel eolien offshore",
      wind_onshore: "Potentiel eolien terrestre"
    },
    regionTags: {
      atlantique: "Atlantique",
      central: "Central",
      charbon: "Charbon",
      dense: "Dense",
      fleuve: "Fleuve",
      foret: "Foret",
      froid: "Froid",
      hydro: "Hydro",
      iles: "Iles",
      industriel: "Industriel",
      littoral: "Littoral",
      mer_du_nord: "Mer du Nord",
      mer_noire: "Mer Noire",
      montagne: "Montagne",
      peu_dense: "Peu dense",
      plaine: "Plaine",
      sec: "Sec",
      solaire: "Solaire",
      sud: "Sud",
      urbain: "Urbain"
    },
    technologies: {
      batteries: { name: "Batteries", notes: "Debloque le stockage pour lisser les renouvelables." },
      offshore_wind: { name: "Eolien offshore industriel", notes: "Debloque l'eolien offshore, verrouille au demarrage P0." },
      model_optimization: { name: "Optimisation modeles", notes: "Bonus direct a l'efficacite du calcul." },
      smart_grids: { name: "Reseaux intelligents", notes: "Prepare le super-reseau; reduit legerement les pertes." },
      energy_efficiency: { name: "Efficacite energetique", notes: "Ameliore revenus et sobriete." },
      cooling_efficiency: { name: "Refroidissement avance", notes: "Reduit la pression de refroidissement des centres de donnees." },
      compute_efficiency: { name: "Efficacite du calcul", notes: "Bonus fort a la progression AGI." },
      hyperscale_datacenters: { name: "Centres de donnees hyperscale", notes: "Debloque les grands centres de donnees." },
      geothermal_cooling: { name: "Geothermie refroidissement", notes: "Froid stable avance." },
      supergrid_european: { name: "Super-reseau europeen", notes: "Ameliore les echanges sans supprimer la contrainte geographique." },
      advanced_nuclear: { name: "Nucleaire avance", notes: "Renforce le socle long terme." },
      agi_sprint: { name: "Sprint AGI europeen", notes: "Fin de partie; accelere l'Europe sans ajouter de MW." }
    },
    events: {
      harsh_winter: {
        name: "Hiver rigoureux",
        alert: "Demande energetique - Europe -> hiver rigoureux -> temporiser les centres de donnees ou construire une production rapide"
      },
      heatwave: {
        name: "Canicule",
        alert: "Refroidissement sous tension - Europe -> canicule -> prioriser le refroidissement local"
      },
      drought: {
        name: "Secheresse",
        alert: "Eau limitee - {{region}} -> secheresse -> reduire la dependance fluviale/hydro"
      },
      storm: {
        name: "Tempete",
        alert: "Production variable - {{region}} -> tempete -> utiliser batteries/imports proches"
      },
      new_gpu: {
        name: "Nouveau GPU",
        alert: "Calcul ameliore - Europe -> nouveau GPU -> mieux exploiter les centres de donnees"
      },
      eu_ai_breakthrough: {
        name: "Percee IA europeenne",
        alert: "Percee IA - Europe -> bonus temporaire -> convertir le calcul en AGI maintenant"
      },
      us_algorithmic_revolution: {
        name: "Revolution algorithmique americaine",
        alert: "Pression USA - Global -> acceleration americaine -> accelerer recherche IA ou calcul"
      },
      gas_price_spike: {
        name: "Hausse du gaz",
        alert: "Gaz plus cher - Europe -> marche tendu -> diversifier la production propre"
      },
      nuclear_industrial_delay: {
        name: "Retard industriel nucleaire",
        alert: "Retard nucleaire - {{region}} -> chaine industrielle -> securiser des alternatives temporaires"
      },
      eu_nuclear_agreement: {
        name: "Accord nucleaire europeen",
        alert: "Accord nucleaire - Europe -> couts reduits -> planifier un socle long terme"
      },
      grid_maintenance_incident: {
        name: "Incident reseau majeur",
        alert: "Reseau instable - {{region}} -> incident -> reduire les imports lointains"
      },
      public_funding_wave: {
        name: "Financement public energie",
        alert: "Financement energie - Europe -> budget exceptionnel -> lancer une infrastructure longue"
      }
    },
    co2Tiers: {
      low: { notes: "Aucune consequence" },
      moderate: { notes: "Legere hausse des couts et du froid" },
      elevated: { notes: "Evenements climatiques plus frequents" },
      very_high: { notes: "Secheresses et penalites economiques" },
      critical: { notes: "Score tres degrade et ralentissement global" }
    },
    regions: {
      fr_nord: { name: "France Nord" },
      fr_sud: { name: "France Sud" },
      de_west: { name: "Allemagne Ouest" },
      de_east: { name: "Allemagne Est" },
      benelux: { name: "Benelux" },
      dk: { name: "Danemark" },
      se_south: { name: "Suede Sud" },
      se_north: { name: "Suede Nord" },
      fi: { name: "Finlande" },
      ie: { name: "Irlande" },
      es_north: { name: "Espagne Nord" },
      es_south: { name: "Espagne Sud" },
      pt: { name: "Portugal" },
      it_north: { name: "Italie Nord" },
      it_south_islands: { name: "Italie Sud & iles" },
      at: { name: "Autriche" },
      pl: { name: "Pologne" },
      cz: { name: "Tchequie" },
      sk: { name: "Slovaquie" },
      hu: { name: "Hongrie" },
      ro: { name: "Roumanie" },
      bg: { name: "Bulgarie" },
      gr: { name: "Grece" },
      eu_north_balkans: { name: "Balkans Nord UE" },
      baltic_north: { name: "Baltique Nord" },
      baltic_south: { name: "Baltique Sud" },
      si_hr: { name: "Slovenie-Croatie" },
      lux_saarlorlux: { name: "Luxembourg & SaarLorLux" },
      med_islands: { name: "Mediterranee insulaire" },
      de_north: { name: "Allemagne Nord" }
    }
  }
} as const;

export default fr;
