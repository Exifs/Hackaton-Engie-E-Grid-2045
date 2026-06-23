const en = {
  app: {
    title: "E-Grid 2045 | Play JS",
    description: "E-Grid 2045 JS playable prototype: energy, datacenters, cooling, network flows and AGI race.",
    canvasLabel: "Playable E-Grid 2045 map"
  },
  common: {
    actions: {
      close: "Close",
      build: "Build",
      cancel: "Cancel",
      demolish: "Demolish",
      research: "Research",
      pause: "Pause",
      play: "Play",
      fastForward: "Fast forward",
      maximumSpeed: "Maximum speed",
      understood: "Understood"
    },
    status: {
      available: "Available",
      locked: "Locked",
      unavailable: "Unavailable",
      active: "Active",
      queued: "Queued",
      complete: "Complete",
      stable: "Stable",
      low: "Low",
      critical: "Critical"
    },
    units: {
      month: "month",
      monthShort: "m",
      months: "months",
      week: "Week",
      slots: "slots",
      points: "pts",
      experiencePoints: "XP",
      gigawatts: "GW",
      thermalGigawatts: "GWth",
      eflops: "EFLOPS",
      exaflopsShort: "EF",
      millionCurrency: "{{value}}M",
      billionCurrency: "EUR {{value}}B",
      perMonth: "per month",
      speedMultiplier: "{{value}}x",
      tier: "tier"
    }
  },
  hud: {
    aria: {
      indicators: "Indicators",
      heatmaps: "Heatmaps",
      alerts: "Alerts",
      selectedRegion: "Selected region",
      construction: "Construction",
      resources: "Critical resources",
      simulationSpeed: "Simulation speed"
    },
    brand: {
      title: "E-GRID 2045",
      tagline: "Build. Optimize. Power Europe.",
      tooltip: "Build, optimize, and stabilize Europe's compute energy grid.",
      meta: "Strategic command layer"
    },
    resources: {
      title: "Critical resources",
      energy: "Energy",
      cooling: "Cooling",
      compute: "Compute",
      co2: "CO2",
      energyShort: "E",
      coolingShort: "C",
      computeShort: "P",
      storageShort: "S",
      researchersShort: "R&D",
      produced: "produced",
      consumed: "consumed",
      available: "available",
      used: "used",
      productionShort: "prod.",
      tooltip:
        "Energy {{energyProduced}} produced for {{energyConsumed}} consumed. Cooling {{coolingAvailable}} available for {{coolingUsed}} used. Compute {{compute}} and CO2 status {{co2Tier}}.",
      meta: "Energy, cooling, compute, CO2"
    },
    heatmaps: {
      energy: { label: "Energy", short: "PWR", body: "Shows production, demand, and energy deficit zones.", meta: "Power flow" },
      cooling: { label: "Cooling", short: "CLD", body: "Highlights cooling capacity and thermal reserves.", meta: "Cooling" },
      network: { label: "Network", short: "NET", body: "Prioritizes congestion, active links, and regional transfers.", meta: "Grid" },
      compute: { label: "Compute", short: "CPU", body: "Compares compute production and high AI-load regions.", meta: "Compute" },
      co2: { label: "CO2", short: "CO2", body: "Shows carbon pressure and climate risk.", meta: "Carbon" },
      none: { label: "Off", short: "OFF", body: "Disables the strategic heatmap overlay.", meta: "Clear map" }
    },
    categories: {
      all: "All",
      research: "Research",
      energy: "Energy",
      storage: "Storage",
      cooling: "Cooling",
      compute: "Datacenters",
      grid: "Grid & Network"
    },
    panels: {
      construction: "Construction",
      research: "Research",
      overview: "Overview",
      buildings: "Buildings",
      stats: "Stats",
      noActiveAlerts: "No active alerts",
      selectedRegionFallback: "Select region"
    },
    kpi: {
      budget: "Budget",
      budgetTooltip: "Available cash {{money}}. Monthly change {{trend}}{{income}}.",
      budgetMeta: "Economic projection",
      date: "Date",
      dateTooltip: "Current simulation window: {{date}}, week {{week}}.",
      dateMeta: "Campaign calendar",
      week: "Week {{week}}",
      monthSuffix: "month"
    },
    agi: {
      aria: "Europe versus USA AGI progress",
      title: "AGI race",
      body: "Europe {{eu}}% versus USA {{usa}}%. Ticks show global strategic progress.",
      progress: "AGI Progress",
      rival: "Rival Curve",
      europe: "Europe",
      usa: "USA",
      versus: "VS",
      leadMeta: "{{side}} +{{points}} pts"
    },
    time: {
      speed: "Simulation speed",
      tooltip: "Controls the simulation cadence.",
      meta: "Pause, play, fast forward",
      paused: "Simulation paused",
      realSpeed: "Actual speed: {{speed}}"
    },
    menu: {
      title: "Command menu",
      body: "Opens help and system commands available during the simulation.",
      meta: "Menu"
    },
    alerts: {
      noActive: "No active alerts",
      hide: "Hide alerts",
      close: "Close",
      view: "View",
      claim: "Claim",
      info: "Info",
      global: "Global",
      focusRegion: "Click to frame the region",
      systemInfo: "System information",
      viewTitle: "View {{title}}",
      titles: {
        blackoutSevere: "Blackout severe",
        energyDeficit: "Energy deficit",
        coolingInsufficient: "Cooling insufficient",
        networkSaturated: "Network saturated",
        slotsSaturated: "Slots saturated",
        researchersInsufficient: "Researchers insufficient",
        co2Elevated: "CO2 elevated",
        usaNearAgi: "USA near AGI"
      },
      bodies: {
        localEnergyDeficit: "local energy deficit",
        importsWeak: "imports too weak or distant",
        coolingExceeded: "datacenters exceed cooling",
        highLossFlows: "high-loss power flows",
        regionalCapacityFull: "regional capacity is full",
        needsExceedCapacity: "needs exceed capacity",
        fossilDependence: "fossil dependence rising",
        usCurveAhead: "US curve is pulling ahead"
      },
      actions: {
        buildLocalProduction: "build local production",
        buildNearbySurplus: "build nearby surplus",
        buildCooling: "build river, sea or air cooling",
        spreadProduction: "spread production or unlock supergrid",
        chooseAnotherRegion: "choose another region",
        buildUniversities: "build universities",
        shiftClean: "shift to nuclear and renewables",
        accelerateAi: "accelerate AI research"
      }
    },
    reasons: {
      selectRegion: "Select a region first.",
      unknownBuilding: "Unknown building.",
      researchTechnology: "Research {{technology}}.",
      regionTag: "Region lacks required tag.",
      regionPotential: "Regional potential too low.",
      budget: "Insufficient budget.",
      slots: "Not enough regional slots.",
      noRegion: "No region selected.",
      noBuildingSlot: "No building at this slot.",
      noConstructionSlot: "No construction at this slot.",
      unknownResearch: "Unknown research.",
      queued: "Queued.",
      unknownQueuedResearch: "Unknown queued research.",
      queuedCannotMoveHigher: "Queued research cannot move higher.",
      addToQueue: "Add to the research queue.",
      readyResearch: "Ready to launch.",
      completed: "Completed.",
      inProgress: "Research in progress.",
      zeroRate: "Rate 0: {{reason}}",
      outputUnavailable: "research output unavailable.",
      queuePosition: "Queue #{{position}}.",
      requires: "Requires {{name}}.",
      researchCompleted: "Research already completed.",
      researchActive: "Research already active.",
      researchQueued: "Research already queued.",
      requiresAiCenter: "Requires an active AI Research Center.",
      requiresEnergyCenter: "Requires an active Energy Research Center.",
      requiresAnyResearchCenter: "Requires an active Energy Research Center or AI Research Center."
    },
    region: {
      resizeRight: "Resize right panel",
      noConstruction: "No construction",
      noDemolition: "No demolition",
      noAssets: "No assets",
      buildingSlots: "Building slots",
      constructionSite: "Construction",
      demolition: "Demolition",
      energy: "Energy",
      cooling: "Cooling",
      compute: "Compute",
      overview: "Overview",
      overviewTooltip: "Synthetic view",
      overviewBody: "Slots, statuses, and main action",
      buildingsTooltip: "Assets and queues",
      buildingsBody: "Assets, construction, and demolition",
      statsTooltip: "Regional indicators",
      statsBody: "Capacity, reserves, and tags",
      region: "Region",
      regionLevel: "Region level",
      views: "Region views",
      active: "Active",
      changeView: "Change view",
      manage: "Manage region",
      manageTooltip: "Open the construction dock for {{region}}.",
      freeSlots: "{{count}} free slots",
      slots: "Slots",
      free: "{{count}} free",
      levelXp: "Level XP",
      level: "Level {{level}}",
      energyReserve: "Energy reserve",
      producedShort: "{{value}} prod",
      coolingReserve: "Cooling reserve",
      capacityShort: "{{value}} capacity",
      computeDeficit: "Compute deficit",
      computeReserve: "Compute reserve",
      supplyShort: "{{value}} supply",
      tags: "Tags",
      none: "None",
      extraConstruction: "more construction",
      viewAllConstruction: "View all construction",
      historyPending: "History pending",
      historyAria: "Regional history",
      resourceHistory: "Resource history",
      historyResource: "Historical resource",
      historyPeriod: "Historical period",
      historyEmpty: "Advance a few months to read a trend.",
      supply: "Supply",
      usage: "Usage",
      export: "Export",
      importDeficit: "Import/deficit",
      evolution: "{{label}} evolution",
      remainingMonths: "{{months}}m remaining",
      cancelTitle: "Cancel {{name}}",
      demolitionTitle: "Demolition {{name}}",
      localUse: "Local use",
      balance: "Balance"
    },
    dock: {
      resizeBottom: "Resize bottom dock",
      panel: "Bottom panel",
      close: "Close",
      build: "Build"
    },
    construction: {
      categories: "Building categories",
      showOnly: "Show only {{label}}.",
      options: "{{count}} options",
      unlockRequired: "To unlock",
      lockedOptions: "Options locked by research or regional potential.",
      researchShort: "Res.",
      available: "Available",
      locked: "Locked",
      techOk: "Tech OK",
      agiBoost: "AGI+",
      showLocked: "Show locked",
      showLockedBody: "Includes buildings locked by research, tags, or regional potential in the construction list.",
      filterActive: "Filter active",
      filterInactive: "Filter inactive",
      infrastructure: "Infrastructure",
      regionalInfrastructure: "Regional infrastructure.",
      dismantle: "Dismantle",
      dismantleTitle: "Dismantle {{name}} ({{cost}}M)",
      costMonthsSlots: "{{cost}}M - {{months}}m - {{slots}} slots",
      energyDemand: "-{{value}} Energy",
      coolingDemand: "-{{value}} Cooling",
      researchersDemand: "{{value}} researchers",
      requiredResearch: "Required research",
      requiredPotential: "Required potential",
      regionTags: "Region tags",
      tiers: "Tiers",
      variable: "Variable",
      variableProduction: "Variable production"
    },
    researchPanel: {
      showUnavailable: "Show unavailable",
      showUnavailableBody: "Includes unavailable research to show what blocks launch.",
      noActive: "No active research",
      chooseTier: "Choose a tier to start",
      queue: "Queue",
      queueAria: "Research queue",
      noQueued: "No research queued",
      required: "Research required",
      unlocks: "Unlocks {{name}}",
      moveUp: "Move up {{name}}",
      remove: "Remove {{name}}",
      up: "Up",
      removeShort: "Remove",
      totalCost: "Total cost",
      accumulatedPoints: "Accumulated points",
      monthlyProduction: "Monthly production",
      eta: "Estimated time remaining",
      etaShort: "ETA",
      etaComplete: "complete",
      zeroRateShort: "rate 0",
      branchTier: "Branch and tier",
      tierLabel: "T{{tier}}",
      branchTierShort: "{{branch}} T{{tier}}",
      techRequirement: "Tech {{technology}}",
      branches: {
        ai: "AI",
        energy: "Energy",
        infrastructure: "Infrastructure"
      },
      prerequisite: "Technology prerequisite",
      blocker: "Blocking condition",
      status: "Status",
      effect: "Effect",
      researchEffect: "Research effect",
      buildingUnlocked: "Building unlocked",
      unlock: "Unlock"
    },
    gridOverview: {
      title: "Grid overview",
      meta: "Compact network map",
      tooltip: "{{active}} active links. {{congested}} congestions. Energy flow {{consumed}} / {{produced}} GW.",
      powerFlow: "Power flow",
      dataFlow: "Data flow",
      congestion: "Congestion",
      planned: "Planned"
    },
    tooltipSections: {
      produced: "Produces",
      consumed: "Consumes",
      constraints: "Constraints",
      points: "Points",
      conditions: "Conditions",
      unlocks: "Unlocks",
      effect: "Effect",
      price: "Price",
      construction: "Construction",
      footprint: "Footprint",
      energyProduction: "Energy production",
      coolingProduction: "Cooling production",
      computeCapacity: "Compute capacity",
      gridStorage: "Grid storage",
      researchers: "Researchers",
      energyNeed: "Energy need",
      coolingNeed: "Cooling need",
      computeNeed: "Compute need",
      requiredResearchers: "Required researchers",
      carbonPressure: "Carbon pressure"
    },
    map: {
      zoomLevel: "Zoom {{value}}%",
      resetZoom: "Reset",
      labels: {
        ireland: "IRELAND",
        unitedKingdom: "UNITED\nKINGDOM",
        norway: "NORWAY",
        sweden: "SWEDEN",
        finland: "FINLAND",
        denmark: "DENMARK",
        belgium: "BELGIUM",
        germany: "GERMANY",
        france: "FRANCE",
        spain: "SPAIN",
        portugal: "PORTUGAL",
        switzerland: "SWITZERLAND",
        italy: "ITALY",
        austria: "AUSTRIA",
        czechia: "CZECHIA",
        poland: "POLAND",
        slovakia: "SLOVAKIA",
        hungary: "HUNGARY",
        romania: "ROMANIA",
        bulgaria: "BULGARIA",
        greece: "GREECE",
        northSea: "NORTH\nSEA",
        balticSea: "BALTIC\nSEA",
        atlanticOcean: "ATLANTIC\nOCEAN",
        mediterraneanSea: "MEDITERRANEAN\nSEA",
        blackSea: "BLACK\nSEA"
      }
    }
  },
  onboarding: {
    ui: {
      briefing: "Briefing",
      consequence: "Consequence",
      understood: "Understood",
      next: "Next",
      previous: "Previous",
      skip: "Skip",
      role: "Network Operations Director",
      command: "E-Grid Command",
      objectiveList: "Current objective",
      completeMark: "OK"
    },
    mission: {
      title: "Mission",
      body:
        "I am taking over. European mission: keep the initiative against the USA in the AGI race. Compute is the priority, but it is worthless without energy, cooling, a stable grid, and available researchers.",
      objective: "Read the mission, then continue.",
      checklist: "Understand the Europe / USA race"
    },
    resources: {
      title: "Key resources",
      body:
        "Read the gauges like a control room. Researchers are human R&D capacity. Research points fund technologies. Compute pushes AGI. Energy, cooling, network, and CO2 set your limits.",
      objective: "Observe energy, researchers, compute, cooling, and CO2.",
      checklist: "Identify the critical KPIs"
    },
    university: {
      title: "University",
      body:
        "Start with the human pipeline. Researchers are global capacity: without them, datacenters, R&D centers, and advanced power plants may run below capacity.",
      objective: "Build a university in an urban or research-oriented region.",
      consequence:
        "The region starts strengthening the researcher pipeline. Advanced infrastructure has less risk of running below capacity.",
      checklist: "Build a university"
    },
    coolingOverlay: {
      title: "Cooling overlay",
      body:
        "Before servers, inspect cooling. Cooling is a location constraint: cold, coastal, or river regions support datacenters better.",
      objective: "Activate the Cooling overlay.",
      consequence: "You can now see where datacenters will be cheapest to sustain.",
      checklist: "Activate the Cooling overlay"
    },
    starterEnergy: {
      title: "Starter energy",
      body:
        "Secure an initial power margin. Gas starts fast and stabilizes the grid, but increases CO2. Solar and wind are cleaner, with variable production.",
      objective: "Build gas, solar, or onshore wind.",
      consequence: "The region gains power margin, but watch CO2 if you chose gas.",
      checklist: "Build power production"
    },
    coolingBuild: {
      title: "Cooling",
      body:
        "Build cooling before stacking servers. Cooling protects datacenter efficiency and prevents compute from becoming too expensive to maintain.",
      objective: "Build a cooling solution compatible with the region.",
      consequence: "Available cooling increases: future datacenters will keep better efficiency.",
      checklist: "Build cooling"
    },
    datacenter: {
      title: "Datacenter",
      body:
        "A datacenter turns energy, cooling, and researchers into compute. Compute mainly accelerates AGI progress; if one pillar is missing, it underperforms.",
      objective: "Build a standard datacenter.",
      consequence: "Compute increases. It can accelerate AGI if energy, cooling, and researchers keep up.",
      checklist: "Build a standard datacenter"
    },
    research: {
      title: "AI Research Center",
      body:
        "The AI Research Center turns compute and researchers into AGI progress. It is the direct accelerator in the race: it only pays off if energy, cooling, and researchers keep up.",
      objective: "Build an AI Research Center.",
      consequence:
        "Europe's AGI path gains a dedicated engine: compute can now be converted more efficiently into strategic advantage.",
      checklist: "Build an AI Research Center"
    },
    energyResearch: {
      title: "Energy Research Center",
      body:
        "Then add the Energy Research Center. It produces technology points that unlock batteries, the supergrid, offshore renewables, and advanced nuclear.",
      objective: "Build an Energy Research Center.",
      consequence:
        "You open the energy path: upcoming research can transform your grid, storage, and low-carbon generation.",
      checklist: "Build an Energy Research Center"
    },
    networkOverlay: {
      title: "Network overlay",
      body:
        "Control the grid. Imports can save a region, but losses rise with distance and volume. Saturation will cut your scale-up.",
      objective: "Activate the Network or Energy overlay.",
      consequence: "You can now spot import dependencies and loss risks.",
      checklist: "Activate the Network or Energy overlay"
    },
    complete: {
      title: "Guidance complete",
      body:
        "First loop started. From here, seek strategic autonomy: nuclear, storage, supergrid, renewables, and R&D must arrive before shortages.",
      objective: "Close the tutorial.",
      checklist: "Continue independently"
    }
  },
  content: {
    buildings: {
      university: { name: "University", notes: "Produces researchers; natural bonus in research regions." },
      ai_research_center: { name: "AI Research Center", notes: "Converts compute and researchers into AGI progress." },
      energy_research_center: { name: "Energy Research Center", notes: "Unlocks batteries, supergrid, advanced nuclear, and more." },
      datacenter_standard: { name: "Standard Datacenter", notes: "Available from 2025; depends strongly on regional cooling." },
      datacenter_hyperscale: { name: "Hyperscale Datacenter", notes: "Mid/late-game; avoids brute force without grid or cooling." },
      gas_power_plant: { name: "Gas Power Plant", notes: "Fast solution; increases CO2 pressure and climate crisis risk." },
      nuclear_power_plant: { name: "Nuclear Power Plant", notes: "Very strong long-term base; too slow to correct an immediate crisis." },
      wind_onshore: { name: "Onshore Wind", notes: "Variable, but fast and clean." },
      wind_offshore: { name: "Offshore Wind", notes: "Locked at P0 start; more stable than onshore and strengthens coastal regions." },
      solar_farm: { name: "Solar Farm", notes: "Excellent in the south, variable, and inexpensive." },
      hydro_dam: { name: "Hydro Dam", notes: "Stable; vulnerable to droughts." },
      battery_storage: { name: "Battery Storage", notes: "Dampens renewable fluctuations." },
      air_cooling: { name: "Air Cooling", notes: "Works everywhere, simple, but consumes energy." },
      river_cooling: { name: "River Cooling", notes: "Highly efficient, but vulnerable to droughts." },
      sea_cooling: { name: "Sea Cooling", notes: "Excellent efficiency, but constrains datacenter location." },
      geothermal_cooling: { name: "Geothermal Cooling", notes: "Stable, advanced, and expensive." }
    },
    effects: {
      unlock_building: "Unlock building",
      ai_efficiency_bonus: "AI efficiency",
      distance_efficiency_bonus: "Distance efficiency",
      monthly_income_bonus_and_energy_demand_reduction: "Income bonus and lower energy demand",
      cooling_demand_reduction: "Cooling demand",
      network_transfer_bonus: "Network transfer bonus",
      nuclear_cost_time_output_modifiers: "Nuclear cost, time, and output",
      agi_gain_multiplier: "AGI gain multiplier"
    },
    effectValues: {
      battery_storage: "Battery Storage",
      wind_offshore: "Offshore Wind",
      datacenter_hyperscale: "Hyperscale Datacenter",
      geothermal_cooling: "Geothermal Cooling",
      income_bonus_30_energy_demand_pct_minus_10: "+30 income; -10% energy demand",
      distance_efficiency_pct_15_volume_threshold_pct_25: "+15% distance efficiency; +25% volume threshold",
      cost_pct_minus_10_construction_pct_minus_10_output_pct_15: "-10% cost; -10% construction time; +15% output"
    },
    potentials: {
      cooling: "Cooling potential",
      hydro: "Hydro potential",
      nuclear: "Nuclear potential",
      research: "Research potential",
      solar: "Solar potential",
      wind_offshore: "Offshore wind potential",
      wind_onshore: "Onshore wind potential"
    },
    regionTags: {
      atlantique: "Atlantic",
      central: "Central",
      charbon: "Coal",
      dense: "Dense",
      fleuve: "River",
      foret: "Forest",
      froid: "Cold",
      hydro: "Hydro",
      iles: "Islands",
      industriel: "Industrial",
      littoral: "Coastal",
      mer_du_nord: "North Sea",
      mer_noire: "Black Sea",
      montagne: "Mountain",
      peu_dense: "Low density",
      plaine: "Plain",
      sec: "Dry",
      solaire: "Solar",
      sud: "South",
      urbain: "Urban"
    },
    technologies: {
      batteries: { name: "Batteries", notes: "Unlocks storage to smooth renewables." },
      offshore_wind: { name: "Industrial Offshore Wind", notes: "Unlocks offshore wind, locked at P0 start." },
      model_optimization: { name: "Model Optimization", notes: "Direct bonus to compute efficiency." },
      smart_grids: { name: "Smart Grids", notes: "Prepares the Supergrid and slightly reduces losses." },
      energy_efficiency: { name: "Energy Efficiency", notes: "Improves revenue and energy sobriety." },
      cooling_efficiency: { name: "Advanced Cooling", notes: "Reduces datacenter cooling pressure." },
      compute_efficiency: { name: "Compute Efficiency", notes: "Strong bonus to AGI progress." },
      hyperscale_datacenters: { name: "Hyperscale Datacenters", notes: "Unlocks large datacenters." },
      geothermal_cooling: { name: "Geothermal Cooling", notes: "Stable advanced cooling." },
      supergrid_european: { name: "European Supergrid", notes: "Improves transfers without removing geography constraints." },
      advanced_nuclear: { name: "Advanced Nuclear", notes: "Strengthens the long-term power base." },
      agi_sprint: { name: "European AGI Sprint", notes: "Late-game accelerator for Europe without adding MW." }
    },
    events: {
      harsh_winter: {
        name: "Harsh Winter",
        alert: "Energy demand - Europe -> harsh winter -> slow datacenters or build fast generation"
      },
      heatwave: {
        name: "Heatwave",
        alert: "Cooling under strain - Europe -> heatwave -> prioritize local cooling"
      },
      drought: {
        name: "Drought",
        alert: "Limited water - {{region}} -> drought -> reduce river/hydro dependency"
      },
      storm: {
        name: "Storm",
        alert: "Variable production - {{region}} -> storm -> use batteries/nearby imports"
      },
      new_gpu: {
        name: "New GPU",
        alert: "Improved compute - Europe -> new GPU -> get more from datacenters"
      },
      eu_ai_breakthrough: {
        name: "European AI Breakthrough",
        alert: "AI breakthrough - Europe -> temporary bonus -> convert compute into AGI now"
      },
      us_algorithmic_revolution: {
        name: "US Algorithmic Revolution",
        alert: "US pressure - Global -> American acceleration -> accelerate AI research or compute"
      },
      gas_price_spike: {
        name: "Gas Price Spike",
        alert: "More expensive gas - Europe -> tight market -> diversify clean generation"
      },
      nuclear_industrial_delay: {
        name: "Nuclear Industrial Delay",
        alert: "Nuclear delay - {{region}} -> industrial chain -> secure temporary alternatives"
      },
      eu_nuclear_agreement: {
        name: "European Nuclear Agreement",
        alert: "Nuclear agreement - Europe -> lower costs -> plan long-term baseload"
      },
      grid_maintenance_incident: {
        name: "Major Grid Maintenance Incident",
        alert: "Unstable grid - {{region}} -> incident -> reduce long-distance imports"
      },
      public_funding_wave: {
        name: "Public Energy Funding",
        alert: "Energy funding - Europe -> exceptional budget -> launch long infrastructure"
      }
    },
    co2Tiers: {
      low: { notes: "No consequence" },
      moderate: { notes: "Slight cost/cooling increase" },
      elevated: { notes: "More frequent climate events" },
      very_high: { notes: "Droughts and economic penalties" },
      critical: { notes: "Severely degraded score and global slowdown" }
    },
    regions: {
      fr_nord: { name: "Northern France" },
      fr_sud: { name: "Southern France" },
      de_west: { name: "Western Germany" },
      de_east: { name: "Eastern Germany" },
      benelux: { name: "Benelux" },
      dk: { name: "Denmark" },
      se_south: { name: "Southern Sweden" },
      se_north: { name: "Northern Sweden" },
      fi: { name: "Finland" },
      ie: { name: "Ireland" },
      es_north: { name: "Northern Spain" },
      es_south: { name: "Southern Spain" },
      pt: { name: "Portugal" },
      it_north: { name: "Northern Italy" },
      it_south_islands: { name: "Southern Italy & Islands" },
      at: { name: "Austria" },
      pl: { name: "Poland" },
      cz: { name: "Czechia" },
      sk: { name: "Slovakia" },
      hu: { name: "Hungary" },
      ro: { name: "Romania" },
      bg: { name: "Bulgaria" },
      gr: { name: "Greece" },
      eu_north_balkans: { name: "Northern EU Balkans" },
      baltic_north: { name: "Northern Baltics" },
      baltic_south: { name: "Southern Baltics" },
      si_hr: { name: "Slovenia-Croatia" },
      lux_saarlorlux: { name: "Luxembourg & SaarLorLux" },
      med_islands: { name: "Mediterranean Islands" },
      de_north: { name: "Northern Germany" }
    }
  }
} as const;

export default en;
