import type { ReactNode } from 'react'
import { messages } from '../i18n'
import { Kbd } from '../components/ui'
import { H, P, UL } from '../components/HelpBlocks'
import { SUPPORT_ENABLED } from './support'

/*
 * Texts of the help centre and of the shortcut hints.
 *
 * Key tokens given to <Kbd> (mod, shift, alt, Entrée, Échap, Z…) are hint
 * identifiers, not texts: <Kbd> names them for the OS and language.
 * Section bodies are functions so the hint rows (built in help.tsx) can be
 * slotted in without an import cycle.
 */

export const t = messages(
  {
    hints: {
      brushSize: 'taille du pinceau',
      brushSizeTitle: 'Les deux touches à droite de P (réduire / agrandir)',
      brushWheel: 'taille',
      erase: 'gommer',
      clearArea: 'vider la zone',
      pickThread: 'prendre le fil d’un point',
      angles45: 'angles de 45°',
      square: 'carré parfait',
      circle: 'cercle parfait',
      addArea: 'ajouter une zone',
      removeArea: 'retirer une zone',
      move: 'déplacer',
      apply: 'valider',
      cancel: 'annuler',
      movePreview: 'déplacer l’aperçu',
      invert: 'inverser',
      motifThumb: 'une vignette : aperçu à placer',
      pan: 'déplacer',
      zoom: 'zoom',
      hand: 'main',
      floatingMove: 'déplacer (Maj : 10 pts)',
      floatingAlign: 'en glissant : garder l’alignement',
    },
    toolNames: {
      pencil: 'Crayon (B)',
      eraser: 'Gomme (E)',
      line: 'Ligne (L)',
      rect: 'Rectangle (R)',
      ellipse: 'Cercle / ellipse (C)',
      text: 'Texte (T)',
      select: 'Sélection (S)',
      fill: 'Pot de peinture (G)',
      picker: 'Pipette (I)',
      progress: 'Marquer les points brodés (P)',
      motif: 'Motifs (M)',
    },
    toolText: {
      pencil:
        'Dessine avec le fil actif. Pinceau carré ou rond, de 1 à 15 points, réglable dans la barre de l’outil ; chaque outil garde son propre réglage.',
      eraser: 'Efface les points, avec son propre pinceau carré ou rond.',
      fill: 'Remplit d’un clic toute la zone de la même couleur avec le fil actif.',
      picker: 'Prend le fil d’un point de la grille pour en faire le fil actif.',
      line: 'Trace une ligne droite : glissez puis relâchez. Elle arrive en aperçu : déplacez-la, redimensionnez-la, tournez-la, puis validez (Entrée).',
      rect: 'Trace un rectangle, en contour ou plein (barre de l’outil). Il arrive en aperçu à placer et redimensionner, puis à valider (Entrée) ; tracer la forme suivante valide la précédente.',
      ellipse:
        'Trace un cercle ou une ellipse, en contour ou plein. Aperçu à placer et redimensionner (le trait reste net), puis à valider (Entrée).',
      select:
        'Sélectionne une zone, de forme libre, à déplacer, copier, transformer. Voir la rubrique « Sélection et transformations ».',
      text: 'Transforme un texte en points. Voir la rubrique « Texte ».',
      progress:
        'Coche les points déjà brodés. En mode Auto, partir d’un point validé le dévalide. Voir « Suivi de broderie ».',
      motif:
        'Ouvre la bibliothèque de motifs (lettres, bordures, fleurs…) : un clic sur une vignette pose le motif en aperçu à placer, puis à valider. Voir « Bibliothèque de motifs ».',
    },
    shortcuts: {
      undo: 'Annuler',
      redo: 'Rétablir',
      copy: 'Copier la sélection',
      cut: 'Couper la sélection',
      paste: 'Coller (aussi dans un autre onglet)',
      selectAll: 'Tout sélectionner',
      deselect: 'Désélectionner',
      exportProject: 'Exporter le projet en .json',
      print: 'Imprimer / PDF',
      clear: 'Effacer la sélection (ou Retour arrière)',
      applyPreview: 'Valider l’aperçu (collage, texte, transformation)',
      cancelPreview: 'Annuler l’aperçu / désélectionner / fermer',
      moveSelection: 'Déplacer la sélection ou l’aperçu (Maj : 10 points)',
      brushKeys: 'Réduire / agrandir le pinceau (les deux touches à droite de P)',
      brushWheel: 'Changer la taille du pinceau',
      zoom: 'Zoomer / dézoomer (aussi + et − du pavé numérique)',
      hand: 'Main : déplacer la vue en glissant (ou glisser avec le clic droit ou du milieu)',
      wheelZoom: 'Zoomer sous le curseur (ou pincer sur le trackpad)',
      wheelSideways: 'Faire défiler la vue horizontalement',
      redoAlt: 'Rétablir (autre raccourci)',
      shapeErase: 'Ligne, rectangle, cercle : gommer la forme tracée',
      help: 'Ouvrir l’aide (ou ?)',
      overlay: 'Afficher / masquer le calque de référence',
      panels: 'Masquer / afficher les panneaux latéraux (dessin plein écran)',
      pencil: 'Crayon',
      eraser: 'Gomme',
      fill: 'Pot de peinture',
      picker: 'Pipette',
      line: 'Ligne',
      rect: 'Rectangle',
      ellipse: 'Cercle / ellipse',
      select: 'Sélection',
      text: 'Texte',
      progress: 'Marquer les points brodés',
      motif: 'Motifs (bibliothèque)',
    },
    sections: {
      start: {
        title: 'Prise en main',
        keywords: 'débuter commencer nouveau projet créer image zoom annuler',
        body: (viewHints: ReactNode): ReactNode => (
          <>
            <H>1. Créer un projet</H>
            <P>
              Une seule fenêtre <b>Créer</b> : choisissez le <b>type</b> (projet ou motif de bibliothèque)
              puis la <b>source</b>. Les entrées du menu Fichier et du « + » des onglets ne sont que des
              raccourcis qui l’ouvrent déjà réglée.
            </P>
            <UL>
              <li>
                <b>Vierge</b> : une grille vide (taille en points, toile, nombre de points par pouce ou par
                cm).
              </li>
              <li>
                <b>Une grille PDF</b> exportée par une autre application, ou <b>un fichier .json</b> exporté.
              </li>
              <li>
                <b>Une image</b> : convertit une photo ou un dessin en points de croix. Style{' '}
                <b>Illustration</b> pour les dessins et aplats (contours nets, chaque point prend la
                couleur majoritaire de sa zone) ou <b>Photo</b> pour les dégradés. <b>Recadrer</b>{' '}
                enlève par exemple les boutons d’une capture d’écran ; « Simplifier les petites zones »
                fond les petites taches dans la couleur voisine ; par défaut, le fond n’est retiré que
                depuis les bords (« Retirer aussi le fond à l’intérieur du motif » pour tout enlever).
              </li>
              <li>Chaque nouveau projet s’ouvre dans son propre onglet.</li>
            </UL>
            <H>2. Choisir ses fils</H>
            <P>
              Ouvrez le catalogue DMC depuis la palette : un clic ajoute un fil, un second clic le retire.
              Cliquez ensuite un fil de la palette pour le rendre actif.
            </P>
            <H>3. Dessiner</H>
            <P>
              Choisissez un outil dans la colonne de gauche : ses réglages apparaissent dans la barre juste
              au-dessus de la grille, avec ses raccourcis. Les pastilles de raccourcis{' '}
              <b>s’allument quand la touche est enfoncée</b>.
            </P>
            <H>4. Où trouver quoi</H>
            <UL>
              <li>
                <b>En haut</b> : le menu Fichier, le nom du projet et la roue de ses paramètres (taille de
                la grille, toile), « Imprimer / PDF », le thème (clair, sombre ou auto), la langue (FR, EN,
                ES, DE ; la page se recharge sans rien perdre), « Aide »{SUPPORT_ENABLED ? <> et « Soutenir » (Ko-fi)</> : null}.
              </li>
              <li>
                <b>Barre de la planche</b> (sous les onglets) : annuler, zoom, affichage, grille, planches
                d’impression et <b>Calque</b> de référence (l’œil l’affiche ou le masque).
              </li>
              <li>
                <b>Barre d’état</b> (tout en bas) : position du curseur, taille de la grille, taille finie et
                toile, points posés et brodés, nombre de fils, raccourcis pour se déplacer, état de
                l’enregistrement et, au besoin, un rappel de sauvegarde.
              </li>
              <li>
                <b>Barre de l’outil</b> : les réglages simples de l’outil actif (taille, forme…).
              </li>
              <li>
                <b>À gauche, à côté des outils</b> : les réglages détaillés du Texte, de la Sélection (ou
                d’un aperçu à placer) et la bibliothèque de Motifs. Le chevron le replie en une fine bande.
              </li>
              <li>
                <b>À droite</b> : le projet, toujours au même endroit — fils, filtre par couleur, suivi de
                broderie. Cliquez un titre pour replier sa section ; les longues listes défilent.
              </li>
              <li>
                <b>Bibliothèque de motifs</b> : outil Motifs (<Kbd k="M" />), pour insérer lettres,
                bordures et autres éléments réutilisables.
              </li>
              <li>
                <Kbd k="Tab" /> masque ou affiche les deux panneaux pour dessiner sur toute la fenêtre.
              </li>
            </UL>
            <H>5. Se déplacer</H>
            {viewHints}
            <P>
              Glisser avec le clic droit ou le bouton du milieu déplace aussi la vue ;{' '}
              <Kbd k="shift" /> + molette la fait défiler horizontalement ; pincer sur le trackpad zoome.
            </P>
            <H>6. Annuler</H>
            <P>
              <Kbd k="mod" /> + <Kbd k="Z" /> annule, <Kbd k="mod" /> + <Kbd k="shift" /> + <Kbd k="Z" />{' '}
              (ou <Kbd k="mod" /> + <Kbd k="Y" />) rétablit. Chaque onglet garde son propre historique.
            </P>
          </>
        ),
      },
      tool: {
        title: (name: string) => `Outil : ${name}`,
        keywords: (tool: string) => `outil ${tool} pinceau taille raccourci`,
        shortcuts: 'Raccourcis',
      },
      selection: {
        title: 'Sélection et transformations',
        keywords: 'sélection déplacer copier coller poignée rotation miroir flip réinitialiser aperçu valider',
        body: (floatingHints: ReactNode): ReactNode => (
          <>
            <H>Sélectionner</H>
            <UL>
              <li>Glissez pour tracer une zone ; un simple clic désélectionne.</li>
              <li>
                <Kbd k="shift" /> + glisser ajoute une zone, <Kbd k="alt" /> + glisser en retire : la
                sélection peut avoir n’importe quelle forme.
              </li>
              <li>
                <Kbd k="mod" /> + <Kbd k="A" /> tout sélectionner, <Kbd k="mod" /> + <Kbd k="D" /> ou{' '}
                <Kbd k="Échap" /> désélectionner.
              </li>
              <li>Suppr ou Retour arrière efface les points sélectionnés.</li>
            </UL>
            <H>L’aperçu : rien n’est écrit avant de valider</H>
            <P>
              Dès que vous déplacez ou transformez une sélection (ou collez, intégrez un modèle, tapez un
              texte), elle devient un <b>aperçu semi-transparent</b>. L’original reste visible, atténué.{' '}
              <Kbd k="Entrée" /> ou <b>Valider</b> écrit le résultat en une seule étape d’annulation ;{' '}
              <Kbd k="Échap" /> ou <b>Annuler</b> remet tout comme avant.
            </P>
            <H>Déplacer</H>
            {floatingHints}
            <H>Transformer</H>
            <UL>
              <li>
                <b>Poignées</b> : les coins gardent les proportions (<Kbd k="shift" /> pour libérer), les
                côtés changent une seule dimension.
              </li>
              <li>
                Tirer un bord <b>au-delà du bord opposé</b> retourne le motif (miroir).
              </li>
              <li>
                <b>Rotation</b> : glissez juste à l’extérieur d’un coin (curseur en flèche courbe), par
                quarts de tour.
              </li>
              <li>
                La <b>barre rapide</b> sous la sélection propose miroirs, rotation, ÷2, ×2,{' '}
                <b>Réinitialiser</b> (revenir à l’état de départ) et Valider / Annuler.
              </li>
              <li>Les champs de taille du panneau Sélection s’appliquent en direct, sans perte.</li>
            </UL>
            <H>Copier entre projets</H>
            <P>
              Copiez dans un onglet, collez dans un autre : les fils sont retrouvés par leur référence DMC
              (ajoutés s’ils manquent, retirés si vous annulez).
            </P>
          </>
        ),
      },
      text: {
        title: 'Texte',
        keywords: 'texte police google font système arc contour ombre cadre souligné majuscules alignement seuil',
        body: (): ReactNode => (
          <>
            <P>
              Avec l’outil Texte, tapez dans le panneau à gauche, à côté des outils : le texte apparaît <b>en direct sur la
              grille</b> comme un aperçu, avec tous les outils de la sélection (glisser, poignées,
              rotation, miroir). <Kbd k="Entrée" /> ou « Valider » l’écrit.
            </P>
            <H>Polices</H>
            <UL>
              <li>Tout le catalogue Google Fonts (plus de 1 800 polices) avec recherche et catégories.</li>
              <li>
                Onglet <b>Système</b> : les polices installées sur l’ordinateur. Dans Chrome et
                l’application de bureau, « Lister toutes mes polices installées » les affiche toutes.
              </li>
              <li>Les polices « Pixel » restent nettes même en très petit.</li>
            </UL>
            <H>Taille et rendu</H>
            <UL>
              <li>
                <b>Hauteur</b> en points, <b>espacement</b> entre lettres, <b>interligne</b>.
              </li>
              <li>
                <b>Seuil</b> : plus il est bas, plus les traits fins sont gardés (mais plus le texte
                s’épaissit).
              </li>
            </UL>
            <H>Mise en forme et effets</H>
            <UL>
              <li>Alignement gauche / centré / droite, majuscules, souligné, barré.</li>
              <li>
                <b>Arc</b> : de creux à bombé.
              </li>
              <li>
                <b>Contour</b>, <b>ombre</b> et <b>cadre</b>, chacun dans son propre fil de la palette.
              </li>
            </UL>
            <P>Chaque curseur a un ↺ (ou un double-clic) pour revenir à sa valeur par défaut.</P>
          </>
        ),
      },
      reference: {
        title: 'Calque de référence (décalquer une image)',
        keywords: 'calque référence image masque décalquer transparence opacité reproduire',
        body: (): ReactNode => (
          <>
            <P>
              Posez une image en transparence sur la grille pour la reproduire vous-même, point par
              point, au lieu de la conversion automatique.
            </P>
            <UL>
              <li>
                Bouton <b>Calque</b> de la barre de la planche (sous les onglets). Glisser-déposer accepté.
              </li>
              <li>
                <b>Opacité</b> réglable ; <b>Sous les points</b> (ce que vous avez brodé recouvre
                l’image) ou <b>Par-dessus</b> (comme un papier calque).
              </li>
              <li>
                <b>Placer</b> : glissez l’image pour la déplacer, tirez un coin pour la redimensionner
                (proportions gardées, <Kbd k="shift" /> pour libérer). <Kbd k="Entrée" /> ou{' '}
                <Kbd k="Échap" /> pour terminer. <b>Ajuster</b> la remet à la taille de la grille ;{' '}
                <b>Recadrer</b> n’en garde qu’une partie.
              </li>
              <li>
                <Kbd k="H" /> affiche ou masque le calque.
              </li>
              <li>
                Le calque n’est jamais imprimé ni compté. Il est enregistré avec le projet dans ce
                navigateur, mais pas dans l’export .json.
              </li>
            </UL>
          </>
        ),
      },
      threads: {
        title: 'Fils et couleurs',
        keywords: 'fil dmc couleur palette symbole remplacer filtre catalogue',
        body: (): ReactNode => (
          <>
            <UL>
              <li>
                <b>Catalogue DMC</b> : recherche par numéro ou nom, tri par teinte, équivalence d’une
                couleur quelconque. Un clic ajoute un fil, un second clic le retire (avec confirmation
                s’il est utilisé).
              </li>
              <li>
                <b>Remplacer</b> un fil par un autre : si le nouveau est déjà dans la palette, les deux
                fusionnent.
              </li>
              <li>Chaque fil a un symbole, utilisé sur la grille et à l’impression.</li>
              <li>
                Le <b>filtre de couleurs</b> isole ou atténue certains fils pour broder couleur par
                couleur.
              </li>
            </UL>
          </>
        ),
      },
      progress: {
        title: 'Suivi de broderie',
        keywords: 'suivi avancement marquer brodé valider dévalider progression',
        body: (): ReactNode => (
          <>
            <UL>
              <li>
                L’outil <b>Marquer</b> (P) coche les points déjà brodés, avec un pinceau carré ou rond.
              </li>
              <li>
                Mode <b>Auto</b> : partir d’un point déjà validé le dévalide, sinon on valide. Modes{' '}
                <b>Valider</b> / <b>Dévalider</b> pour forcer ; <Kbd k="alt" /> inverse.
              </li>
              <li>
                Le panneau Suivi montre l’avancement global et par couleur ; chaque couleur a son bouton
                « Tout » (« Annuler » une fois terminée), et ↻ « Tout remettre à zéro » efface tout le suivi.
              </li>
              <li>Un tracé de marquage s’annule en une fois.</li>
            </UL>
          </>
        ),
      },
      print: {
        title: 'Impression et PDF',
        keywords: 'imprimer pdf feuille a4 planche paysage portrait légende centre raccord en-tête pied',
        body: (): ReactNode => (
          <>
            <UL>
              <li>
                Choisissez le <b>nombre de feuilles A4</b> (ou <b>Auto</b> : le moins de feuilles avec des
                points d’au moins 3 mm). Portrait ou paysage est choisi automatiquement pour des points
                les plus gros possible.
              </li>
              <li>
                Bouton <b>Planches</b> dans la barre de la planche : voir et régler les découpes directement sur
                la grille.
              </li>
              <li>
                Chaque planche a des <b>flèches et lignes de centrage</b>, des numéros tous les 10 points
                sur les 4 bords, et répète en hachuré la dernière ligne / colonne de sa voisine pour le
                raccord.
              </li>
              <li>
                La <b>légende</b> liste les fils, le nombre de points, la longueur de fil estimée et le
                plan d’assemblage.
              </li>
              <li>
                Options : rendu « Couleur » ou « N & B », « Symboles », « Lignes centrales », « Légende
                des fils » et « Marquer les points brodés ».
              </li>
              <li>
                Pour un PDF : « Imprimer / PDF » puis « Enregistrer au format PDF ». Décochez{' '}
                <b>« En-têtes et pieds de page »</b> dans les options de Chrome pour retirer la date et
                l’adresse.
              </li>
            </UL>
          </>
        ),
      },
      motifs: {
        title: 'Bibliothèque de motifs',
        keywords:
          'motif bibliothèque élément lettre alphabet bordure fleur dossier arbre catégorie insérer réutiliser gestionnaire glisser',
        body: (): ReactNode => (
          <>
            <P>
              Les motifs sont de petits éléments réutilisables (lettres, bordures, fleurs…), rangés dans des
              <b> dossiers</b> à part des projets, et insérés dans n’importe quel projet.
            </P>
            <H>L’outil Motifs : explorer et insérer</H>
            <UL>
              <li>
                Outil <b>Motifs</b> (<Kbd k="M" />) : le panneau à gauche s’ouvre sur le dernier dossier
                visité. Cliquez un dossier pour y entrer, le fil d’Ariane pour remonter ; la recherche porte
                sur toute la bibliothèque.
              </li>
              <li>
                Un clic sur une vignette pose le motif en <b>aperçu</b> : déplacez-le, redimensionnez-le,
                tournez-le, puis <Kbd k="Entrée" />. Cliquer une autre vignette remplace l’aperçu.
              </li>
              <li>
                <b>Couleurs d’origine</b> (les fils manquants sont ajoutés à la palette) ou <b>Fil actif</b>{' '}
                (tout le motif dans le fil choisi). Changer ce choix recolore l’aperçu en cours.
              </li>
            </UL>
            <H>Le gestionnaire : ranger</H>
            <UL>
              <li>
                Fichier → « Bibliothèque de motifs… », ou « Gérer la bibliothèque… » dans l’outil. L’arbre des
                dossiers est à gauche, le contenu du dossier choisi à droite.
              </li>
              <li>
                <b>+ Dossier</b>, et <b>+ Motif ▾</b> : vierge, depuis une image, une grille PDF ou un fichier
                .json, rangé dans le dossier affiché.
                Double-clic sur un nom pour le renommer ; menu ⋯ pour le reste (dont « Transformer en
                projet », qui en refait un projet).
              </li>
              <li>
                <b>Glisser-déposer</b> un motif ou un dossier sur un dossier de l’arbre pour l’y ranger.
                Clic pour sélectionner, <Kbd k="mod" /> ou <Kbd k="shift" /> + clic pour en choisir plusieurs,
                puis « Déplacer vers… » ou « Supprimer ».
              </li>
              <li>
                Deux dossiers ne peuvent pas porter le même nom au même endroit (majuscules et accents
                ignorés) : pas de « Fleurs » et « fleurs » par erreur.
              </li>
              <li>
                Supprimer un dossier non vide propose de garder son contenu (rangé dans le dossier parent)
                ou de tout supprimer.
              </li>
            </UL>
            <H>Créer un motif</H>
            <UL>
              <li>
                Sélectionnez des points puis « Enregistrer comme motif » (panneau Sélection) ou
                « Enregistrer la sélection comme motif » (outil Motifs) : un nom et un dossier choisi dans l’arbre (ou créé sur place).
              </li>
              <li>
                Fichier → « Nouveau motif… » ou « + Motif ▾ » du gestionnaire : la fenêtre Créer, avec les
                mêmes sources que pour un projet.
              </li>
              <li>Un projet existant : Mes projets → ⋯ → « Déplacer vers la bibliothèque… ».</li>
              <li>« Modifier » ouvre un motif dans un onglet marqué « Motif ».</li>
            </UL>
          </>
        ),
      },
      projects: {
        title: 'Projets, onglets et import',
        keywords: 'projet onglet ouvrir intégrer insérer dupliquer exporter importer json fichier pdf grille',
        body: (): ReactNode => (
          <>
            <UL>
              <li>
                <b>Onglets</b> : plusieurs projets ouverts à la fois ; chacun garde son historique et son
                cadrage. Le <b>+</b> crée ou ouvre un projet dans un nouvel onglet.
              </li>
              <li>
                <b>Mes projets</b> : <b>Ouvrir</b> (nouvel onglet, ou ▾ pour remplacer l’onglet courant) ·{' '}
                <b>Intégrer</b> (copier le motif dans le projet affiché, comme aperçu à placer) · ⋯ pour
                dupliquer, exporter, supprimer ou <b>déplacer vers la bibliothèque</b>.
              </li>
              <li>
                <b>Projet ou motif</b> : un projet est un modèle complet à broder ; un motif est un petit
                élément réutilisable rangé dans la bibliothèque de l’outil Motifs. « Mes projets » ne liste
                que les projets ; un motif ouvert dans un onglet porte l’étiquette <b>Motif</b>.
              </li>
              <li>
                <b>Menu Fichier</b> : <b>Créer</b> (raccourcis vers la fenêtre Créer : nouveau projet,
                nouveau motif, depuis une image, depuis une grille PDF) · <b>Mes fichiers</b> (Mes projets,
                Bibliothèque de motifs) · <b>Sauvegarde (.json)</b> (exporter ou ouvrir un projet, tout sauvegarder,
                restaurer).
              </li>
              <li>
                <b>Grille PDF d’une autre application</b> : Fichier → « Depuis une grille PDF… ».
                L’app lit la couverture (taille, toile), la légende (références DMC, nombre de points)
                et chaque section, puis montre une vérification (points retrouvés / annoncés) avant
                d’ouvrir le projet dans un onglet. Seuls les points de croix complets sont repris ; les
                PDF d’autres logiciels peuvent ne pas être reconnus.
              </li>
            </UL>
          </>
        ),
      },
      storage: {
        title: 'Où sont mes données ?',
        keywords: 'stockage sauvegarde données localstorage indexeddb navigateur perdu disparu export backup plein rappel hors ligne installer',
        body: (): ReactNode => (
          <>
            <UL>
              <li>
                Les projets sont <b>enregistrés automatiquement</b> dans la base de données du navigateur
                (IndexedDB), sur votre appareil, au plus tard 10 secondes après une modification (même si vous continuez à dessiner), et
                immédiatement avant de changer d’onglet, de réduire la fenêtre ou de fermer la page.
              </li>
              <li>
                Ce stockage est propre à <b>ce navigateur, ce profil et cette adresse</b> (par exemple{' '}
                <code>stitchnook.github.io</code>). Un autre navigateur, un autre profil Chrome ou une autre
                adresse ne voient pas les mêmes projets. L’application de bureau a son propre stockage.
              </li>
              <li>
                <b>Rien n’est envoyé sur Internet</b>, sauf le téléchargement des polices Google pour
                l’outil Texte.
              </li>
              <li>
                <b>Tout sauvegarder</b> (menu Fichier, « Sauvegarde (.json) ») : tous les projets, motifs et dossiers dans un
                seul fichier .json. Pour changer d’ordinateur ou de navigateur, ouvrez-le ailleurs avec{' '}
                <b>Restaurer une sauvegarde…</b> : ce qui manque est ajouté, rien n’est écrasé (sauf si vous
                choisissez de remplacer les versions plus anciennes), et les projets ouverts ne sont jamais
                touchés.
              </li>
              <li>
                Un seul projet : <b>Exporter ce projet</b> (<Kbd k="mod" /> + <Kbd k="S" />) puis « Ouvrir un
                projet exporté… ». Un motif exporté se réimporte avec le type « Motif de bibliothèque » (ou
                depuis le gestionnaire de motifs) ; importé sans choisir de dossier, il retrouve le sien.
              </li>
              <li>
                <b>Rappel de sauvegarde</b> : si des projets ont changé et qu’aucune sauvegarde complète
                n’a été faite depuis plus de 14 jours, la barre d’état propose « Sauvegarder » (télécharge
                une sauvegarde complète) ou « Plus tard » (masque le rappel 7 jours).
              </li>
              <li>
                <b>Hors ligne</b> : une fois le site chargé, l’application fonctionne sans connexion et peut
                être installée depuis le navigateur. Seules les polices Google pas encore utilisées
                demandent une connexion.
              </li>
              <li>
                Vider les données du site dans le navigateur efface les projets, et Safari peut effacer
                celles d’un site non visité pendant plusieurs semaines (sauf application installée). La
                sauvegarde complète est la seule copie qui ne dépend pas du navigateur : faites-en
                régulièrement.
              </li>
              <li>
                La place disponible est large (une part du disque) ; si elle venait à manquer, un message
                l’indique : sauvegardez puis supprimez d’anciens projets.
              </li>
            </UL>
          </>
        ),
      },
      shortcuts: {
        title: 'Raccourcis clavier',
        keywords: 'raccourci clavier touche',
        intro: (): ReactNode => (
          <>
            Les raccourcis de symboles suivent la <b>position</b> des touches, pas le caractère : ils
            restent accessibles sans modificateur sur tous les claviers. Sur un clavier AZERTY, le
            pinceau se règle ainsi avec <b>^</b> et <b>$</b>. Dans Chrome et l’application de bureau,
            les touches affichées ici sont celles de votre clavier.
          </>
        ),
      },
    },
    center: {
      title: 'Aide',
      search: 'Rechercher (pdf, texte, stockage…)',
      noMatch: 'Aucune rubrique ne correspond.',
    },
  },
  {
    /* ================================================================ English */
    en: {
      hints: {
        brushSize: 'brush size',
        brushSizeTitle: 'The two keys right of P (smaller / bigger)',
        brushWheel: 'size',
        erase: 'erase',
        clearArea: 'clear the area',
        pickThread: 'pick a stitch’s thread',
        angles45: '45° angles',
        square: 'perfect square',
        circle: 'perfect circle',
        addArea: 'add an area',
        removeArea: 'remove an area',
        move: 'move',
        apply: 'apply',
        cancel: 'cancel',
        movePreview: 'move the preview',
        invert: 'invert',
        motifThumb: 'a thumbnail: preview to place',
        pan: 'pan',
        zoom: 'zoom',
        hand: 'hand',
        floatingMove: 'move (Shift: 10 st)',
        floatingAlign: 'while dragging: keep aligned',
      },
      toolNames: {
        pencil: 'Pencil (B)',
        eraser: 'Eraser (E)',
        line: 'Line (L)',
        rect: 'Rectangle (R)',
        ellipse: 'Circle / ellipse (C)',
        text: 'Text (T)',
        select: 'Selection (S)',
        fill: 'Fill (G)',
        picker: 'Eyedropper (I)',
        progress: 'Mark stitched (P)',
        motif: 'Motifs (M)',
      },
      toolText: {
        pencil:
          'Draws with the active thread. Square or round brush, from 1 to 15 stitches, set in the tool bar; each tool keeps its own setting.',
        eraser: 'Erases stitches, with its own square or round brush.',
        fill: 'Fills the whole area of the same color with the active thread in one click.',
        picker: 'Takes the thread of a stitch on the chart and makes it the active thread.',
        line: 'Draws a straight line: drag, then release. It arrives as a preview: move it, resize it, rotate it, then apply (Enter).',
        rect: 'Draws a rectangle, outlined or filled (tool bar). It arrives as a preview to place and resize, then apply (Enter); drawing the next shape applies the previous one.',
        ellipse:
          'Draws a circle or an ellipse, outlined or filled. A preview to place and resize (the outline stays crisp), then apply (Enter).',
        select:
          'Selects a free-form area to move, copy or transform. See the “Selection and transformations” topic.',
        text: 'Turns text into stitches. See the “Text” topic.',
        progress:
          'Ticks off the stitches already embroidered. In Auto mode, starting on a marked stitch unmarks. See “Stitching progress”.',
        motif:
          'Opens the motif library (letters, borders, flowers…): clicking a thumbnail places the motif as a preview to position, then apply. See “Motif library”.',
      },
      shortcuts: {
        undo: 'Undo',
        redo: 'Redo',
        copy: 'Copy the selection',
        cut: 'Cut the selection',
        paste: 'Paste (into another tab too)',
        selectAll: 'Select all',
        deselect: 'Deselect',
        exportProject: 'Export the project as .json',
        print: 'Print / PDF',
        clear: 'Clear the selection (or Backspace)',
        applyPreview: 'Apply the preview (paste, text, transform)',
        cancelPreview: 'Cancel the preview / deselect / close',
        moveSelection: 'Move the selection or preview (Shift: 10 stitches)',
        brushKeys: 'Smaller / bigger brush (the two keys right of P)',
        brushWheel: 'Change the brush size',
        zoom: 'Zoom in / out (also + and − on the keypad)',
        hand: 'Hand: drag to pan the view (or drag with the right or middle button)',
        wheelZoom: 'Zoom under the cursor (or pinch on the trackpad)',
        wheelSideways: 'Scroll the view horizontally',
        redoAlt: 'Redo (alternative shortcut)',
        shapeErase: 'Line, rectangle, circle: erase the drawn shape',
        help: 'Open help (or ?)',
        overlay: 'Show / hide the reference image',
        panels: 'Hide / show the side panels (full-screen drawing)',
        pencil: 'Pencil',
        eraser: 'Eraser',
        fill: 'Fill',
        picker: 'Eyedropper',
        line: 'Line',
        rect: 'Rectangle',
        ellipse: 'Circle / ellipse',
        select: 'Selection',
        text: 'Text',
        progress: 'Mark stitched',
        motif: 'Motifs (library)',
      },
      sections: {
        start: {
          title: 'Getting started',
          keywords: 'begin start new project create image zoom undo',
          body: (viewHints) => (
            <>
              <H>1. Create a project</H>
              <P>
                A single <b>Create</b> window: choose the <b>type</b> (project or library motif), then the{' '}
                <b>source</b>. The File menu entries and the tabs’ “+” are just shortcuts that open it
                already set up.
              </P>
              <UL>
                <li>
                  <b>Blank</b>: an empty chart (size in stitches, fabric, stitches per inch or per cm).
                </li>
                <li>
                  <b>A PDF chart</b> exported by another app, or <b>A .json file</b> (an exported project or
                  motif).
                </li>
                <li>
                  <b>An image</b>: turns a photo or drawing into cross stitches. <b>Illustration</b> style
                  for drawings and flat colors (crisp outlines, each stitch takes the main color of its
                  area) or <b>Photo</b> for gradients. <b>Crop</b> removes, for instance, the buttons of a
                  screenshot; “Simplify small areas” merges small specks into the neighboring color; by
                  default, the background is only removed from the edges (“Also remove the background
                  inside the motif” to remove it everywhere).
                </li>
                <li>Each new project opens in its own tab.</li>
              </UL>
              <H>2. Choose your threads</H>
              <P>
                Open the DMC catalog from the palette: one click adds a thread, a second click removes it.
                Then click a thread in the palette to make it active.
              </P>
              <H>3. Draw</H>
              <P>
                Choose a tool in the left column: its settings appear in the bar just above the chart, with
                its shortcuts. The shortcut chips <b>light up while the key is held</b>.
              </P>
              <H>4. Where to find what</H>
              <UL>
                <li>
                  <b>Top</b>: the File menu, the project name and its settings cog (chart size, fabric),
                  “Print / PDF”, the theme (light, dark or auto), the language (FR, EN, ES, DE; the page
                  reloads without losing anything), “Help”{SUPPORT_ENABLED ? <> and “Support” (Ko-fi)</> : null}.
                </li>
                <li>
                  <b>Chart bar</b> (below the tabs): undo, zoom, display, grid, print sheets and the{' '}
                  <b>reference image</b> (the eye shows or hides it).
                </li>
                <li>
                  <b>Status bar</b> (at the very bottom): cursor position, chart size, finished size and
                  fabric, stitches placed and stitched, thread count, shortcuts for moving around, save
                  status and, when needed, a backup reminder.
                </li>
                <li>
                  <b>Tool bar</b>: the simple settings of the active tool (size, shape…).
                </li>
                <li>
                  <b>Left, next to the tools</b>: detailed settings for Text, Selection (or a preview to
                  place) and the Motif library. The chevron folds it into a thin strip.
                </li>
                <li>
                  <b>Right</b>: the project, always in the same place — threads, color filter, stitching
                  progress. Click a heading to fold its section; long lists scroll.
                </li>
                <li>
                  <b>Motif library</b>: Motifs tool (<Kbd k="M" />), to insert letters, borders and other
                  reusable elements.
                </li>
                <li>
                  <Kbd k="Tab" /> hides or shows both panels to draw across the whole window.
                </li>
              </UL>
              <H>5. Moving around</H>
              {viewHints}
              <P>
                Dragging with the right or middle button pans too; <Kbd k="shift" /> + wheel scrolls
                sideways; pinching on the trackpad zooms.
              </P>
              <H>6. Undo</H>
              <P>
                <Kbd k="mod" /> + <Kbd k="Z" /> undoes, <Kbd k="mod" /> + <Kbd k="shift" /> + <Kbd k="Z" />{' '}
                (or <Kbd k="mod" /> + <Kbd k="Y" />) redoes. Each tab keeps its own history.
              </P>
            </>
          ),
        },
        tool: {
          title: (name) => `Tool: ${name}`,
          keywords: (tool) => `tool ${tool} brush size shortcut`,
          shortcuts: 'Shortcuts',
        },
        selection: {
          title: 'Selection and transformations',
          keywords: 'selection move copy paste handle rotate rotation mirror flip reset preview apply',
          body: (floatingHints) => (
            <>
              <H>Selecting</H>
              <UL>
                <li>Drag to draw an area; a single click deselects.</li>
                <li>
                  <Kbd k="shift" /> + drag adds an area, <Kbd k="alt" /> + drag removes one: the selection
                  can have any shape.
                </li>
                <li>
                  <Kbd k="mod" /> + <Kbd k="A" /> selects all, <Kbd k="mod" /> + <Kbd k="D" /> or{' '}
                  <Kbd k="Échap" /> deselects.
                </li>
                <li>Delete or Backspace clears the selected stitches.</li>
              </UL>
              <H>The preview: nothing is written until you apply</H>
              <P>
                As soon as you move or transform a selection (or paste, insert a pattern, type text), it
                becomes a <b>semi-transparent preview</b>. The original stays visible, dimmed.{' '}
                <Kbd k="Entrée" /> or <b>Apply</b> writes the result as a single undo step;{' '}
                <Kbd k="Échap" /> or <b>Cancel</b> puts everything back.
              </P>
              <H>Moving</H>
              {floatingHints}
              <H>Transforming</H>
              <UL>
                <li>
                  <b>Handles</b>: corners keep the proportions (<Kbd k="shift" /> to free them), sides
                  change a single dimension.
                </li>
                <li>
                  Pulling an edge <b>past the opposite edge</b> flips the motif (mirror).
                </li>
                <li>
                  <b>Rotation</b>: drag just outside a corner (curved-arrow cursor), in quarter turns.
                </li>
                <li>
                  The <b>quick bar</b> under the selection offers mirrors, rotation, ÷2, ×2,{' '}
                  <b>Reset</b> (back to the starting state) and Apply / Cancel.
                </li>
                <li>The size fields of the Selection panel apply live, losslessly.</li>
              </UL>
              <H>Copying between projects</H>
              <P>
                Copy in one tab, paste in another: threads are matched by their DMC number (added if
                missing, removed if you cancel).
              </P>
            </>
          ),
        },
        text: {
          title: 'Text',
          keywords: 'text font google system arc outline shadow frame underline uppercase alignment threshold',
          body: () => (
            <>
              <P>
                With the Text tool, type in the panel on the left, next to the tools: the text appears{' '}
                <b>live on the chart</b> as a preview, with all the selection tools (drag, handles,
                rotation, mirror). <Kbd k="Entrée" /> or “Apply” writes it.
              </P>
              <H>Fonts</H>
              <UL>
                <li>The whole Google Fonts catalog (over 1,800 fonts) with search and categories.</li>
                <li>
                  <b>System</b> tab: the fonts installed on the computer. In Chrome and the desktop app,
                  “List all my installed fonts” shows them all.
                </li>
                <li>“Pixel” fonts stay crisp even very small.</li>
              </UL>
              <H>Size and rendering</H>
              <UL>
                <li>
                  <b>Height</b> in stitches, <b>spacing</b> between letters, <b>line spacing</b>.
                </li>
                <li>
                  <b>Threshold</b>: the lower it is, the more thin strokes are kept (but the bolder the
                  text gets).
                </li>
              </UL>
              <H>Formatting and effects</H>
              <UL>
                <li>Left / center / right alignment, uppercase, underline, strikethrough.</li>
                <li>
                  <b>Arc</b>: from concave to convex.
                </li>
                <li>
                  <b>Outline</b>, <b>shadow</b> and <b>frame</b>, each in its own palette thread.
                </li>
              </UL>
              <P>Each slider has a ↺ (or a double-click) to return to its default value.</P>
            </>
          ),
        },
        reference: {
          title: 'Reference image (tracing an image)',
          keywords: 'overlay reference image trace tracing transparency opacity copy reproduce',
          body: () => (
            <>
              <P>
                Lay an image semi-transparently over the chart to reproduce it yourself, stitch by stitch,
                instead of the automatic conversion.
              </P>
              <UL>
                <li>
                  <b>Reference</b> button in the chart bar (below the tabs). Drag and drop works too.
                </li>
                <li>
                  Adjustable <b>opacity</b>; <b>Under stitches</b> (your stitches cover the image) or{' '}
                  <b>On top</b> (like tracing paper).
                </li>
                <li>
                  <b>Place</b>: drag the image to move it, pull a corner to resize it (proportions kept,{' '}
                  <Kbd k="shift" /> to free them). <Kbd k="Entrée" /> or <Kbd k="Échap" /> to finish.{' '}
                  <b>Fit</b> resets it to the chart size; <b>Crop</b> keeps only part of it.
                </li>
                <li>
                  <Kbd k="H" /> shows or hides the reference image.
                </li>
                <li>
                  The reference image is never printed or counted. It is saved with the project in this
                  browser, but not in the .json export.
                </li>
              </UL>
            </>
          ),
        },
        threads: {
          title: 'Threads and colors',
          keywords: 'thread dmc color palette symbol replace filter catalog',
          body: () => (
            <>
              <UL>
                <li>
                  <b>DMC catalog</b>: search by number or name, sort by hue, match any color. One click
                  adds a thread, a second click removes it (with confirmation if it is in use).
                </li>
                <li>
                  <b>Replace</b> one thread with another: if the new one is already in the palette, the
                  two merge.
                </li>
                <li>Each thread has a symbol, used on the chart and in print.</li>
                <li>
                  The <b>color filter</b> isolates or dims some threads so you can stitch color by
                  color.
                </li>
              </UL>
            </>
          ),
        },
        progress: {
          title: 'Stitching progress',
          keywords: 'progress tracking mark stitched done undo unmark',
          body: () => (
            <>
              <UL>
                <li>
                  The <b>Mark</b> tool (P) ticks off the stitches already embroidered, with a square or
                  round brush.
                </li>
                <li>
                  <b>Auto</b> mode: starting on a stitch already marked unmarks, otherwise it marks.{' '}
                  <b>Mark</b> / <b>Unmark</b> modes to force it; <Kbd k="alt" /> inverts.
                </li>
                <li>
                  The Progress panel shows overall and per-color progress; each color has its “All” button
                  (“Undo” once complete), and ↻ “Reset everything” clears all progress.
                </li>
                <li>A marking stroke is undone in one go.</li>
              </UL>
            </>
          ),
        },
        print: {
          title: 'Printing and PDF',
          keywords: 'print pdf sheet page a4 portrait landscape key legend center overlap header footer',
          body: () => (
            <>
              <UL>
                <li>
                  Choose the <b>number of A4 sheets</b> (or <b>Auto</b>: the fewest sheets with stitches of
                  at least 3 mm). Portrait or landscape is chosen automatically for the biggest possible
                  stitches.
                </li>
                <li>
                  <b>Sheets</b> button in the chart bar: see and adjust the page splits right on the chart.
                </li>
                <li>
                  Each sheet has <b>center arrows and lines</b>, numbers every 10 stitches on all 4 edges,
                  and repeats its neighbour’s last row / column hatched, to line them up.
                </li>
                <li>
                  The <b>key</b> lists the threads, the stitch count, the estimated thread length and the
                  assembly plan.
                </li>
                <li>
                  Options: “Color” or “B & W” rendering, “Symbols”, “Center lines”, “Thread legend” and
                  “Mark stitched stitches”.
                </li>
                <li>
                  For a PDF: “Print / PDF”, then “Save as PDF”. Untick <b>“Headers and footers”</b> in
                  Chrome’s options to remove the date and address.
                </li>
              </UL>
            </>
          ),
        },
        motifs: {
          title: 'Motif library',
          keywords:
            'motif library element letter alphabet border flower folder tree category insert reuse manager drag',
          body: () => (
            <>
              <P>
                Motifs are small reusable elements (letters, borders, flowers…), kept in <b>folders</b>{' '}
                apart from projects, and inserted into any project.
              </P>
              <H>The Motifs tool: browse and insert</H>
              <UL>
                <li>
                  <b>Motifs</b> tool (<Kbd k="M" />): the left panel opens on the last folder visited.
                  Click a folder to enter it, the breadcrumb to go back up; search covers the whole
                  library.
                </li>
                <li>
                  Clicking a thumbnail places the motif as a <b>preview</b>: move it, resize it, rotate it,
                  then <Kbd k="Entrée" />. Clicking another thumbnail replaces the preview.
                </li>
                <li>
                  <b>Original colors</b> (missing threads are added to the palette) or <b>Active thread</b>{' '}
                  (the whole motif in the chosen thread). Changing this recolors the current preview.
                </li>
              </UL>
              <H>The manager: organizing</H>
              <UL>
                <li>
                  File → “Motif library…”, or “Manage the library…” in the tool. The folder tree is on the
                  left, the chosen folder’s content on the right.
                </li>
                <li>
                  <b>+ Folder</b>, and <b>+ Motif ▾</b>: blank, from an image, a PDF chart or a .json
                  file, stored in the folder shown. Double-click a name to rename it; ⋯ menu for the rest (including
                  “Turn into a project”, which makes it a project again).
                </li>
                <li>
                  <b>Drag and drop</b> a motif or folder onto a folder in the tree to file it there. Click
                  to select, <Kbd k="mod" /> or <Kbd k="shift" /> + click to pick several, then “Move
                  to…” or “Delete”.
                </li>
                <li>
                  Two folders cannot share a name in the same place (case and accents ignored): no
                  “Flowers” and “flowers” by mistake.
                </li>
                <li>
                  Deleting a non-empty folder offers to keep its content (moved to the parent folder) or to
                  delete everything.
                </li>
              </UL>
              <H>Creating a motif</H>
              <UL>
                <li>
                  Select stitches, then “Save as motif” (Selection panel) or “Save selection as motif”
                  (Motifs tool): a name and a
                  folder chosen in the tree (or created on the spot).
                </li>
                <li>
                  File → “New motif…” or the manager’s “+ Motif ▾”: the Create window, with the same
                  sources as for a project.
                </li>
                <li>An existing project: My projects → ⋯ → “Move to library…”.</li>
                <li>“Edit” opens a motif in a tab labelled “Motif”.</li>
              </UL>
            </>
          ),
        },
        projects: {
          title: 'Projects, tabs and import',
          keywords: 'project tab open insert embed duplicate export import json file pdf chart',
          body: () => (
            <>
              <UL>
                <li>
                  <b>Tabs</b>: several projects open at once; each keeps its own history and view. The{' '}
                  <b>+</b> creates or opens a project in a new tab.
                </li>
                <li>
                  <b>My projects</b>: <b>Open</b> (new tab, or ▾ to replace the current tab) ·{' '}
                  <b>Insert</b> (copy the pattern into the project shown, as a preview to place) · ⋯ to
                  duplicate, export, delete or <b>move to the library</b>.
                </li>
                <li>
                  <b>Project or motif</b>: a project is a complete pattern to stitch; a motif is a small
                  reusable element kept in the Motifs tool’s library. “My projects” lists only projects; a
                  motif open in a tab carries the <b>Motif</b> label.
                </li>
                <li>
                  <b>File menu</b>: <b>Create</b> (shortcuts to the Create window: new project, new motif,
                  from an image, from a PDF chart) · <b>My files</b> (My projects, Motif library) ·{' '}
                  <b>Backup (.json)</b> (export or open a project, back up everything, restore).
                </li>
                <li>
                  <b>PDF chart from another app</b>: File → “From a PDF chart…”. The app reads the cover
                  (size, fabric), the key (DMC numbers, stitch counts) and each section, then shows a check
                  (stitches found / stated) before opening the project in a tab. Only full cross stitches
                  are imported; PDFs from other software may not be recognized.
                </li>
              </UL>
            </>
          ),
        },
        storage: {
          title: 'Where is my data?',
          keywords: 'storage backup data localstorage indexeddb browser lost missing gone export full reminder offline install',
          body: () => (
            <>
              <UL>
                <li>
                  Projects are <b>saved automatically</b> in the browser’s database (IndexedDB), on your
                  device, at most 10 seconds after a change (even if you keep drawing), and immediately before you switch
                  tabs, minimize the window or close the page.
                </li>
                <li>
                  This storage belongs to <b>this browser, this profile and this address</b> (for example{' '}
                  <code>stitchnook.github.io</code>). Another browser, another Chrome profile or another address
                  doesn’t see the same projects. The desktop app has its own storage.
                </li>
                <li>
                  <b>Nothing is sent over the Internet</b>, except downloading Google fonts for the Text
                  tool.
                </li>
                <li>
                  <b>Back up everything</b> (File menu, “Backup (.json)”): all projects, motifs and folders in a single
                  .json file. To move to another computer or browser, open it there with{' '}
                  <b>Restore a backup…</b>: whatever is missing is added, nothing is overwritten (unless
                  you choose to replace older versions), and open projects are never touched.
                </li>
                <li>
                  A single project: <b>Export this project</b> (<Kbd k="mod" /> + <Kbd k="S" />), then
                  “Open an exported project…”. An exported motif is re-imported with the “Library motif” type
                  (or from the motif manager); imported without choosing a folder, it gets its own back.
                </li>
                <li>
                  <b>Backup reminder</b>: if projects have changed and no full backup has been made in over
                  14 days, the status bar offers “Back up” (downloads a full backup) or “Later” (hides the
                  reminder for 7 days).
                </li>
                <li>
                  <b>Offline</b>: once the site has loaded, the app works without a connection and can be
                  installed from the browser. Only Google fonts not used yet need a connection.
                </li>
                <li>
                  Clearing the site’s data in the browser erases the projects, and Safari may clear the
                  data of a site not visited for several weeks (unless the app is installed). A full
                  backup is the only copy that does not depend on the browser: make one regularly.
                </li>
                <li>
                  There is plenty of room (a share of the disk); if it ever runs out, a message says so:
                  back up, then delete old projects.
                </li>
              </UL>
            </>
          ),
        },
        shortcuts: {
          title: 'Keyboard shortcuts',
          keywords: 'shortcut keyboard key',
          intro: () => (
            <>
              Shortcuts on symbol keys follow the keys’ <b>position</b>, not the character: they stay
              reachable without a modifier on every keyboard. On a French AZERTY keyboard, for instance,
              the brush is set with <b>^</b> and <b>$</b>. In Chrome and the desktop app, the keys shown
              here are those of your keyboard.
            </>
          ),
        },
      },
      center: {
        title: 'Help',
        search: 'Search (pdf, text, storage…)',
        noMatch: 'No topic matches.',
      },
    },

    /* ================================================================ Spanish */
    es: {
      hints: {
        brushSize: 'tamaño del pincel',
        brushSizeTitle: 'Las dos teclas a la derecha de la P (reducir / ampliar)',
        brushWheel: 'tamaño',
        erase: 'borrar',
        clearArea: 'vaciar la zona',
        pickThread: 'tomar el hilo de un punto',
        angles45: 'ángulos de 45°',
        square: 'cuadrado perfecto',
        circle: 'círculo perfecto',
        addArea: 'añadir una zona',
        removeArea: 'quitar una zona',
        move: 'mover',
        apply: 'aplicar',
        cancel: 'cancelar',
        movePreview: 'mover la vista previa',
        invert: 'invertir',
        motifThumb: 'una miniatura: vista previa para colocar',
        pan: 'desplazar',
        zoom: 'zoom',
        hand: 'mano',
        floatingMove: 'mover (Mayús: 10 pts)',
        floatingAlign: 'al arrastrar: mantener la alineación',
      },
      toolNames: {
        pencil: 'Lápiz (B)',
        eraser: 'Goma (E)',
        line: 'Línea (L)',
        rect: 'Rectángulo (R)',
        ellipse: 'Círculo / elipse (C)',
        text: 'Texto (T)',
        select: 'Selección (S)',
        fill: 'Bote de pintura (G)',
        picker: 'Cuentagotas (I)',
        progress: 'Marcar puntos bordados (P)',
        motif: 'Motivos (M)',
      },
      toolText: {
        pencil:
          'Dibuja con el hilo activo. Pincel cuadrado o redondo, de 1 a 15 puntos, ajustable en la barra de la herramienta; cada herramienta guarda su propio ajuste.',
        eraser: 'Borra puntos, con su propio pincel cuadrado o redondo.',
        fill: 'Rellena con un clic toda la zona del mismo color con el hilo activo.',
        picker: 'Toma el hilo de un punto del patrón y lo convierte en el hilo activo.',
        line: 'Traza una línea recta: arrastra y suelta. Aparece como vista previa: muévela, cambia su tamaño, gírala y luego aplica (Intro).',
        rect: 'Traza un rectángulo, de contorno o relleno (barra de la herramienta). Aparece como vista previa para colocar y redimensionar, y luego aplicar (Intro); trazar la siguiente forma aplica la anterior.',
        ellipse:
          'Traza un círculo o una elipse, de contorno o relleno. Vista previa para colocar y redimensionar (el trazo sigue nítido) y luego aplicar (Intro).',
        select:
          'Selecciona una zona de forma libre para moverla, copiarla o transformarla. Consulta el tema «Selección y transformaciones».',
        text: 'Convierte un texto en puntos. Consulta el tema «Texto».',
        progress:
          'Marca los puntos ya bordados. En modo Auto, empezar sobre un punto marcado lo desmarca. Consulta «Progreso del bordado».',
        motif:
          'Abre la biblioteca de motivos (letras, cenefas, flores…): un clic en una miniatura coloca el motivo como vista previa para situarlo y luego aplicarlo. Consulta «Biblioteca de motivos».',
      },
      shortcuts: {
        undo: 'Deshacer',
        redo: 'Rehacer',
        copy: 'Copiar la selección',
        cut: 'Cortar la selección',
        paste: 'Pegar (también en otra pestaña)',
        selectAll: 'Seleccionar todo',
        deselect: 'Deseleccionar',
        exportProject: 'Exportar el proyecto en .json',
        print: 'Imprimir / PDF',
        clear: 'Borrar la selección (o Retroceso)',
        applyPreview: 'Aplicar la vista previa (pegado, texto, transformación)',
        cancelPreview: 'Cancelar la vista previa / deseleccionar / cerrar',
        moveSelection: 'Mover la selección o la vista previa (Mayús: 10 puntos)',
        brushKeys: 'Reducir / ampliar el pincel (las dos teclas a la derecha de la P)',
        brushWheel: 'Cambiar el tamaño del pincel',
        zoom: 'Acercar / alejar (también + y − del teclado numérico)',
        hand: 'Mano: arrastrar para desplazar la vista (o arrastrar con el botón derecho o central)',
        wheelZoom: 'Acercar bajo el cursor (o pellizcar en el trackpad)',
        wheelSideways: 'Desplazar la vista en horizontal',
        redoAlt: 'Rehacer (atajo alternativo)',
        shapeErase: 'Línea, rectángulo, círculo: borrar la forma trazada',
        help: 'Abrir la ayuda (o ?)',
        overlay: 'Mostrar / ocultar la imagen de referencia',
        panels: 'Ocultar / mostrar los paneles laterales (dibujo a pantalla completa)',
        pencil: 'Lápiz',
        eraser: 'Goma',
        fill: 'Bote de pintura',
        picker: 'Cuentagotas',
        line: 'Línea',
        rect: 'Rectángulo',
        ellipse: 'Círculo / elipse',
        select: 'Selección',
        text: 'Texto',
        progress: 'Marcar puntos bordados',
        motif: 'Motivos (biblioteca)',
      },
      sections: {
        start: {
          title: 'Primeros pasos',
          keywords: 'empezar comenzar nuevo proyecto crear imagen zoom deshacer',
          body: (viewHints) => (
            <>
              <H>1. Crear un proyecto</H>
              <P>
                Una única ventana <b>Crear</b>: elige el <b>tipo</b> (proyecto o motivo de biblioteca) y
                luego el <b>origen</b>. Las entradas del menú Archivo y el «+» de las pestañas son solo
                atajos que la abren ya configurada.
              </P>
              <UL>
                <li>
                  <b>En blanco</b>: un patrón vacío (tamaño en puntos, tela, puntos por pulgada o por cm).
                </li>
                <li>
                  <b>Un patrón PDF</b> exportado por otra aplicación, o <b>un archivo .json</b> exportado.
                </li>
                <li>
                  <b>Una imagen</b>: convierte una foto o un dibujo en punto de cruz. Estilo{' '}
                  <b>Ilustración</b> para dibujos y colores planos (contornos nítidos, cada punto toma el
                  color mayoritario de su zona) o <b>Foto</b> para degradados. <b>Recortar</b> quita por
                  ejemplo los botones de una captura de pantalla; «Simplificar zonas pequeñas» funde las
                  manchas pequeñas en el color vecino; por defecto, el fondo solo se quita desde los bordes
                  («Quitar también el fondo dentro del motivo» para quitarlo todo).
                </li>
                <li>Cada proyecto nuevo se abre en su propia pestaña.</li>
              </UL>
              <H>2. Elegir los hilos</H>
              <P>
                Abre el catálogo DMC desde la paleta: un clic añade un hilo, un segundo clic lo quita.
                Luego haz clic en un hilo de la paleta para activarlo.
              </P>
              <H>3. Dibujar</H>
              <P>
                Elige una herramienta en la columna de la izquierda: sus ajustes aparecen en la barra justo
                encima del patrón, con sus atajos. Las etiquetas de atajos{' '}
                <b>se iluminan mientras pulsas la tecla</b>.
              </P>
              <H>4. Dónde está cada cosa</H>
              <UL>
                <li>
                  <b>Arriba</b>: el menú Archivo, el nombre del proyecto y la rueda de sus ajustes (tamaño
                  del patrón, tela), «Imprimir / PDF», el tema (claro, oscuro o auto), el idioma (FR, EN,
                  ES, DE; la página se recarga sin perder nada), «Ayuda»{SUPPORT_ENABLED ? <> y «Apoyar» (Ko-fi)</> : null}.
                </li>
                <li>
                  <b>Barra del patrón</b> (bajo las pestañas): deshacer, zoom, visualización, cuadrícula,
                  hojas de impresión e <b>imagen de referencia</b> (el ojo la muestra u oculta).
                </li>
                <li>
                  <b>Barra de estado</b> (abajo del todo): posición del cursor, tamaño del patrón, tamaño
                  terminado y tela, puntos colocados y bordados, número de hilos, atajos para moverse,
                  estado del guardado y, si hace falta, un recordatorio de copia de seguridad.
                </li>
                <li>
                  <b>Barra de la herramienta</b>: los ajustes sencillos de la herramienta activa (tamaño,
                  forma…).
                </li>
                <li>
                  <b>A la izquierda, junto a las herramientas</b>: los ajustes detallados de Texto, de
                  Selección (o de una vista previa por colocar) y la biblioteca de Motivos. El cheurón lo
                  pliega en una franja estrecha.
                </li>
                <li>
                  <b>A la derecha</b>: el proyecto, siempre en el mismo sitio — hilos, filtro por color,
                  progreso del bordado. Haz clic en un título para plegar su sección; las listas largas se
                  desplazan.
                </li>
                <li>
                  <b>Biblioteca de motivos</b>: herramienta Motivos (<Kbd k="M" />), para insertar letras,
                  cenefas y otros elementos reutilizables.
                </li>
                <li>
                  <Kbd k="Tab" /> oculta o muestra los dos paneles para dibujar en toda la ventana.
                </li>
              </UL>
              <H>5. Desplazarse</H>
              {viewHints}
              <P>
                Arrastrar con el botón derecho o central también desplaza la vista;{' '}
                <Kbd k="shift" /> + rueda la desplaza en horizontal; pellizcar en el trackpad hace zoom.
              </P>
              <H>6. Deshacer</H>
              <P>
                <Kbd k="mod" /> + <Kbd k="Z" /> deshace, <Kbd k="mod" /> + <Kbd k="shift" /> + <Kbd k="Z" />{' '}
                (o <Kbd k="mod" /> + <Kbd k="Y" />) rehace. Cada pestaña guarda su propio historial.
              </P>
            </>
          ),
        },
        tool: {
          title: (name) => `Herramienta: ${name}`,
          keywords: (tool) => `herramienta ${tool} pincel tamaño atajo`,
          shortcuts: 'Atajos',
        },
        selection: {
          title: 'Selección y transformaciones',
          keywords: 'selección mover copiar pegar tirador rotación girar espejo voltear restablecer vista previa aplicar',
          body: (floatingHints) => (
            <>
              <H>Seleccionar</H>
              <UL>
                <li>Arrastra para trazar una zona; un simple clic deselecciona.</li>
                <li>
                  <Kbd k="shift" /> + arrastrar añade una zona, <Kbd k="alt" /> + arrastrar la quita: la
                  selección puede tener cualquier forma.
                </li>
                <li>
                  <Kbd k="mod" /> + <Kbd k="A" /> selecciona todo, <Kbd k="mod" /> + <Kbd k="D" /> o{' '}
                  <Kbd k="Échap" /> deselecciona.
                </li>
                <li>Supr o Retroceso borra los puntos seleccionados.</li>
              </UL>
              <H>La vista previa: no se escribe nada hasta aplicar</H>
              <P>
                En cuanto mueves o transformas una selección (o pegas, insertas un patrón, escribes un
                texto), se convierte en una <b>vista previa semitransparente</b>. El original sigue
                visible, atenuado. <Kbd k="Entrée" /> o <b>Aplicar</b> escribe el resultado en un solo paso
                de deshacer; <Kbd k="Échap" /> o <b>Cancelar</b> lo deja todo como estaba.
              </P>
              <H>Mover</H>
              {floatingHints}
              <H>Transformar</H>
              <UL>
                <li>
                  <b>Tiradores</b>: las esquinas mantienen las proporciones (<Kbd k="shift" /> para
                  liberarlas), los lados cambian una sola dimensión.
                </li>
                <li>
                  Tirar de un borde <b>más allá del borde opuesto</b> voltea el motivo (espejo).
                </li>
                <li>
                  <b>Rotación</b>: arrastra justo fuera de una esquina (cursor de flecha curva), por cuartos
                  de vuelta.
                </li>
                <li>
                  La <b>barra rápida</b> bajo la selección ofrece espejos, rotación, ÷2, ×2,{' '}
                  <b>Restablecer</b> (volver al estado inicial) y Aplicar / Cancelar.
                </li>
                <li>Los campos de tamaño del panel Selección se aplican en directo, sin pérdida.</li>
              </UL>
              <H>Copiar entre proyectos</H>
              <P>
                Copia en una pestaña y pega en otra: los hilos se encuentran por su referencia DMC
                (añadidos si faltan, quitados si cancelas).
              </P>
            </>
          ),
        },
        text: {
          title: 'Texto',
          keywords: 'texto fuente tipografía google sistema arco contorno sombra marco subrayado mayúsculas alineación umbral',
          body: () => (
            <>
              <P>
                Con la herramienta Texto, escribe en el panel de la izquierda, junto a las herramientas: el
                texto aparece <b>en directo sobre el patrón</b> como vista previa, con todas las
                herramientas de la selección (arrastrar, tiradores, rotación, espejo).{' '}
                <Kbd k="Entrée" /> o «Aplicar» lo escribe.
              </P>
              <H>Fuentes</H>
              <UL>
                <li>Todo el catálogo de Google Fonts (más de 1800 fuentes) con búsqueda y categorías.</li>
                <li>
                  Pestaña <b>Sistema</b>: las fuentes instaladas en el ordenador. En Chrome y en la
                  aplicación de escritorio, «Mostrar todas mis fuentes instaladas» las muestra todas.
                </li>
                <li>Las fuentes «Pixel» siguen nítidas incluso muy pequeñas.</li>
              </UL>
              <H>Tamaño y renderizado</H>
              <UL>
                <li>
                  <b>Altura</b> en puntos, <b>espaciado</b> entre letras, <b>interlineado</b>.
                </li>
                <li>
                  <b>Umbral</b>: cuanto más bajo, más trazos finos se conservan (pero más se engrosa el
                  texto).
                </li>
              </UL>
              <H>Formato y efectos</H>
              <UL>
                <li>Alineación izquierda / centrada / derecha, mayúsculas, subrayado, tachado.</li>
                <li>
                  <b>Arco</b>: de cóncavo a convexo.
                </li>
                <li>
                  <b>Contorno</b>, <b>sombra</b> y <b>marco</b>, cada uno con su propio hilo de la paleta.
                </li>
              </UL>
              <P>Cada control deslizante tiene un ↺ (o doble clic) para volver a su valor por defecto.</P>
            </>
          ),
        },
        reference: {
          title: 'Imagen de referencia (calcar una imagen)',
          keywords: 'imagen referencia calco calcar capa transparencia opacidad reproducir',
          body: () => (
            <>
              <P>
                Pon una imagen en transparencia sobre el patrón para reproducirla tú mismo, punto a punto,
                en lugar de la conversión automática.
              </P>
              <UL>
                <li>
                  Botón <b>Referencia</b> de la barra del patrón (bajo las pestañas). También puedes arrastrar y soltar.
                </li>
                <li>
                  <b>Opacidad</b> ajustable; <b>Bajo los puntos</b> (lo que has bordado cubre la imagen) o{' '}
                  <b>Encima</b> (como papel de calco).
                </li>
                <li>
                  <b>Colocar</b>: arrastra la imagen para moverla, tira de una esquina para redimensionarla
                  (proporciones mantenidas, <Kbd k="shift" /> para liberarlas). <Kbd k="Entrée" /> o{' '}
                  <Kbd k="Échap" /> para terminar. <b>Ajustar</b> la devuelve al tamaño del patrón;{' '}
                  <b>Recortar</b> conserva solo una parte.
                </li>
                <li>
                  <Kbd k="H" /> muestra u oculta la imagen de referencia.
                </li>
                <li>
                  La imagen de referencia nunca se imprime ni se cuenta. Se guarda con el proyecto en este
                  navegador, pero no en la exportación .json.
                </li>
              </UL>
            </>
          ),
        },
        threads: {
          title: 'Hilos y colores',
          keywords: 'hilo dmc color paleta símbolo reemplazar sustituir filtro catálogo',
          body: () => (
            <>
              <UL>
                <li>
                  <b>Catálogo DMC</b>: búsqueda por número o nombre, orden por tono, equivalencia de
                  cualquier color. Un clic añade un hilo, un segundo clic lo quita (con confirmación si se
                  está usando).
                </li>
                <li>
                  <b>Reemplazar</b> un hilo por otro: si el nuevo ya está en la paleta, ambos se fusionan.
                </li>
                <li>Cada hilo tiene un símbolo, usado en el patrón y al imprimir.</li>
                <li>
                  El <b>filtro de colores</b> aísla o atenúa ciertos hilos para bordar color a color.
                </li>
              </UL>
            </>
          ),
        },
        progress: {
          title: 'Progreso del bordado',
          keywords: 'progreso avance marcar bordado desmarcar seguimiento',
          body: () => (
            <>
              <UL>
                <li>
                  La herramienta <b>Marcar</b> (P) marca los puntos ya bordados, con un pincel cuadrado o
                  redondo.
                </li>
                <li>
                  Modo <b>Auto</b>: empezar sobre un punto ya marcado lo desmarca; si no, marca. Modos{' '}
                  <b>Marcar</b> / <b>Desmarcar</b> para forzarlo; <Kbd k="alt" /> invierte.
                </li>
                <li>
                  El panel Progreso muestra el avance global y por color; cada color tiene su botón «Todo»
                  («Deshacer» una vez completo), y ↻ «Reiniciar todo» borra todo el progreso.
                </li>
                <li>Un trazo de marcado se deshace de una vez.</li>
              </UL>
            </>
          ),
        },
        print: {
          title: 'Impresión y PDF',
          keywords: 'imprimir pdf hoja página a4 horizontal vertical leyenda centro empalme encabezado pie',
          body: () => (
            <>
              <UL>
                <li>
                  Elige el <b>número de hojas A4</b> (o <b>Auto</b>: el menor número de hojas con puntos de
                  al menos 3 mm). Vertical u horizontal se elige automáticamente para que los puntos sean
                  lo más grandes posible.
                </li>
                <li>
                  Botón <b>Hojas</b> en la barra del patrón: ver y ajustar los cortes directamente sobre el
                  patrón.
                </li>
                <li>
                  Cada hoja tiene <b>flechas y líneas de centrado</b>, números cada 10 puntos en los 4
                  bordes, y repite sombreada la última fila / columna de su vecina para empalmarlas.
                </li>
                <li>
                  La <b>leyenda</b> lista los hilos, el número de puntos, la longitud de hilo estimada y el
                  plano de montaje.
                </li>
                <li>
                  Opciones: impresión «Color» o «B y N», «Símbolos», «Líneas centrales», «Leyenda de
                  hilos» y «Marcar puntos bordados».
                </li>
                <li>
                  Para un PDF: «Imprimir / PDF» y luego «Guardar como PDF». Desmarca{' '}
                  <b>«Encabezados y pies de página»</b> en las opciones de Chrome para quitar la fecha y la
                  dirección.
                </li>
              </UL>
            </>
          ),
        },
        motifs: {
          title: 'Biblioteca de motivos',
          keywords:
            'motivo biblioteca elemento letra alfabeto cenefa borde flor carpeta árbol categoría insertar reutilizar gestor arrastrar',
          body: () => (
            <>
              <P>
                Los motivos son pequeños elementos reutilizables (letras, cenefas, flores…), guardados en{' '}
                <b>carpetas</b> aparte de los proyectos, que se insertan en cualquier proyecto.
              </P>
              <H>La herramienta Motivos: explorar e insertar</H>
              <UL>
                <li>
                  Herramienta <b>Motivos</b> (<Kbd k="M" />): el panel de la izquierda se abre en la última
                  carpeta visitada. Haz clic en una carpeta para entrar, en la ruta de navegación para
                  subir; la búsqueda abarca toda la biblioteca.
                </li>
                <li>
                  Un clic en una miniatura coloca el motivo como <b>vista previa</b>: muévelo, cambia su
                  tamaño, gíralo y luego <Kbd k="Entrée" />. Hacer clic en otra miniatura reemplaza la
                  vista previa.
                </li>
                <li>
                  <b>Colores originales</b> (los hilos que faltan se añaden a la paleta) o{' '}
                  <b>Hilo activo</b> (todo el motivo en el hilo elegido). Cambiar esta opción vuelve a
                  colorear la vista previa actual.
                </li>
              </UL>
              <H>El gestor: organizar</H>
              <UL>
                <li>
                  Archivo → «Biblioteca de motivos…», o «Gestionar la biblioteca…» en la herramienta. El
                  árbol de carpetas está a la izquierda, el contenido de la carpeta elegida a la derecha.
                </li>
                <li>
                  <b>+ Carpeta</b>, y <b>+ Motivo ▾</b>: en blanco, desde una imagen, un patrón PDF o un
                  archivo .json, guardado en la carpeta mostrada. Doble clic en un nombre para cambiarlo;
                  menú ⋯ para lo demás (incluido «Convertir en proyecto», que lo vuelve a hacer proyecto).
                </li>
                <li>
                  <b>Arrastra y suelta</b> un motivo o una carpeta sobre una carpeta del árbol para
                  guardarlo allí. Clic para seleccionar, <Kbd k="mod" /> o <Kbd k="shift" /> + clic para
                  elegir varios, y luego «Mover a…» o «Eliminar».
                </li>
                <li>
                  Dos carpetas no pueden llamarse igual en el mismo sitio (sin distinguir mayúsculas ni
                  acentos): nada de «Flores» y «flores» por error.
                </li>
                <li>
                  Eliminar una carpeta no vacía ofrece conservar su contenido (movido a la carpeta superior)
                  o eliminarlo todo.
                </li>
              </UL>
              <H>Crear un motivo</H>
              <UL>
                <li>
                  Selecciona puntos y luego «Guardar como motivo» (panel Selección) o «Guardar la
                  selección como motivo» (herramienta Motivos):
                  un nombre y una carpeta elegida en el árbol (o creada en el momento).
                </li>
                <li>
                  Archivo → «Nuevo motivo…» o «+ Motivo ▾» del gestor: la ventana Crear, con los mismos
                  orígenes que para un proyecto.
                </li>
                <li>Un proyecto existente: Mis proyectos → ⋯ → «Mover a la biblioteca…».</li>
                <li>«Editar» abre un motivo en una pestaña marcada «Motivo».</li>
              </UL>
            </>
          ),
        },
        projects: {
          title: 'Proyectos, pestañas e importación',
          keywords: 'proyecto pestaña abrir integrar insertar duplicar exportar importar json archivo pdf patrón',
          body: () => (
            <>
              <UL>
                <li>
                  <b>Pestañas</b>: varios proyectos abiertos a la vez; cada uno guarda su historial y su
                  encuadre. El <b>+</b> crea o abre un proyecto en una pestaña nueva.
                </li>
                <li>
                  <b>Mis proyectos</b>: <b>Abrir</b> (pestaña nueva, o ▾ para reemplazar la pestaña actual) ·{' '}
                  <b>Integrar</b> (copiar el patrón en el proyecto mostrado, como vista previa para
                  colocar) · ⋯ para duplicar, exportar, eliminar o <b>mover a la biblioteca</b>.
                </li>
                <li>
                  <b>Proyecto o motivo</b>: un proyecto es un patrón completo para bordar; un motivo es un
                  pequeño elemento reutilizable guardado en la biblioteca de la herramienta Motivos. «Mis
                  proyectos» solo lista los proyectos; un motivo abierto en una pestaña lleva la etiqueta{' '}
                  <b>Motivo</b>.
                </li>
                <li>
                  <b>Menú Archivo</b>: <b>Crear</b> (atajos a la ventana Crear: nuevo proyecto, nuevo
                  motivo, desde una imagen, desde un patrón PDF) · <b>Mis archivos</b> (Mis proyectos,
                  Biblioteca de motivos) · <b>Copia de seguridad (.json)</b> (exportar o abrir un proyecto, guardar
                  todo, restaurar).
                </li>
                <li>
                  <b>Patrón PDF de otra aplicación</b>: Archivo → «Desde un patrón PDF…». La app lee la
                  portada (tamaño, tela), la leyenda (referencias DMC, número de puntos) y cada sección, y
                  luego muestra una comprobación (puntos encontrados / anunciados) antes de abrir el
                  proyecto en una pestaña. Solo se importan los puntos de cruz completos; es posible que
                  no se reconozcan los PDF de otros programas.
                </li>
              </UL>
            </>
          ),
        },
        storage: {
          title: '¿Dónde están mis datos?',
          keywords: 'almacenamiento copia seguridad datos localstorage indexeddb navegador perdido desaparecido exportar lleno recordatorio sin conexión instalar',
          body: () => (
            <>
              <UL>
                <li>
                  Los proyectos se <b>guardan automáticamente</b> en la base de datos del navegador
                  (IndexedDB), en tu dispositivo, como mucho 10 segundos después de un cambio (aunque sigas dibujando), e inmediatamente
                  antes de cambiar de pestaña, minimizar la ventana o cerrar la página.
                </li>
                <li>
                  Este almacenamiento es propio de <b>este navegador, este perfil y esta dirección</b> (por
                  ejemplo <code>stitchnook.github.io</code>). Otro navegador, otro perfil de Chrome u otra
                  dirección no ven los mismos proyectos. La aplicación de escritorio tiene su propio
                  almacenamiento.
                </li>
                <li>
                  <b>No se envía nada a Internet</b>, salvo la descarga de las fuentes de Google para la
                  herramienta Texto.
                </li>
                <li>
                  <b>Guardar todo</b> (menú Archivo, «Copia de seguridad (.json)»): todos los proyectos, motivos y
                  carpetas en un único archivo .json. Para cambiar de ordenador o de navegador, ábrelo allí
                  con <b>Restaurar una copia de seguridad…</b>: se añade lo que falta, no se sobrescribe
                  nada (salvo si eliges reemplazar las versiones más antiguas) y los proyectos abiertos
                  nunca se tocan.
                </li>
                <li>
                  Un solo proyecto: <b>Exportar este proyecto</b> (<Kbd k="mod" /> + <Kbd k="S" />) y luego
                  «Abrir un proyecto exportado…». Un motivo exportado se vuelve a importar con el tipo
                  «Motivo de biblioteca» (o desde el gestor de motivos); importado sin elegir carpeta,
                  recupera la suya.
                </li>
                <li>
                  <b>Recordatorio de copia de seguridad</b>: si hay proyectos modificados y no se ha hecho
                  ninguna copia completa desde hace más de 14 días, la barra de estado propone «Hacer
                  copia» (descarga una copia completa) o «Más tarde» (oculta el aviso 7 días).
                </li>
                <li>
                  <b>Sin conexión</b>: una vez cargado el sitio, la aplicación funciona sin conexión y se
                  puede instalar desde el navegador. Solo las fuentes de Google aún no usadas necesitan
                  conexión.
                </li>
                <li>
                  Borrar los datos del sitio en el navegador elimina los proyectos, y Safari puede borrar
                  los de un sitio no visitado durante varias semanas (salvo si la aplicación está
                  instalada). La copia de seguridad completa es la única que no depende del navegador:
                  hazla con regularidad.
                </li>
                <li>
                  Hay mucho espacio (una parte del disco); si llegara a faltar, un mensaje lo indica: haz una
                  copia de seguridad y luego elimina proyectos antiguos.
                </li>
              </UL>
            </>
          ),
        },
        shortcuts: {
          title: 'Atajos de teclado',
          keywords: 'atajo teclado tecla',
          intro: () => (
            <>
              Los atajos de símbolos siguen la <b>posición</b> de las teclas, no el carácter: siguen
              accesibles sin modificador en todos los teclados. En un teclado español, el pincel se
              ajusta así con <b>`</b> y <b>+</b> (con una herramienta sin pincel, <b>+</b> hace zoom). En Chrome y en la aplicación de escritorio, las teclas
              mostradas aquí son las de tu teclado.
            </>
          ),
        },
      },
      center: {
        title: 'Ayuda',
        search: 'Buscar (pdf, texto, almacenamiento…)',
        noMatch: 'Ningún tema coincide.',
      },
    },

    /* ================================================================= German */
    de: {
      hints: {
        brushSize: 'Pinselgröße',
        brushSizeTitle: 'Die zwei Tasten rechts von P (kleiner / größer)',
        brushWheel: 'Größe',
        erase: 'radieren',
        clearArea: 'Bereich leeren',
        pickThread: 'Garn eines Stichs aufnehmen',
        angles45: '45°-Winkel',
        square: 'exaktes Quadrat',
        circle: 'exakter Kreis',
        addArea: 'Bereich hinzufügen',
        removeArea: 'Bereich entfernen',
        move: 'verschieben',
        apply: 'übernehmen',
        cancel: 'abbrechen',
        movePreview: 'Vorschau verschieben',
        invert: 'umkehren',
        motifThumb: 'ein Vorschaubild: Vorschau zum Platzieren',
        pan: 'verschieben',
        zoom: 'Zoom',
        hand: 'Hand',
        floatingMove: 'verschieben (Umschalt: 10 St.)',
        floatingAlign: 'beim Ziehen: Ausrichtung halten',
      },
      toolNames: {
        pencil: 'Stift (B)',
        eraser: 'Radierer (E)',
        line: 'Linie (L)',
        rect: 'Rechteck (R)',
        ellipse: 'Kreis / Ellipse (C)',
        text: 'Text (T)',
        select: 'Auswahl (S)',
        fill: 'Füllen (G)',
        picker: 'Pipette (I)',
        progress: 'Gestickte markieren (P)',
        motif: 'Motive (M)',
      },
      toolText: {
        pencil:
          'Zeichnet mit dem aktiven Garn. Eckiger oder runder Pinsel, 1 bis 15 Stiche, einstellbar in der Werkzeugleiste; jedes Werkzeug behält seine eigene Einstellung.',
        eraser: 'Löscht Stiche, mit eigenem eckigem oder rundem Pinsel.',
        fill: 'Füllt mit einem Klick den ganzen gleichfarbigen Bereich mit dem aktiven Garn.',
        picker: 'Nimmt das Garn eines Stichs im Stickmuster auf und macht es zum aktiven Garn.',
        line: 'Zieht eine gerade Linie: ziehen, dann loslassen. Sie erscheint als Vorschau: verschiebe, skaliere und drehe sie, dann übernimm (Enter).',
        rect: 'Zieht ein Rechteck, als Umriss oder gefüllt (Werkzeugleiste). Es erscheint als Vorschau zum Platzieren und Skalieren, dann zum Übernehmen (Enter); die nächste Form übernimmt die vorige.',
        ellipse:
          'Zieht einen Kreis oder eine Ellipse, als Umriss oder gefüllt. Vorschau zum Platzieren und Skalieren (die Linie bleibt scharf), dann übernehmen (Enter).',
        select:
          'Wählt einen frei geformten Bereich zum Verschieben, Kopieren oder Transformieren aus. Siehe Thema „Auswahl und Transformationen“.',
        text: 'Verwandelt Text in Stiche. Siehe Thema „Text“.',
        progress:
          'Markiert bereits gestickte Stiche. Im Modus Auto hebt das Beginnen auf einem markierten Stich die Markierung auf. Siehe „Stickfortschritt“.',
        motif:
          'Öffnet die Motivbibliothek (Buchstaben, Bordüren, Blumen…): Ein Klick auf ein Vorschaubild setzt das Motiv als Vorschau zum Platzieren, dann zum Übernehmen. Siehe „Motivbibliothek“.',
      },
      shortcuts: {
        undo: 'Rückgängig',
        redo: 'Wiederholen',
        copy: 'Auswahl kopieren',
        cut: 'Auswahl ausschneiden',
        paste: 'Einfügen (auch in einem anderen Tab)',
        selectAll: 'Alles auswählen',
        deselect: 'Auswahl aufheben',
        exportProject: 'Projekt als .json exportieren',
        print: 'Drucken / PDF',
        clear: 'Auswahl löschen (oder Rücktaste)',
        applyPreview: 'Vorschau übernehmen (Einfügen, Text, Transformation)',
        cancelPreview: 'Vorschau verwerfen / Auswahl aufheben / schließen',
        moveSelection: 'Auswahl oder Vorschau verschieben (Umschalt: 10 Stiche)',
        brushKeys: 'Pinsel verkleinern / vergrößern (die zwei Tasten rechts von P)',
        brushWheel: 'Pinselgröße ändern',
        zoom: 'Vergrößern / verkleinern (auch + und − im Ziffernblock)',
        hand: 'Hand: Ansicht durch Ziehen verschieben (oder mit rechter oder mittlerer Maustaste ziehen)',
        wheelZoom: 'Unter dem Cursor zoomen (oder auf dem Trackpad zusammenziehen)',
        wheelSideways: 'Ansicht waagerecht scrollen',
        redoAlt: 'Wiederholen (alternatives Kürzel)',
        shapeErase: 'Linie, Rechteck, Kreis: gezeichnete Form radieren',
        help: 'Hilfe öffnen (oder ?)',
        overlay: 'Referenzbild ein- / ausblenden',
        panels: 'Seitenleisten aus- / einblenden (Zeichnen im Vollbild)',
        pencil: 'Stift',
        eraser: 'Radierer',
        fill: 'Füllen',
        picker: 'Pipette',
        line: 'Linie',
        rect: 'Rechteck',
        ellipse: 'Kreis / Ellipse',
        select: 'Auswahl',
        text: 'Text',
        progress: 'Gestickte markieren',
        motif: 'Motive (Bibliothek)',
      },
      sections: {
        start: {
          title: 'Erste Schritte',
          keywords: 'anfangen beginnen neues projekt erstellen bild zoom rückgängig',
          body: (viewHints) => (
            <>
              <H>1. Ein Projekt erstellen</H>
              <P>
                Ein einziges Fenster <b>Erstellen</b>: Wähle den <b>Typ</b> (Projekt oder Bibliotheksmotiv),
                dann die <b>Quelle</b>. Die Einträge im Menü Datei und das „+“ der Tabs sind nur
                Abkürzungen, die es passend voreingestellt öffnen.
              </P>
              <UL>
                <li>
                  <b>Leer</b>: ein leeres Stickmuster (Größe in Stichen, Stoff, Stiche pro Zoll oder pro
                  cm).
                </li>
                <li>
                  <b>PDF-Muster</b> aus einer anderen Anwendung oder <b>.json-Datei</b> (ein exportiertes
                  Projekt oder Motiv).
                </li>
                <li>
                  <b>Bild</b>: verwandelt ein Foto oder eine Zeichnung in Kreuzstiche. Stil{' '}
                  <b>Illustration</b> für Zeichnungen und Farbflächen (scharfe Konturen, jeder Stich nimmt
                  die Hauptfarbe seines Bereichs) oder <b>Foto</b> für Verläufe. <b>Zuschneiden</b> entfernt
                  zum Beispiel die Schaltflächen eines Screenshots; „Kleine Bereiche vereinfachen“ lässt
                  kleine Flecken in der Nachbarfarbe aufgehen; standardmäßig wird der Hintergrund nur von
                  den Rändern her entfernt („Hintergrund auch innerhalb des Motivs entfernen“ für alles).
                </li>
                <li>Jedes neue Projekt öffnet sich in einem eigenen Tab.</li>
              </UL>
              <H>2. Garne wählen</H>
              <P>
                Öffne den DMC-Katalog über die Palette: Ein Klick fügt ein Garn hinzu, ein zweiter Klick
                entfernt es. Klicke dann ein Garn in der Palette an, um es zu aktivieren.
              </P>
              <H>3. Zeichnen</H>
              <P>
                Wähle ein Werkzeug in der linken Spalte: Seine Einstellungen erscheinen in der Leiste direkt
                über dem Stickmuster, mit seinen Tastenkürzeln. Die Kürzel-Chips{' '}
                <b>leuchten, solange die Taste gedrückt ist</b>.
              </P>
              <H>4. Was ist wo</H>
              <UL>
                <li>
                  <b>Oben</b>: das Menü Datei, der Projektname mit dem Zahnrad seiner Einstellungen
                  (Mustergröße, Stoff), „Drucken / PDF“, das Design (hell, dunkel oder auto), die Sprache
                  (FR, EN, ES, DE; die Seite lädt neu, ohne etwas zu verlieren), „Hilfe“{SUPPORT_ENABLED ? <> und „Unterstützen“ (Ko-fi)</> : null}.
                </li>
                <li>
                  <b>Musterleiste</b> (unter den Tabs): Rückgängig, Zoom, Anzeige, Raster, Druckseiten und
                  das <b>Referenzbild</b> (das Auge blendet es ein oder aus).
                </li>
                <li>
                  <b>Statusleiste</b> (ganz unten): Cursorposition, Rastergröße, fertige Größe und Stoff,
                  gesetzte und gestickte Stiche, Anzahl der Garne, Kürzel zum Bewegen, Speicherstatus und
                  bei Bedarf eine Erinnerung an die Sicherung.
                </li>
                <li>
                  <b>Werkzeugleiste</b>: die einfachen Einstellungen des aktiven Werkzeugs (Größe, Form…).
                </li>
                <li>
                  <b>Links, neben den Werkzeugen</b>: die ausführlichen Einstellungen für Text, Auswahl
                  (oder eine Vorschau zum Platzieren) und die Motivbibliothek. Der Pfeil klappt sie zu
                  einem schmalen Streifen ein.
                </li>
                <li>
                  <b>Rechts</b>: das Projekt, immer an derselben Stelle — Garne, Farbfilter,
                  Stickfortschritt. Klicke auf einen Titel, um seinen Abschnitt einzuklappen; lange Listen
                  scrollen.
                </li>
                <li>
                  <b>Motivbibliothek</b>: Werkzeug Motive (<Kbd k="M" />), um Buchstaben, Bordüren und
                  andere wiederverwendbare Elemente einzufügen.
                </li>
                <li>
                  <Kbd k="Tab" /> blendet beide Seitenleisten aus oder ein, um im ganzen Fenster zu
                  zeichnen.
                </li>
              </UL>
              <H>5. Bewegen</H>
              {viewHints}
              <P>
                Ziehen mit der rechten oder mittleren Maustaste verschiebt die Ansicht ebenfalls;{' '}
                <Kbd k="shift" /> + Mausrad scrollt waagerecht; Zusammenziehen auf dem Trackpad zoomt.
              </P>
              <H>6. Rückgängig</H>
              <P>
                <Kbd k="mod" /> + <Kbd k="Z" /> macht rückgängig, <Kbd k="mod" /> + <Kbd k="shift" /> +{' '}
                <Kbd k="Z" /> (oder <Kbd k="mod" /> + <Kbd k="Y" />) wiederholt. Jeder Tab hat seinen eigenen Verlauf.
              </P>
            </>
          ),
        },
        tool: {
          title: (name) => `Werkzeug: ${name}`,
          keywords: (tool) => `werkzeug ${tool} pinsel größe tastenkürzel`,
          shortcuts: 'Tastenkürzel',
        },
        selection: {
          title: 'Auswahl und Transformationen',
          keywords: 'auswahl verschieben kopieren einfügen griff drehen drehung spiegeln zurücksetzen vorschau übernehmen',
          body: (floatingHints) => (
            <>
              <H>Auswählen</H>
              <UL>
                <li>Ziehe, um einen Bereich aufzuziehen; ein einfacher Klick hebt die Auswahl auf.</li>
                <li>
                  <Kbd k="shift" /> + ziehen fügt einen Bereich hinzu, <Kbd k="alt" /> + ziehen entfernt
                  einen: Die Auswahl kann jede beliebige Form haben.
                </li>
                <li>
                  <Kbd k="mod" /> + <Kbd k="A" /> wählt alles aus, <Kbd k="mod" /> + <Kbd k="D" /> oder{' '}
                  <Kbd k="Échap" /> hebt die Auswahl auf.
                </li>
                <li>Entf oder Rücktaste löscht die ausgewählten Stiche.</li>
              </UL>
              <H>Die Vorschau: Nichts wird geschrieben, bevor du übernimmst</H>
              <P>
                Sobald du eine Auswahl verschiebst oder transformierst (oder einfügst, ein Muster
                einbettest, Text tippst), wird sie zu einer <b>halbtransparenten Vorschau</b>. Das Original
                bleibt abgeschwächt sichtbar. <Kbd k="Entrée" /> oder <b>Übernehmen</b> schreibt das
                Ergebnis in einem einzigen Rückgängig-Schritt; <Kbd k="Échap" /> oder <b>Abbrechen</b>{' '}
                stellt alles wieder her.
              </P>
              <H>Verschieben</H>
              {floatingHints}
              <H>Transformieren</H>
              <UL>
                <li>
                  <b>Griffe</b>: Die Ecken behalten die Proportionen (<Kbd k="shift" /> zum Lösen), die
                  Seiten ändern nur eine Dimension.
                </li>
                <li>
                  Eine Kante <b>über die gegenüberliegende hinaus</b> ziehen spiegelt das Motiv.
                </li>
                <li>
                  <b>Drehen</b>: knapp außerhalb einer Ecke ziehen (Cursor mit gebogenem Pfeil), in
                  Vierteldrehungen.
                </li>
                <li>
                  Die <b>Schnellleiste</b> unter der Auswahl bietet Spiegeln, Drehen, ÷2, ×2,{' '}
                  <b>Zurücksetzen</b> (zurück zum Ausgangszustand) und Übernehmen / Abbrechen.
                </li>
                <li>Die Größenfelder der Auswahl-Leiste wirken sofort und verlustfrei.</li>
              </UL>
              <H>Zwischen Projekten kopieren</H>
              <P>
                Kopiere in einem Tab, füge in einem anderen ein: Die Garne werden über ihre DMC-Nummer
                zugeordnet (hinzugefügt, wenn sie fehlen, entfernt, wenn du abbrichst).
              </P>
            </>
          ),
        },
        text: {
          title: 'Text',
          keywords: 'text schrift schriftart google system bogen kontur schatten rahmen unterstrichen großbuchstaben ausrichtung schwelle',
          body: () => (
            <>
              <P>
                Tippe mit dem Text-Werkzeug in die Leiste links neben den Werkzeugen: Der Text erscheint{' '}
                <b>live im Stickmuster</b> als Vorschau, mit allen Werkzeugen der Auswahl (ziehen, Griffe,
                Drehen, Spiegeln). <Kbd k="Entrée" /> oder „Übernehmen“ schreibt ihn.
              </P>
              <H>Schriften</H>
              <UL>
                <li>Der ganze Google-Fonts-Katalog (über 1.800 Schriften) mit Suche und Kategorien.</li>
                <li>
                  Tab <b>System</b>: die auf dem Computer installierten Schriften. In Chrome und der
                  Desktop-App zeigt „Alle installierten Schriften auflisten“ sie alle an.
                </li>
                <li>„Pixel“-Schriften bleiben auch sehr klein scharf.</li>
              </UL>
              <H>Größe und Darstellung</H>
              <UL>
                <li>
                  <b>Höhe</b> in Stichen, <b>Abstand</b> zwischen Buchstaben, <b>Zeilenabstand</b>.
                </li>
                <li>
                  <b>Schwelle</b>: Je niedriger, desto mehr feine Striche bleiben erhalten (aber desto
                  dicker wird der Text).
                </li>
              </UL>
              <H>Formatierung und Effekte</H>
              <UL>
                <li>Ausrichtung links / zentriert / rechts, Großbuchstaben, unterstrichen, durchgestrichen.</li>
                <li>
                  <b>Bogen</b>: von konkav bis konvex.
                </li>
                <li>
                  <b>Kontur</b>, <b>Schatten</b> und <b>Rahmen</b>, jeweils in einem eigenen Garn der
                  Palette.
                </li>
              </UL>
              <P>Jeder Regler hat ein ↺ (oder Doppelklick), um zum Standardwert zurückzukehren.</P>
            </>
          ),
        },
        reference: {
          title: 'Referenzbild (ein Bild abpausen)',
          keywords: 'referenzbild referenz bild ebene abpausen durchpausen transparenz deckkraft nachsticken',
          body: () => (
            <>
              <P>
                Lege ein Bild halbtransparent über das Stickmuster, um es selbst Stich für Stich
                nachzuarbeiten, statt es automatisch umzuwandeln.
              </P>
              <UL>
                <li>
                  Schaltfläche <b>Referenzbild</b> in der Musterleiste (unter den Tabs). Drag & Drop funktioniert auch.
                </li>
                <li>
                  Einstellbare <b>Deckkraft</b>; <b>Unter Stichen</b> (deine Stiche verdecken das Bild)
                  oder <b>Darüber</b> (wie Pauspapier).
                </li>
                <li>
                  <b>Platzieren</b>: Ziehe das Bild, um es zu verschieben, ziehe an einer Ecke, um es zu
                  skalieren (Proportionen bleiben, <Kbd k="shift" /> zum Lösen). <Kbd k="Entrée" /> oder{' '}
                  <Kbd k="Échap" /> zum Beenden. <b>Einpassen</b> setzt es auf die Mustergröße zurück;{' '}
                  <b>Zuschneiden</b> behält nur einen Teil.
                </li>
                <li>
                  <Kbd k="H" /> blendet das Referenzbild ein oder aus.
                </li>
                <li>
                  Das Referenzbild wird nie gedruckt oder mitgezählt. Es wird mit dem Projekt in diesem
                  Browser gespeichert, aber nicht im .json-Export.
                </li>
              </UL>
            </>
          ),
        },
        threads: {
          title: 'Garne und Farben',
          keywords: 'garn faden dmc farbe palette symbol ersetzen filter katalog',
          body: () => (
            <>
              <UL>
                <li>
                  <b>DMC-Katalog</b>: Suche nach Nummer oder Name, Sortierung nach Farbton, Entsprechung
                  für eine beliebige Farbe. Ein Klick fügt ein Garn hinzu, ein zweiter Klick entfernt es
                  (mit Rückfrage, wenn es verwendet wird).
                </li>
                <li>
                  Ein Garn durch ein anderes <b>ersetzen</b>: Ist das neue schon in der Palette, werden
                  beide zusammengeführt.
                </li>
                <li>Jedes Garn hat ein Symbol, das im Stickmuster und beim Drucken verwendet wird.</li>
                <li>
                  Der <b>Farbfilter</b> hebt bestimmte Garne hervor oder blendet sie ab, um Farbe für Farbe
                  zu sticken.
                </li>
              </UL>
            </>
          ),
        },
        progress: {
          title: 'Stickfortschritt',
          keywords: 'fortschritt markieren gestickt erledigt aufheben verfolgen',
          body: () => (
            <>
              <UL>
                <li>
                  Das Werkzeug <b>Markieren</b> (P) hakt bereits gestickte Stiche ab, mit eckigem oder
                  rundem Pinsel.
                </li>
                <li>
                  Modus <b>Auto</b>: Beginnt man auf einem bereits markierten Stich, wird die Markierung
                  aufgehoben, sonst wird markiert. Modi <b>Markieren</b> / <b>Aufheben</b> zum Erzwingen;{' '}
                  <Kbd k="alt" /> kehrt um.
                </li>
                <li>
                  Die Leiste Fortschritt zeigt den Gesamtfortschritt und den pro Farbe; jede Farbe hat ihre
                  Schaltfläche „Alle“ („Rückgängig“, sobald fertig), und ↻ „Alles zurücksetzen“ löscht den
                  ganzen Fortschritt.
                </li>
                <li>Ein Markierungsstrich wird in einem Schritt rückgängig gemacht.</li>
              </UL>
            </>
          ),
        },
        print: {
          title: 'Drucken und PDF',
          keywords: 'drucken pdf blatt seite a4 hochformat querformat legende mitte anschluss kopfzeile fußzeile',
          body: () => (
            <>
              <UL>
                <li>
                  Wähle die <b>Anzahl der A4-Blätter</b> (oder <b>Auto</b>: möglichst wenige Blätter mit
                  Stichen von mindestens 3 mm). Hoch- oder Querformat wird automatisch gewählt, damit die
                  Stiche so groß wie möglich sind.
                </li>
                <li>
                  Schaltfläche <b>Blätter</b> in der Musterleiste: die Aufteilung direkt im Stickmuster
                  sehen und anpassen.
                </li>
                <li>
                  Jede Seite hat <b>Mittelpfeile und -linien</b>, Nummern alle 10 Stiche an allen 4 Rändern
                  und wiederholt schraffiert die letzte Zeile / Spalte der Nachbarseite als Anschluss.
                </li>
                <li>
                  Die <b>Legende</b> listet die Garne, die Stichzahl, die geschätzte Garnlänge und den
                  Montageplan.
                </li>
                <li>
                  Optionen: Darstellung „Farbe“ oder „S/W“, „Symbole“, „Mittellinien“, „Garnlegende“ und
                  „Gestickte Stiche markieren“.
                </li>
                <li>
                  Für ein PDF: „Drucken / PDF“, dann „Als PDF speichern“. Deaktiviere{' '}
                  <b>„Kopf- und Fußzeilen“</b> in den Optionen von Chrome, um Datum und Adresse zu
                  entfernen.
                </li>
              </UL>
            </>
          ),
        },
        motifs: {
          title: 'Motivbibliothek',
          keywords:
            'motiv bibliothek element buchstabe alphabet bordüre rand blume ordner baum kategorie einfügen wiederverwenden verwaltung ziehen',
          body: () => (
            <>
              <P>
                Motive sind kleine wiederverwendbare Elemente (Buchstaben, Bordüren, Blumen…), die getrennt
                von den Projekten in <b>Ordnern</b> liegen und sich in jedes Projekt einfügen lassen.
              </P>
              <H>Das Werkzeug Motive: durchsuchen und einfügen</H>
              <UL>
                <li>
                  Werkzeug <b>Motive</b> (<Kbd k="M" />): Die linke Leiste öffnet sich im zuletzt besuchten
                  Ordner. Klicke auf einen Ordner, um ihn zu öffnen, auf den Pfad, um zurückzugehen; die
                  Suche umfasst die ganze Bibliothek.
                </li>
                <li>
                  Ein Klick auf ein Vorschaubild setzt das Motiv als <b>Vorschau</b>: verschieben,
                  skalieren, drehen, dann <Kbd k="Entrée" />. Ein Klick auf ein anderes Vorschaubild ersetzt
                  die Vorschau.
                </li>
                <li>
                  <b>Originalfarben</b> (fehlende Garne werden der Palette hinzugefügt) oder{' '}
                  <b>Aktives Garn</b> (das ganze Motiv im gewählten Garn). Eine Änderung färbt die aktuelle
                  Vorschau neu ein.
                </li>
              </UL>
              <H>Die Verwaltung: ordnen</H>
              <UL>
                <li>
                  Datei → „Motivbibliothek…“ oder „Bibliothek verwalten…“ im Werkzeug. Links der
                  Ordnerbaum, rechts der Inhalt des gewählten Ordners.
                </li>
                <li>
                  <b>+ Ordner</b> und <b>+ Motiv ▾</b>: leer, aus einem Bild, einem PDF-Stickmuster oder
                  einer .json-Datei, abgelegt im angezeigten Ordner. Doppelklick auf einen Namen zum
                  Umbenennen; Menü ⋯ für den Rest (darunter „In ein Projekt umwandeln“, das wieder ein
                  Projekt daraus macht).
                </li>
                <li>
                  Ein Motiv oder einen Ordner per <b>Drag & Drop</b> auf einen Ordner im Baum ziehen, um es
                  dort abzulegen. Klick zum Auswählen, <Kbd k="mod" /> oder <Kbd k="shift" /> + Klick für
                  mehrere, dann „Verschieben nach…“ oder „Löschen“.
                </li>
                <li>
                  Zwei Ordner am selben Ort können nicht gleich heißen (Groß-/Kleinschreibung und Akzente
                  ignoriert): kein „Blumen“ und „blumen“ aus Versehen.
                </li>
                <li>
                  Beim Löschen eines nicht leeren Ordners kannst du seinen Inhalt behalten (in den
                  übergeordneten Ordner verschoben) oder alles löschen.
                </li>
              </UL>
              <H>Ein Motiv erstellen</H>
              <UL>
                <li>
                  Stiche auswählen, dann „Als Motiv speichern“ (Auswahl-Leiste) oder „Auswahl als Motiv
                  speichern“ (Werkzeug Motive): ein
                  Name und ein im Baum gewählter (oder direkt erstellter) Ordner.
                </li>
                <li>
                  Datei → „Neues Motiv…“ oder „+ Motiv ▾“ in der Verwaltung: das Fenster Erstellen, mit
                  denselben Quellen wie für ein Projekt.
                </li>
                <li>Ein bestehendes Projekt: Meine Projekte → ⋯ → „In die Bibliothek verschieben…“.</li>
                <li>„Bearbeiten“ öffnet ein Motiv in einem Tab mit der Markierung „Motiv“.</li>
              </UL>
            </>
          ),
        },
        projects: {
          title: 'Projekte, Tabs und Import',
          keywords: 'projekt tab öffnen einbetten einfügen duplizieren exportieren importieren json datei pdf stickmuster',
          body: () => (
            <>
              <UL>
                <li>
                  <b>Tabs</b>: mehrere Projekte gleichzeitig offen; jedes behält seinen Verlauf und seinen
                  Bildausschnitt. Das <b>+</b> erstellt oder öffnet ein Projekt in einem neuen Tab.
                </li>
                <li>
                  <b>Meine Projekte</b>: <b>Öffnen</b> (neuer Tab, oder ▾, um den aktuellen Tab zu ersetzen) ·{' '}
                  <b>Einfügen</b> (das Muster als Vorschau zum Platzieren in das angezeigte Projekt
                  kopieren) · ⋯ zum Duplizieren, Exportieren, Löschen oder{' '}
                  <b>In die Bibliothek verschieben</b>.
                </li>
                <li>
                  <b>Projekt oder Motiv</b>: Ein Projekt ist ein vollständiges Stickmuster; ein Motiv ist
                  ein kleines wiederverwendbares Element in der Bibliothek des Werkzeugs Motive. „Meine
                  Projekte“ listet nur Projekte; ein in einem Tab geöffnetes Motiv trägt die Markierung{' '}
                  <b>Motiv</b>.
                </li>
                <li>
                  <b>Menü Datei</b>: <b>Erstellen</b> (Abkürzungen zum Fenster Erstellen: neues Projekt,
                  neues Motiv, aus einem Bild, aus einem PDF-Muster) · <b>Meine Dateien</b> (Meine
                  Projekte, Motivbibliothek) · <b>Sicherung (.json)</b> (ein Projekt exportieren oder öffnen, alles
                  sichern, wiederherstellen).
                </li>
                <li>
                  <b>PDF-Stickmuster einer anderen Anwendung</b>: Datei → „Aus einem PDF-Muster…“. Die
                  App liest das Deckblatt (Größe, Stoff), die Legende (DMC-Nummern, Stichzahlen) und jeden
                  Abschnitt und zeigt dann eine Prüfung (gefundene / angegebene Stiche), bevor das Projekt
                  in einem Tab geöffnet wird. Nur ganze Kreuzstiche werden übernommen; PDFs anderer
                  Programme werden eventuell nicht erkannt.
                </li>
              </UL>
            </>
          ),
        },
        storage: {
          title: 'Wo sind meine Daten?',
          keywords: 'speicher sicherung backup daten localstorage indexeddb browser verloren verschwunden export voll erinnerung offline installieren',
          body: () => (
            <>
              <UL>
                <li>
                  Projekte werden <b>automatisch gespeichert</b>, in der Datenbank des Browsers
                  (IndexedDB) auf deinem Gerät, spätestens 10 Sekunden nach einer Änderung (auch wenn du weiterzeichnest) und sofort,
                  wenn du den Tab wechselst, das Fenster minimierst oder die Seite schließt.
                </li>
                <li>
                  Dieser Speicher gehört zu <b>diesem Browser, diesem Profil und dieser Adresse</b> (zum
                  Beispiel <code>stitchnook.github.io</code>). Ein anderer Browser, ein anderes Chrome-Profil
                  oder eine andere Adresse sehen nicht dieselben Projekte. Die Desktop-App hat ihren eigenen
                  Speicher.
                </li>
                <li>
                  <b>Nichts wird ins Internet gesendet</b>, außer dem Herunterladen der Google-Schriften für
                  das Text-Werkzeug.
                </li>
                <li>
                  <b>Alles sichern</b> (Menü Datei, „Sicherung (.json)“): alle Projekte, Motive und Ordner in einer
                  einzigen .json-Datei. Um Computer oder Browser zu wechseln, öffne sie dort mit{' '}
                  <b>Sicherung wiederherstellen…</b>: Fehlendes wird hinzugefügt, nichts wird
                  überschrieben (außer du entscheidest dich, ältere Versionen zu ersetzen), und offene
                  Projekte bleiben immer unberührt.
                </li>
                <li>
                  Ein einzelnes Projekt: <b>Dieses Projekt exportieren</b> (<Kbd k="mod" /> + <Kbd k="S" />),
                  dann „Exportiertes Projekt öffnen…“. Ein exportiertes Motiv wird mit dem Typ
                  „Bibliotheksmotiv“ (oder über die Motivverwaltung) wieder importiert; ohne gewählten
                  Ordner kommt es in seinen eigenen zurück.
                </li>
                <li>
                  <b>Sicherungserinnerung</b>: Wenn sich Projekte geändert haben und seit über 14 Tagen
                  keine vollständige Sicherung erstellt wurde, bietet die Statusleiste „Sichern“ (lädt eine
                  vollständige Sicherung herunter) oder „Später“ (blendet die Erinnerung 7 Tage aus) an.
                </li>
                <li>
                  <b>Offline</b>: Sobald die Seite geladen ist, funktioniert die App ohne Verbindung und
                  lässt sich über den Browser installieren. Nur noch nicht verwendete Google-Schriften
                  brauchen eine Verbindung.
                </li>
                <li>
                  Das Löschen der Website-Daten im Browser löscht die Projekte, und Safari kann die Daten
                  einer Website löschen, die mehrere Wochen nicht besucht wurde (außer bei installierter
                  App). Die vollständige Sicherung ist die einzige Kopie, die nicht vom Browser abhängt:
                  Erstelle sie regelmäßig.
                </li>
                <li>
                  Es gibt reichlich Platz (ein Teil der Festplatte); wird er doch knapp, weist eine Meldung
                  darauf hin: Sichere, dann lösche alte Projekte.
                </li>
              </UL>
            </>
          ),
        },
        shortcuts: {
          title: 'Tastenkürzel',
          keywords: 'tastenkürzel tastatur taste kürzel',
          intro: () => (
            <>
              Kürzel auf Symboltasten richten sich nach der <b>Position</b> der Tasten, nicht nach dem
              Zeichen: Sie bleiben auf jeder Tastatur ohne Zusatztaste erreichbar. Auf einer deutschen
              QWERTZ-Tastatur stellst du den Pinsel so mit <b>Ü</b> und <b>+</b> ein (bei einem Werkzeug ohne Pinsel zoomt <b>+</b>). In Chrome und der
              Desktop-App sind die hier angezeigten Tasten die deiner Tastatur.
            </>
          ),
        },
      },
      center: {
        title: 'Hilfe',
        search: 'Suchen (pdf, text, speicher…)',
        noMatch: 'Kein Thema passt.',
      },
    },
  },
)
