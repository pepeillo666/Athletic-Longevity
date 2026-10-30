// Übungskatalog: deutsche Namen, Einstellung, Ausführung, Atmung, Hinweise.

export const GENERAL_CUES = [
  'Gleichmäßig weiteratmen und nie die Luft anhalten (keine Pressatmung).',
  'Langsam und kontrolliert: etwa 2 Sekunden hin, 2–3 Sekunden zurück.',
  'Griffe locker halten, nicht verkrampfen.',
  'Den Satz beenden, solange die Technik sauber ist – kein Satz bis zur Erschöpfung.',
  'Beim ersten Mal das Gerät vom Trainingspersonal einstellen lassen.',
];

export const EXERCISES = {
  legpress: {
    name: 'Beinpresse',
    muscles: 'Oberschenkel vorn und hinten, Gesäß',
    equipment: 'Beinpressen-Gerät',
    setup: [
      'Rückenlehne so einstellen, dass Knie und Hüfte in der Ausgangsposition etwa rechtwinklig gebeugt sind.',
      'Füße hüftbreit und mittig auf die Fußplatte stellen, die Fußspitzen zeigen leicht nach außen.',
      'Gesäß und unteren Rücken fest an die Lehne bringen, Griffe locker fassen.',
    ],
    steps: [
      'Ausatmen und die Platte gleichmäßig über die ganze Fußsohle wegdrücken.',
      'Die Beine fast strecken – die Knie dabei nicht ganz durchdrücken.',
      'Einatmen und die Platte langsam zurückführen, bis die Knie wieder etwa rechtwinklig gebeugt sind.',
    ],
    breathing: 'Ausatmen beim Wegdrücken, einatmen beim Zurückführen.',
    focus: [
      'Die Knie zeigen in Richtung der Fußspitzen und kippen nicht nach innen.',
      'Die Fersen bleiben auf der Platte.',
      'Der untere Rücken löst sich nicht von der Lehne – lieber weniger tief beugen.',
    ],
    safety: ['Nach dem Satz kurz sitzen bleiben und dann langsam aufstehen.'],
  },

  chestpress: {
    name: 'Brustpresse',
    muscles: 'Brust, vordere Schulter, Trizeps',
    equipment: 'Brustpressen-Gerät',
    setup: [
      'Sitzhöhe so einstellen, dass die Griffe etwa auf Höhe der Brustmitte liegen.',
      'Rücken an die Lehne, Füße fest auf den Boden.',
      'Griffe locker fassen, die Schultern locker nach unten und leicht zurück.',
    ],
    steps: [
      'Ausatmen und die Griffe gleichmäßig nach vorn drücken.',
      'Die Arme fast strecken – die Ellenbogen nicht durchdrücken.',
      'Einatmen und langsam zurückführen, bis die Hände wieder etwa vor der Brust sind.',
    ],
    breathing: 'Ausatmen beim Drücken, einatmen beim Zurückführen.',
    focus: [
      'Die Ellenbogen bleiben etwas unterhalb der Schulterhöhe.',
      'Kopf und Rücken bleiben an der Lehne, kein Hohlkreuz.',
      'Nur so weit zurückführen, wie es angenehm ist – keine maximale Dehnung.',
    ],
    safety: [
      'Ziehen oder Schmerz an Brustbein oder Narbe: Übung auslassen und ärztlich abklären lassen.',
      'Druck oder Enge in der Brust ist ein Warnzeichen – Training sofort beenden.',
    ],
  },

  chestpress_light: {
    name: 'Brustpresse leicht',
    baseId: 'chestpress',
    note: 'Gleiche Übung wie in Training A, aber bewusst etwas leichter – zum Beispiel eine Gewichtsstufe weniger.',
  },

  row: {
    name: 'Rudern sitzend',
    muscles: 'Oberer Rücken, hintere Schulter, Bizeps',
    equipment: 'Rudergerät oder Kabelzug mit Sitz',
    setup: [
      'Sitz bzw. Brustpolster so einstellen, dass du die Griffe mit fast gestreckten Armen erreichst.',
      'Aufrecht sitzen, die Füße fest abstellen, die Knie leicht gebeugt.',
    ],
    steps: [
      'Ausatmen und die Griffe Richtung Bauch ziehen, die Ellenbogen dabei nah am Körper nach hinten führen.',
      'Am Ende die Schulterblätter sanft zusammenführen.',
      'Einatmen und die Arme langsam wieder nach vorn strecken.',
    ],
    breathing: 'Ausatmen beim Ziehen, einatmen beim Zurückführen.',
    focus: [
      'Der Oberkörper bleibt ruhig – kein Schwungholen nach hinten.',
      'Schultern nicht hochziehen, Handgelenke gerade.',
      'Der Rücken bleibt aufrecht, auch beim Zurückführen.',
    ],
    safety: [],
  },

  legcurl: {
    name: 'Beinbeuger sitzend',
    muscles: 'Rückseite der Oberschenkel',
    equipment: 'Beinbeuger-Gerät (sitzend)',
    setup: [
      'Die Drehachse des Geräts auf Höhe der Kniegelenke ausrichten.',
      'Beinpolster knapp oberhalb der Fersen. Das Oberschenkelpolster fixiert die Oberschenkel, ohne zu drücken.',
      'Rücken an die Lehne, Griffe locker fassen.',
    ],
    steps: [
      'Ausatmen und die Unterschenkel kontrolliert nach unten und hinten beugen.',
      'Kurz in der Endposition bleiben – dabei weiteratmen.',
      'Einatmen und die Beine langsam zurückführen, ohne dass das Gewicht aufschlägt.',
    ],
    breathing: 'Ausatmen beim Beugen, einatmen beim Zurückführen.',
    focus: [
      'Die Bewegung kommt nur aus dem Kniegelenk, die Hüfte bleibt auf dem Sitz.',
      'Beim Zurückführen die Knie nicht ruckartig durchdrücken.',
    ],
    safety: [],
  },

  lateralraise: {
    name: 'Seitheben mit leichten Kurzhanteln',
    shortName: 'Seitheben',
    muscles: 'Seitliche Schulter',
    equipment: 'Leichte Kurzhanteln, z. B. 1–3 kg',
    weightLabel: 'kg je Hantel',
    setup: [
      'Sehr leichte Kurzhanteln wählen.',
      'Aufrecht auf eine Bank mit Rückenlehne setzen oder hüftbreit stehen, die Knie leicht gebeugt.',
      'Die Arme hängen seitlich, Ellenbogen leicht gebeugt, Handflächen zeigen zum Körper.',
    ],
    steps: [
      'Ausatmen und die Arme seitlich anheben, bis sie etwa auf Schulterhöhe sind – nicht höher.',
      'Einatmen und die Arme langsam wieder absenken.',
    ],
    breathing: 'Ausatmen beim Anheben, einatmen beim Absenken.',
    focus: [
      'Die Schultern bleiben unten und werden nicht zu den Ohren gezogen.',
      'Kein Schwung aus dem Oberkörper.',
      'Hanteln locker halten, Handgelenke gerade.',
    ],
    safety: ['Bei Schulterschmerzen den Bewegungsumfang verkleinern oder die Übung auslassen.'],
  },

  calfraise: {
    name: 'Wadenheben sitzend',
    muscles: 'Waden',
    equipment: 'Wadenheber-Gerät (sitzend)',
    setup: [
      'Die Fußballen auf die Trittkante stellen, die Fersen sind frei.',
      'Die Knie unter das Polster, es liegt knapp über den Knien auf den Oberschenkeln.',
      'Falls vorhanden: den Sicherungshebel lösen.',
    ],
    steps: [
      'Ausatmen und die Fersen so weit wie angenehm nach oben drücken.',
      'Kurz oben bleiben – dabei weiteratmen.',
      'Einatmen und die Fersen langsam absenken, bis eine leichte Dehnung in der Wade spürbar ist.',
    ],
    breathing: 'Ausatmen beim Hochdrücken, einatmen beim Absenken.',
    focus: [
      'Gleichmäßiges Tempo, nicht wippen.',
      'Am Satzende den Sicherungshebel wieder einlegen.',
    ],
    safety: [],
    alternative: 'Kein Gerät frei? Nach Einweisung ist Wadenheben auch an der Beinpresse möglich.',
  },

  legext: {
    name: 'Beinstrecker',
    muscles: 'Vordere Oberschenkel',
    equipment: 'Beinstrecker-Gerät',
    setup: [
      'Die Drehachse des Geräts auf Höhe der Kniegelenke ausrichten.',
      'Die Rückenlehne so einstellen, dass die Kniekehlen am Sitzende anliegen.',
      'Das Fußpolster liegt vorn am unteren Schienbein, knapp über den Füßen.',
    ],
    steps: [
      'Griffe locker fassen. Ausatmen und die Unterschenkel kontrolliert nach vorn oben strecken.',
      'Die Beine fast strecken – nicht ruckartig durchdrücken.',
      'Einatmen und langsam absenken, ohne dass das Gewicht aufschlägt.',
    ],
    breathing: 'Ausatmen beim Strecken, einatmen beim Absenken.',
    focus: ['Das Gesäß bleibt auf dem Sitz.', 'Ruhiges Tempo, kein Schwung.'],
    safety: ['Bei Knieschmerzen den Bewegungsumfang verkleinern oder das Gewicht reduzieren.'],
  },

  latpull: {
    name: 'Latzug zur Brust',
    shortName: 'Latzug',
    muscles: 'Breiter Rückenmuskel, Bizeps',
    equipment: 'Latzug-Gerät',
    setup: [
      'Das Oberschenkelpolster so einstellen, dass die Oberschenkel fest darunter liegen.',
      'Die Stange etwas weiter als schulterbreit greifen.',
      'Aufrecht sitzen, den Oberkörper nur minimal zurücklehnen.',
    ],
    steps: [
      'Ausatmen und die Stange vor dem Gesicht zur oberen Brust ziehen, die Ellenbogen zeigen nach unten.',
      'Einatmen und die Stange langsam nach oben zurückführen, bis die Arme fast gestreckt sind.',
    ],
    breathing: 'Ausatmen beim Ziehen, einatmen beim Zurückführen.',
    focus: [
      'Immer vor dem Kopf ziehen, nie in den Nacken.',
      'Die Schultern bleiben unten, kein Schwung aus dem Oberkörper.',
      'Zum Aufstehen die Stange erst kontrolliert ganz nach oben zurückführen.',
    ],
    safety: [],
  },

  abduction: {
    name: 'Hüftabduktoren-Maschine',
    shortName: 'Abduktoren',
    muscles: 'Äußere Hüfte, seitliches Gesäß',
    equipment: 'Abduktoren-Gerät',
    setup: [
      'Die Ausgangsposition so einstellen, dass die Beine geschlossen sind und die Polster außen an Knien bzw. Oberschenkeln anliegen.',
      'Aufrecht sitzen, Rücken an der Lehne, Griffe locker fassen.',
    ],
    steps: [
      'Ausatmen und die Beine gleichmäßig nach außen drücken, so weit es angenehm ist.',
      'Einatmen und langsam zurückführen, ohne dass das Gewicht aufschlägt.',
    ],
    breathing: 'Ausatmen beim Öffnen, einatmen beim Schließen.',
    focus: ['Der Oberkörper bleibt ruhig an der Lehne.', 'Gleichmäßiges Tempo in beide Richtungen.'],
    safety: [],
  },

  reversefly: {
    name: 'Reverse Butterfly',
    muscles: 'Hintere Schulter, oberer Rücken',
    equipment: 'Butterfly-Gerät in Reverse-Einstellung',
    setup: [
      'Mit der Brust zum Polster setzen.',
      'Die Sitzhöhe so einstellen, dass die Griffe etwa auf Schulterhöhe sind.',
      'Bei Kombigeräten die Hebel in die Reverse-Position stellen.',
    ],
    steps: [
      'Die Griffe mit leicht gebeugten Armen fassen.',
      'Ausatmen und die Arme in einem weiten Bogen nach hinten führen, bis sie etwa in Linie mit dem Oberkörper sind.',
      'Einatmen und langsam zurückführen.',
    ],
    breathing: 'Ausatmen beim Öffnen der Arme, einatmen beim Zurückführen.',
    focus: [
      'Die Schultern bleiben unten.',
      'Ellenbogen leicht gebeugt, nicht über die Körperlinie hinaus nach hinten ziehen.',
      'Am Ende die Schulterblätter sanft zusammenführen.',
    ],
    safety: [],
  },

  triceps: {
    name: 'Trizepsdrücken am Kabel',
    shortName: 'Trizepsdrücken',
    muscles: 'Rückseite der Oberarme',
    equipment: 'Kabelzug oben, mit Seil oder Stange',
    setup: [
      'Seil oder Stange am oberen Kabelzug befestigen.',
      'Aufrecht vor den Kabelzug stellen, Füße hüftbreit, Knie leicht gebeugt.',
      'Die Oberarme liegen seitlich am Körper, die Ellenbogen sind etwa rechtwinklig gebeugt.',
    ],
    steps: [
      'Ausatmen und die Unterarme nach unten strecken, bis die Arme fast gestreckt sind.',
      'Einatmen und langsam zurückführen, bis die Ellenbogen wieder etwa rechtwinklig gebeugt sind.',
    ],
    breathing: 'Ausatmen beim Strecken, einatmen beim Zurückführen.',
    focus: [
      'Die Ellenbogen bleiben am Körper.',
      'Oberkörper aufrecht – nicht mit dem Körpergewicht nachdrücken.',
      'Handgelenke gerade.',
    ],
    safety: [],
  },

  biceps: {
    name: 'Bizepscurls am Kabel',
    shortName: 'Bizepscurls',
    muscles: 'Vorderseite der Oberarme',
    equipment: 'Kabelzug unten, mit Stange oder Seil',
    optional: true,
    optionalFromWeek: 5,
    setup: [
      'Stange oder Seil am unteren Kabelzug befestigen.',
      'Aufrecht stehen, Füße hüftbreit, Knie leicht gebeugt.',
      'Den Griff von unten fassen, die Oberarme liegen am Körper.',
    ],
    steps: [
      'Ausatmen und die Unterarme beugen, den Griff Richtung Schultern führen.',
      'Einatmen und langsam wieder absenken, bis die Arme fast gestreckt sind.',
    ],
    breathing: 'Ausatmen beim Beugen, einatmen beim Absenken.',
    focus: ['Die Ellenbogen bleiben am Körper.', 'Kein Schwung aus Rücken oder Hüfte.'],
    safety: [],
  },
};

// Variante „leicht“ übernimmt Anleitung und Bild der Grundübung.
for (const [id, ex] of Object.entries(EXERCISES)) {
  ex.id = id;
  if (ex.baseId) {
    const base = EXERCISES[ex.baseId];
    for (const key of ['muscles', 'equipment', 'setup', 'steps', 'breathing', 'focus', 'safety', 'weightLabel']) {
      if (ex[key] === undefined && base[key] !== undefined) ex[key] = base[key];
    }
  }
  ex.weightLabel = ex.weightLabel || 'kg';
  ex.shortName = ex.shortName || ex.name;
}

export const WORKOUTS = {
  A: {
    name: 'Training A',
    exercises: ['legpress', 'chestpress', 'row', 'legcurl', 'lateralraise', 'calfraise'],
  },
  B: {
    name: 'Training B',
    exercises: ['legext', 'latpull', 'chestpress_light', 'abduction', 'reversefly', 'triceps', 'biceps'],
  },
};

export const EXERCISE_ORDER = [...WORKOUTS.A.exercises, ...WORKOUTS.B.exercises];

export function exerciseName(id, short = false) {
  const ex = EXERCISES[id];
  if (!ex) return id;
  return short ? ex.shortName : ex.name;
}
