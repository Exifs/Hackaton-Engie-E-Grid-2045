export const ONBOARDING_COPY = {
  mission: {
    title: "Mission",
    body:
      "Objectif : depasser les USA dans la course a l'AGI. Chaque mois compte, mais le vrai defi n'est pas seulement de construire du compute : il faut l'alimenter, le refroidir et garder le reseau stable.",
    objective: "Lire la mission puis continuer."
  },
  resources: {
    title: "Ressources cles",
    body:
      "Surveille ces indicateurs en permanence. Les chercheurs font tourner les infrastructures avancees, l'energie alimente tout, le froid conditionne les datacenters, le compute accelere l'AGI, et le CO2 penalise le long terme.",
    objective: "Observer energie, chercheurs, compute, froid et CO2."
  },
  university: {
    title: "Universite",
    body:
      "Commence par le capital humain. Sans chercheurs, les datacenters, centres de recherche et centrales complexes fonctionneront au ralenti.",
    objective: "Construire une universite dans une region urbaine ou orientee recherche."
  },
  coolingOverlay: {
    title: "Overlay refroidissement",
    body:
      "Cherche le froid avant les serveurs. Les datacenters produisent du compute, mais consomment beaucoup de refroidissement. Les regions froides, littorales ou fluviales sont de meilleurs candidats.",
    objective: "Activer l'overlay Froid."
  },
  starterEnergy: {
    title: "Energie de depart",
    body:
      "Securise l'electricite. Le gaz demarre vite mais augmente le CO2. Le solaire et l'eolien sont plus propres mais variables.",
    objective: "Construire du gaz, du solaire ou de l'eolien terrestre."
  },
  coolingBuild: {
    title: "Refroidissement",
    body:
      "Prepare l'infrastructure avant le datacenter. Un datacenter sans froid disponible devient inefficace.",
    objective: "Construire une solution de refroidissement compatible avec la region."
  },
  datacenter: {
    title: "Datacenter",
    body:
      "Le datacenter convertit energie, froid et chercheurs en compute. Ce compute sert ensuite a accelerer l'AGI ou a financer des recherches plus efficaces.",
    objective: "Construire un datacenter standard."
  },
  research: {
    title: "Recherche",
    body:
      "Choisis une trajectoire. La recherche IA accelere la victoire. La recherche energie rend le mix plus robuste. La force brute ne suffit pas : l'efficacite peut battre l'expansion aveugle.",
    objective: "Construire un centre IA ou energie, ou lancer une recherche disponible."
  },
  networkOverlay: {
    title: "Overlay reseau",
    body:
      "Attention aux imports lointains. L'energie peut circuler entre regions, mais les pertes augmentent avec la distance et le volume.",
    objective: "Activer l'overlay Reseau ou Energie."
  },
  complete: {
    title: "Fin du guidage",
    body:
      "Tu as lance la premiere boucle. Anticipe maintenant : nucleaire, stockage, supergrid, renouvelables et recherche devront arriver avant les penuries d'energie ou de chercheurs.",
    objective: "Fermer le tutoriel."
  }
} as const;
