// Texte: Sicherheit, Belastungsskala, Ablauf, Tipps. Allgemein gehalten, ohne persönliche Gesundheitsangaben.

export const DISCLAIMER =
  'Athletic Longevity ist ein allgemeiner Trainingsplan für den Einstieg und Wiedereinstieg ins Krafttraining. ' +
  'Die App ersetzt keine ärztliche oder physiotherapeutische Beratung. Lass vor Beginn abklären, ob das Training für dich geeignet ist – ' +
  'besonders bei Vorerkrankungen, Beschwerden oder nach einer längeren Pause.';

export const EMERGENCY_SHORT =
  'Bei starken oder anhaltenden Beschwerden wie Brustschmerzen oder Atemnot sofort den Notruf 112 wählen – im Zweifel lieber einmal zu viel.';

export const SKIP_WEEKS_NOTE = 'Wochen nicht überspringen – spätere Wochen sind deutlich intensiver.';

export const WARNING_SIGNS = [
  'Schmerzen, Druck oder Engegefühl in der Brust',
  'Ungewöhnliche Atemnot',
  'Schwindel, Benommenheit oder Sehstörungen',
  'Herzrasen oder unregelmäßiger Herzschlag',
  'Übelkeit, kalter Schweiß oder Blässe',
  'Plötzliche, starke Schmerzen in Muskeln oder Gelenken',
];

export const EMERGENCY_STEPS = [
  'Training sofort beenden und hinsetzen oder hinlegen.',
  'Das Personal im Studio informieren und nicht allein bleiben.',
  'Bei starken oder anhaltenden Beschwerden sofort den Notruf 112 wählen – im Zweifel lieber einmal zu viel.',
  'Nicht selbst Auto fahren.',
  'Auch wenn die Beschwerden abklingen: vor dem nächsten Training ärztlich abklären lassen.',
];

export const PRINCIPLES = [
  'Die Belastung über dein Empfinden (RPE) und den Sprechtest steuern.',
  'Keine Maximalversuche und kein Satz bis zur Erschöpfung.',
  'Nie die Luft anhalten oder pressen: ausatmen bei Anstrengung, einatmen beim Zurückführen.',
  'Jedes Training mit Aufwärmen beginnen und mit Abwärmen beenden – nicht abrupt aufhören.',
  'Gewichte nur in kleinen Schritten steigern – und nur, wenn Technik und Befinden gut sind.',
  'Fühlt sich ein gewohntes Gewicht ungewöhnlich schwer an, die Belastung verringern.',
  'Nach Übungen im Sitzen oder Liegen langsam aufstehen.',
  'Griffe locker halten, nicht verkrampfen.',
  'Bei Infekt, Fieber oder ungewohnter Erschöpfung nicht trainieren.',
  'Nicht direkt nach einer großen Mahlzeit trainieren.',
  'Ausreichend trinken.',
];

/** Warum die App nach Empfinden steuert und nicht nach Puls. */
export const FEEL_NOTE =
  'Dein Belastungsempfinden (RPE) und der Sprechtest zeigen zuverlässig, wie anstrengend ein Satz gerade ist – ganz ohne Pulsuhr. ' +
  'Faustformeln wie „220 minus Lebensalter“ passen dagegen oft nicht zur einzelnen Person.';

export const TALK_TEST =
  'Während der Übungen und beim Ausdauertraining solltest du dich jederzeit in ganzen Sätzen unterhalten können. ' +
  'Gelingt das nicht mehr, ist die Belastung zu hoch.';

export const SORENESS_NOTE =
  'Muskelkater nach ungewohnter Belastung ist normal: Er ist meist nach ein bis zwei Tagen am stärksten und klingt innerhalb einer Woche ab. ' +
  'Sehr starke oder anhaltende Schmerzen in Muskeln oder Gelenken solltest du abklären lassen.';

export const RPE_SCALE = [
  { value: 1, label: 'Sehr, sehr leicht', hint: 'Kaum spürbare Anstrengung' },
  { value: 2, label: 'Sehr leicht', hint: 'Atmung kaum verändert' },
  { value: 3, label: 'Leicht', hint: 'Unterhaltung problemlos möglich' },
  { value: 4, label: 'Mäßig', hint: 'Spürbar, Sprechen in ganzen Sätzen gut möglich' },
  { value: 5, label: 'Etwas anstrengend', hint: 'Sprechen in ganzen Sätzen noch möglich' },
  { value: 6, label: 'Anstrengend', hint: 'Kurze ganze Sätze gerade noch möglich – Obergrenze in diesem Plan' },
  { value: 7, label: 'Deutlich anstrengend', hint: 'In diesem Plan nicht vorgesehen' },
  { value: 8, label: 'Sehr anstrengend', hint: 'In diesem Plan nicht vorgesehen' },
  { value: 9, label: 'Extrem anstrengend', hint: 'In diesem Plan nicht vorgesehen' },
  { value: 10, label: 'Maximal', hint: 'In diesem Plan nicht vorgesehen' },
];

export const RPE_EXPLAINER =
  'RPE heißt „Rating of Perceived Exertion“: Du bewertest auf einer Skala von 1 bis 10, wie anstrengend sich ein Satz anfühlt. ' +
  'In diesem Plan endet jeder Satz deutlich vor der Erschöpfung – du könntest immer noch einige saubere Wiederholungen mehr schaffen.';

export const PRECHECK_ITEMS = [
  'Ich fühle mich heute gesund – kein Infekt, kein Fieber.',
  'Ich habe keine akuten Schmerzen oder ungewöhnlichen Beschwerden.',
];

export const WARMUP = {
  title: 'Aufwärmen',
  duration: '8–10 Min.',
  timerMin: 10,
  text: 'Locker auf dem Fahrrad-Ergometer, dem Laufband (gehen) oder dem Crosstrainer – RPE 2–3, Unterhaltung problemlos möglich.',
  extra: 'Danach 2–3 Minuten mobilisieren: Schulterkreisen, Armkreisen, Hüftkreisen, Marschieren auf der Stelle.',
};

export const COOLDOWN = {
  title: 'Abwärmen',
  duration: '5–10 Min.',
  timerMin: 8,
  text: 'Locker ausradeln oder gehen (RPE 2), bis sich die Atmung beruhigt hat. Nicht abrupt aufhören.',
  extra: 'Danach sanft dehnen: je 20–30 Sekunden, ohne Wippen und mit ruhiger Atmung.',
};

export const REST_DAYS =
  'An trainingsfreien Tagen tun Spaziergänge im Wohlfühltempo gut, zum Beispiel 20–30 Minuten.';

export const SESSION_FLOW = [
  { title: 'Vorab-Check', text: 'Kurz prüfen, ob du dich heute fit fühlst.' },
  { title: 'Aufwärmen', text: `${WARMUP.duration} locker, RPE 2–3, dann kurz mobilisieren.` },
  { title: 'Kraftübungen', text: 'Ruhig und kontrolliert, mit Pausen zwischen den Sätzen.' },
  { title: 'Ausdauer (optional)', text: 'Moderat nach den Kraftübungen – Dauer je nach Phase.' },
  { title: 'Abwärmen', text: `Zum Schluss ${COOLDOWN.duration} locker ausradeln oder gehen, dann sanft dehnen.` },
];

export const ABORT_REASONS = [
  'Warnzeichen oder Beschwerden',
  'Unwohlsein',
  'Zeitmangel',
  'Gerät belegt oder defekt',
  'Sonstiges',
];

export const WELLBEING = [
  { value: 1, emoji: '😣', label: 'Sehr schlecht' },
  { value: 2, emoji: '🙁', label: 'Schlecht' },
  { value: 3, emoji: '😐', label: 'Mittel' },
  { value: 4, emoji: '🙂', label: 'Gut' },
  { value: 5, emoji: '😄', label: 'Sehr gut' },
];

export const TIPS = [
  'Regelmäßigkeit schlägt Intensität: Zwei ruhige Einheiten pro Woche bringen langfristig mehr als eine harte.',
  'Atme bei jeder Wiederholung weiter – ausatmen beim Drücken oder Ziehen, einatmen beim Zurückführen.',
  'Muskeln wachsen in der Erholung. Zwischen zwei Krafteinheiten liegt mindestens ein Ruhetag.',
  'Ein Spaziergang an trainingsfreien Tagen fördert Ausdauer und Erholung – im Tempo, in dem du dich gut unterhalten kannst.',
  'Saubere Technik vor mehr Gewicht: Steigere erst, wenn sich alle Wiederholungen kontrolliert und leicht anfühlen.',
  'Guter Schlaf ist Teil des Trainings – nachts regeneriert sich die Muskulatur.',
  'Eiweißreiche Mahlzeiten unterstützen den Muskelaufbau – verteilt über den Tag.',
  'Krafttraining hilft, Muskelkraft im Alter zu erhalten – eine wichtige Grundlage für Selbstständigkeit und Lebensqualität.',
  'Steh nach Übungen im Sitzen oder Liegen langsam auf, damit der Kreislauf stabil bleibt.',
  'Halte die Griffe locker – festes Zupacken spannt unnötig an.',
  'Notiere Auffälligkeiten im Protokoll – so behältst du den Überblick über deine Entwicklung.',
  'Bei Infekt, Fieber oder ungewohnter Erschöpfung gilt: Pause statt Training.',
  'Der Sprechtest ist ein einfacher Maßstab: Kannst du in ganzen Sätzen sprechen, ist die Belastung moderat.',
  'Wärm dich 8–10 Minuten locker auf – das bereitet Kreislauf, Muskeln und Gelenke schonend vor.',
  'Kein Satz bis zur Erschöpfung: Beende jeden Satz, solange du noch einige Wiederholungen schaffen könntest.',
  'Jede absolvierte Einheit ist ein Baustein für langfristige Fitness – kleine Schritte zählen.',
  'Plane nach einer großen Mahlzeit etwas Abstand bis zum Training ein.',
  'Sanftes Dehnen nach dem Training erhält die Beweglichkeit – ohne Wippen und ohne die Luft anzuhalten.',
  'Fortschritt zeigt sich nicht nur auf der Waage: Achte auch auf Kraft, Alltagsfitness und Wohlbefinden.',
  'Trag deine Trainingstage fest in den Kalender ein – das macht die Routine leichter.',
  'Gute Haltung bei jeder Übung: Schultern locker unten, Rumpf stabil, bei Geräten mit Lehne den Rücken anlehnen.',
  'Mach regelmäßig eine Datensicherung – sie dauert nur ein paar Sekunden.',
];
